"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Search,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  QrCode,
  AlertTriangle,
  Crown,
  Layers,
  Syringe,
  Scissors,
  Printer,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import type { InventoryCategory } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";

const categoryList: { key: InventoryCategory | "all"; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "all", label: "全部", icon: Package },
  { key: "implant", label: "种植体", icon: Crown },
  { key: "orthodontics", label: "正畸耗材", icon: Layers },
  { key: "anesthesia", label: "麻药", icon: Syringe },
  { key: "suture", label: "缝合线", icon: Scissors },
  { key: "impression", label: "印模材料", icon: Printer },
  { key: "other", label: "其他", icon: MoreHorizontal },
];

const categoryLabelMap: Record<InventoryCategory, string> = {
  implant: "种植体",
  orthodontics: "正畸耗材",
  anesthesia: "麻药",
  suture: "缝合线",
  impression: "印模材料",
  other: "其他",
};

export default function InventoryPage() {
  const { inventoryItems } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<InventoryCategory | "all">("all");
  const [searchKeyword, setSearchKeyword] = useState("");

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = { all: inventoryItems.length };
    categoryList.forEach((c) => {
      if (c.key !== "all") {
        stats[c.key] = inventoryItems.filter((i) => i.category === c.key).length;
      }
    });
    return stats;
  }, [inventoryItems]);

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      if (activeCategory !== "all" && item.category !== activeCategory) return false;
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matchName = item.name.toLowerCase().includes(keyword);
        const matchBrand = item.brand.toLowerCase().includes(keyword);
        const matchModel = item.model?.toLowerCase().includes(keyword);
        if (!matchName && !matchBrand && !matchModel) return false;
      }
      return true;
    });
  }, [inventoryItems, activeCategory, searchKeyword]);

  const lowStockCount = useMemo(() => {
    return inventoryItems.filter((i) => i.currentStock <= i.safetyStock).length;
  }, [inventoryItems]);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">物资库存</h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {inventoryItems.length} 种物资，
            <span className="text-destructive font-medium">{lowStockCount} 种库存预警</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/inventory/purchase">
            <Button size="sm">
              <ArrowDownToLine className="h-4 w-4" />
              采购入库
            </Button>
          </Link>
          <Link href="/inventory/consume">
            <Button variant="outline" size="sm">
              <ArrowUpFromLine className="h-4 w-4" />
              消耗出库
            </Button>
          </Link>
          <Link href="/inventory/warnings">
            <Button variant="outline" size="sm" className="relative">
              <AlertTriangle className="h-4 w-4" />
              库存预警
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                  {lowStockCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <Card className="w-56 shrink-0">
          <CardContent className="p-3">
            <div className="space-y-1">
              {categoryList.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{cat.label}</span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {categoryStats[cat.key] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索物资名称、品牌、型号..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>物资名称</TableHead>
                    <TableHead>品牌</TableHead>
                    <TableHead>型号</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>库存</TableHead>
                    <TableHead>单位</TableHead>
                    <TableHead>预警阈值</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        暂无物资数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => {
                      const isLowStock = item.currentStock <= item.safetyStock;
                      const isHighValue = item.category === "implant";
                      return (
                        <TableRow
                          key={item.id}
                          className={cn(isLowStock && "bg-destructive/5")}
                        >
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
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(item.price)}/{item.unit}
                            </div>
                          </TableCell>
                          <TableCell>{item.brand}</TableCell>
                          <TableCell>{item.model || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{categoryLabelMap[item.category]}</Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "font-semibold",
                                isLowStock ? "text-destructive" : "text-foreground"
                              )}
                            >
                              {item.currentStock}
                            </span>
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-muted-foreground">{item.safetyStock}</TableCell>
                          <TableCell>
                            {isLowStock ? (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                库存不足
                              </Badge>
                            ) : (
                              <Badge variant="success">正常</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link href="/inventory/purchase">
                                <Button variant="ghost" size="icon" title="入库">
                                  <ArrowDownToLine className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href="/inventory/consume">
                                <Button variant="ghost" size="icon" title="出库">
                                  <ArrowUpFromLine className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href="/inventory/trace">
                                <Button variant="ghost" size="icon" title="追溯">
                                  <QrCode className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
