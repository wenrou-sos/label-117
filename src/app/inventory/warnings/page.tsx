"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/Tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  ArrowLeft,
  AlertTriangle,
  Filter,
  ShoppingCart,
  Crown,
  MapPin,
  ArrowDownToLine,
  CalendarClock,
  AlertOctagon,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { parseISO, differenceInDays, startOfDay, endOfMonth } from "date-fns";
import type { InventoryCategory, InventoryBatch, InventoryItem, Clinic } from "@/types";

const categoryLabelMap: Record<InventoryCategory, string> = {
  implant: "种植体",
  orthodontics: "正畸耗材",
  anesthesia: "麻药",
  suture: "缝合线",
  impression: "印模材料",
  other: "其他",
};

const getSuggestedPurchase = (item: { currentStock: number; safetyStock: number }) => {
  const deficit = item.safetyStock * 2 - item.currentStock;
  return Math.max(deficit, item.safetyStock);
};

type ExpiryStatus = "expired" | "this_month" | "within_3_months" | "normal";

interface BatchWithInfo extends InventoryBatch {
  item: InventoryItem | undefined;
  clinic: Clinic | undefined;
  daysToExpiry: number;
  expiryStatus: ExpiryStatus;
}

const getExpiryStatus = (daysToExpiry: number, today: Date): ExpiryStatus => {
  if (daysToExpiry < 0) return "expired";
  const endOfCurrentMonth = endOfMonth(today);
  const daysUntilEndOfMonth = differenceInDays(endOfCurrentMonth, today) + 1;
  if (daysToExpiry <= daysUntilEndOfMonth) return "this_month";
  if (daysToExpiry <= 90) return "within_3_months";
  return "normal";
};

const expiryStatusConfig: Record<ExpiryStatus, {
  label: string;
  variant: "destructive" | "warning" | "secondary" | "success";
  className: string;
  icon: React.ReactNode;
}> = {
  expired: {
    label: "已过期",
    variant: "destructive",
    className: "bg-destructive/15 hover:bg-destructive/20",
    icon: <XCircle className="h-4 w-4 mr-1" />,
  },
  this_month: {
    label: "本月过期",
    variant: "destructive",
    className: "bg-red-500/10",
    icon: <AlertOctagon className="h-4 w-4 mr-1" />,
  },
  within_3_months: {
    label: "三月内过期",
    variant: "warning",
    className: "bg-amber-500/10",
    icon: <Clock className="h-4 w-4 mr-1" />,
  },
  normal: {
    label: "正常",
    variant: "success",
    className: "bg-green-500/10",
    icon: <CheckCircle2 className="h-4 w-4 mr-1" />,
  },
};

export default function WarningsPage() {
  const { inventoryItems, inventoryBatches, clinics, addPurchaseOrder } = useAppStore();

  const [tab, setTab] = useState<string>("stock");
  const [clinicFilter, setClinicFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expiryFilter, setExpiryFilter] = useState<string>("all");
  const [generating, setGenerating] = useState(false);

  const warningItems = useMemo(() => {
    return inventoryItems
      .filter((item) => {
        if (clinicFilter !== "all" && item.clinicId !== clinicFilter) return false;
        return item.currentStock <= item.safetyStock;
      })
      .sort((a, b) => {
        const ratioA = a.currentStock / Math.max(a.safetyStock, 1);
        const ratioB = b.currentStock / Math.max(b.safetyStock, 1);
        return ratioA - ratioB;
      });
  }, [inventoryItems, clinicFilter]);

  const filteredItems = useMemo(() => {
    return warningItems.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      return true;
    });
  }, [warningItems, categoryFilter]);

  const categoryStats = useMemo(() => {
    const allItems = inventoryItems.filter((item) => {
      if (clinicFilter !== "all" && item.clinicId !== clinicFilter) return false;
      return item.currentStock <= item.safetyStock;
    });
    const stats: Record<string, number> = { all: allItems.length };
    Object.keys(categoryLabelMap).forEach((key) => {
      stats[key] = allItems.filter((i) => i.category === key).length;
    });
    return stats;
  }, [inventoryItems, clinicFilter]);

  const totalSuggestedAmount = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + getSuggestedPurchase(item) * item.price, 0);
  }, [filteredItems]);

  const expiryWarningBatches = useMemo((): BatchWithInfo[] => {
    const today = startOfDay(new Date());
    return inventoryBatches
      .filter((batch) => {
        if (!batch.expireDate) return false;
        if (clinicFilter !== "all" && batch.clinicId !== clinicFilter) return false;
        const expiryDate = parseISO(batch.expireDate);
        const daysToExpiry = differenceInDays(expiryDate, today);
        const status = getExpiryStatus(daysToExpiry, today);
        return status !== "normal";
      })
      .map((batch): BatchWithInfo => {
        const expiryDate = parseISO(batch.expireDate!);
        const daysToExpiry = differenceInDays(expiryDate, today);
        return {
          ...batch,
          item: inventoryItems.find((i) => i.id === batch.itemId),
          clinic: clinics.find((c) => c.id === batch.clinicId),
          daysToExpiry,
          expiryStatus: getExpiryStatus(daysToExpiry, today),
        };
      })
      .sort((a, b) => {
        const priority: Record<ExpiryStatus, number> = {
          expired: 0,
          this_month: 1,
          within_3_months: 2,
          normal: 3,
        };
        const pA = priority[a.expiryStatus];
        const pB = priority[b.expiryStatus];
        if (pA !== pB) return pA - pB;
        return a.daysToExpiry - b.daysToExpiry;
      });
  }, [inventoryBatches, inventoryItems, clinics, clinicFilter]);

  const filteredExpiryBatches = useMemo(() => {
    return expiryWarningBatches.filter((batch) => {
      if (categoryFilter !== "all" && batch.item?.category !== categoryFilter) return false;
      if (expiryFilter !== "all" && batch.expiryStatus !== expiryFilter) return false;
      return true;
    });
  }, [expiryWarningBatches, categoryFilter, expiryFilter]);

  const expiryStats = useMemo(() => {
    const stats: Record<string, number> = {
      all: expiryWarningBatches.length,
      expired: expiryWarningBatches.filter((b) => b.expiryStatus === "expired").length,
      this_month: expiryWarningBatches.filter((b) => b.expiryStatus === "this_month").length,
      within_3_months: expiryWarningBatches.filter((b) => b.expiryStatus === "within_3_months").length,
    };
    return stats;
  }, [expiryWarningBatches]);

  const handleHandleExpiredBatch = () => {
    if (confirm("确认该批次已处理？处理后将从预警列表移除。")) {
      alert("已标记为处理（示例功能）");
    }
  };

  const handleGeneratePurchaseOrder = () => {
    if (filteredItems.length === 0) {
      alert("没有需要采购的物资");
      return;
    }
    const targetClinicId = clinicFilter !== "all" ? clinicFilter : clinics[0]?.id;
    if (!targetClinicId) {
      alert("请选择门店");
      return;
    }
    setGenerating(true);
    try {
      const brandMap: Record<string, string> = {
        "诺贝尔(Nobel)": "NB",
        "士卓曼(Straumann)": "STM",
        "奥齿泰(Osstem)": "OST",
      };
      const items = filteredItems.map((item) => {
        const qty = getSuggestedPurchase(item);
        const traceCodes: string[] | undefined = item.category === "implant" ? [] : undefined;
        if (item.category === "implant") {
          const prefix = brandMap[item.brand] || "IMP";
          const ts = Date.now().toString(36).toUpperCase();
          for (let i = 0; i < qty; i++) {
            const seq = String(i + 1).padStart(4, "0");
            const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
            traceCodes!.push(`${prefix}-${ts}${seq}-${rand}`);
          }
        }
        return {
          id: "",
          itemId: item.id,
          batchNo: `AUTO-${Date.now().toString(36).toUpperCase()}-${item.id.slice(-3)}`,
          quantity: qty,
          unitPrice: item.price,
          expireDate: "",
          traceCodes,
        };
      });
      addPurchaseOrder({
        supplier: "系统自动生成采购单",
        orderDate: new Date().toISOString().split("T")[0],
        clinicId: targetClinicId,
        remark: `由库存预警自动生成，共 ${filteredItems.length} 种物资`,
        items,
      });
      alert(`采购单已生成！共 ${filteredItems.length} 种物资，预估金额 ${formatCurrency(totalSuggestedAmount)}`);
    } finally {
      setGenerating(false);
    }
  };

  const getStockLevel = (current: number, safety: number) => {
    const ratio = current / Math.max(safety, 1);
    if (ratio <= 0.3) return { label: "严重不足", variant: "destructive" as const, className: "bg-destructive/10" };
    if (ratio <= 0.6) return { label: "库存偏低", variant: "warning" as const, className: "bg-warning/10" };
    return { label: "即将预警", variant: "secondary" as const, className: "bg-secondary/50" };
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              库存预警
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {tab === "stock"
                ? `共 ${warningItems.length} 种物资需要补货`
                : `共 ${expiryWarningBatches.length} 个批次临近或已过期`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/inventory/purchase">
            <Button variant="outline" size="sm">
              <ArrowDownToLine className="h-4 w-4" />
              手动入库
            </Button>
          </Link>
          {tab === "stock" && (
            <Button size="sm" onClick={handleGeneratePurchaseOrder} disabled={generating}>
              <ShoppingCart className="h-4 w-4" />
              {generating ? "生成中..." : "一键生成采购单"}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stock">
            <AlertTriangle className="h-4 w-4 mr-2" />
            数量预警
          </TabsTrigger>
          <TabsTrigger value="expiry">
            <CalendarClock className="h-4 w-4 mr-2" />
            效期预警
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <div className="grid gap-4 md:grid-cols-4">
            {warningItems.length > 0 && (
              <>
                <Card className="md:col-span-2 bg-destructive/5 border-destructive/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">严重不足</p>
                        <p className="text-2xl font-bold text-destructive">
                          {warningItems.filter((i) => i.currentStock / Math.max(i.safetyStock, 1) <= 0.3).length} 种
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/5 border-amber-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15">
                        <AlertTriangle className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">库存偏低</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {warningItems.filter((i) => {
                            const ratio = i.currentStock / Math.max(i.safetyStock, 1);
                            return ratio > 0.3 && ratio <= 0.6;
                          }).length} 种
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                        <ShoppingCart className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">预估采购金额</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(totalSuggestedAmount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="expiry">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15">
                    <XCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">已过期</p>
                    <p className="text-2xl font-bold text-destructive">
                      {expiryStats.expired} 批次
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15">
                    <AlertOctagon className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">本月过期</p>
                    <p className="text-2xl font-bold text-red-600">
                      {expiryStats.this_month} 批次
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">三月内过期</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {expiryStats.within_3_months} 批次
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            筛选：
          </div>
          <div className="w-48">
            <Select value={clinicFilter} onValueChange={setClinicFilter}>
              <SelectTrigger>
                <SelectValue placeholder="全部门店" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部门店</SelectItem>
                {clinics.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="全部分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类 ({tab === "stock" ? categoryStats.all : expiryStats.all})</SelectItem>
                {Object.entries(categoryLabelMap).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label} ({tab === "stock" ? categoryStats[key] || 0 : ""})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {tab === "expiry" && (
            <div className="w-44">
              <Select value={expiryFilter} onValueChange={setExpiryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态 ({expiryStats.all})</SelectItem>
                  <SelectItem value="expired">已过期 ({expiryStats.expired})</SelectItem>
                  <SelectItem value="this_month">本月过期 ({expiryStats.this_month})</SelectItem>
                  <SelectItem value="within_3_months">三月内过期 ({expiryStats.within_3_months})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {(clinicFilter !== "all" || categoryFilter !== "all" || expiryFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setClinicFilter("all");
                setCategoryFilter("all");
                setExpiryFilter("all");
              }}
            >
              重置筛选
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs value={tab}>
        <TabsContent value="stock">
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-0 h-full overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>物资名称</TableHead>
                    <TableHead>品牌型号</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead className="text-right">当前库存</TableHead>
                    <TableHead className="text-right">预警阈值</TableHead>
                    <TableHead className="text-right">差额</TableHead>
                    <TableHead className="text-right">建议采购量</TableHead>
                    <TableHead className="text-right">预估金额</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        {warningItems.length === 0 ? "暂无库存预警，所有物资库存充足" : "当前筛选条件下无预警物资"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => {
                      const stockLevel = getStockLevel(item.currentStock, item.safetyStock);
                      const deficit = item.safetyStock - item.currentStock;
                      const suggestQty = getSuggestedPurchase(item);
                      const suggestAmount = suggestQty * item.price;
                      const isHighValue = item.category === "implant";
                      return (
                        <TableRow key={item.id} className={cn(stockLevel.className)}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.name}</span>
                              {isHighValue && (
                                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                                  <Crown className="h-3 w-3 mr-0.5" />
                                  高值
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.brand}</div>
                            <div className="text-xs text-muted-foreground">{item.model || "-"}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{categoryLabelMap[item.category]}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-destructive">{item.currentStock}</span>
                            <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {item.safetyStock}
                            <span className="text-xs ml-1">{item.unit}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-destructive font-medium">-{deficit}</span>
                            <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {suggestQty}
                            <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(suggestAmount)}</TableCell>
                          <TableCell>
                            <Badge variant={stockLevel.variant}>{stockLevel.label}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {filteredItems.length > 0 && (
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  共 {filteredItems.length} 种预警物资，建议采购总量 {filteredItems.reduce((sum, i) => sum + getSuggestedPurchase(i), 0)} {filteredItems[0]?.unit || ""}
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">预估采购总金额：</span>
                    <span className="text-2xl font-bold text-primary ml-2">{formatCurrency(totalSuggestedAmount)}</span>
                  </div>
                  <Button onClick={handleGeneratePurchaseOrder} disabled={generating} size="lg">
                    <ShoppingCart className="h-4 w-4" />
                    {generating ? "生成中..." : "一键生成采购单"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expiry">
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-0 h-full overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>物资名称</TableHead>
                    <TableHead>批次号</TableHead>
                    <TableHead>所属门店</TableHead>
                    <TableHead className="text-right">剩余数量</TableHead>
                    <TableHead className="text-right">过期日期</TableHead>
                    <TableHead className="text-right">剩余天数</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpiryBatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        {expiryWarningBatches.length === 0
                          ? "暂无临近或已过期批次，所有批次效期正常"
                          : "当前筛选条件下无效期预警批次"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpiryBatches.map((batch) => {
                      const statusConfig = expiryStatusConfig[batch.expiryStatus];
                      const isHighValue = batch.item?.category === "implant";
                      const daysLabel =
                        batch.daysToExpiry < 0
                          ? `已过期 ${Math.abs(batch.daysToExpiry)} 天`
                          : batch.daysToExpiry === 0
                          ? "今天到期"
                          : `${batch.daysToExpiry} 天`;
                      return (
                        <TableRow key={batch.id} className={cn(statusConfig.className)}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{batch.item?.name || "未知物资"}</span>
                              {isHighValue && (
                                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                                  <Crown className="h-3 w-3 mr-0.5" />
                                  高值
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {batch.item?.brand} {batch.item?.model || ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">{batch.batchNo}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{batch.clinic?.name || "未知门店"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "font-semibold",
                              batch.expiryStatus === "expired" && "text-destructive",
                              batch.expiryStatus === "this_month" && "text-red-600"
                            )}>
                              {batch.remainingQuantity}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">
                              {batch.item?.unit || ""}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium">{formatDate(batch.expireDate!)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "font-semibold",
                              batch.expiryStatus === "expired" && "text-destructive",
                              batch.expiryStatus === "this_month" && "text-red-600",
                              batch.expiryStatus === "within_3_months" && "text-amber-600"
                            )}>
                              {daysLabel}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusConfig.variant}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {batch.expiryStatus === "expired" && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleHandleExpiredBatch()}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                标记处理
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {filteredExpiryBatches.length > 0 && (
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  共 {filteredExpiryBatches.length} 个预警批次
                  {expiryStats.expired > 0 && (
                    <span className="text-destructive ml-3">
                      其中已过期 {expiryStats.expired} 批次，请尽快处理
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-destructive/20 border border-destructive/40" />
                    <span className="text-muted-foreground">已过期</span>
                    <span className="font-semibold text-destructive">{expiryStats.expired}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-red-500/20 border border-red-500/40" />
                    <span className="text-muted-foreground">本月过期</span>
                    <span className="font-semibold text-red-600">{expiryStats.this_month}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm bg-amber-500/20 border border-amber-500/40" />
                    <span className="text-muted-foreground">三月内过期</span>
                    <span className="font-semibold text-amber-600">{expiryStats.within_3_months}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
