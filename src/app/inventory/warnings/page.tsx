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
} from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import type { InventoryCategory } from "@/types";

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

export default function WarningsPage() {
  const { inventoryItems, clinics, addPurchaseOrder } = useAppStore();

  const [clinicFilter, setClinicFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
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
              共 {warningItems.length} 种物资需要补货
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
          <Button size="sm" onClick={handleGeneratePurchaseOrder} disabled={generating}>
            <ShoppingCart className="h-4 w-4" />
            {generating ? "生成中..." : "一键生成采购单"}
          </Button>
        </div>
      </div>

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
                <SelectItem value="all">全部分类 ({categoryStats.all})</SelectItem>
                {Object.entries(categoryLabelMap).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label} ({categoryStats[key] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(clinicFilter !== "all" || categoryFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setClinicFilter("all");
                setCategoryFilter("all");
              }}
            >
              重置筛选
            </Button>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
