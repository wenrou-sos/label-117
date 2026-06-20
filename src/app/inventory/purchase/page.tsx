"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
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
  Plus,
  Trash2,
  ArrowDownToLine,
  RefreshCw,
  Crown,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, generateId } from "@/lib/utils";
import type { PurchaseOrderItem, InventoryItem } from "@/types";

interface PurchaseFormItem extends PurchaseOrderItem {
  _tempId: string;
  _traceCodesInput: string;
}

export default function PurchasePage() {
  const { inventoryItems, clinics, addPurchaseOrder } = useAppStore();

  const [supplier, setSupplier] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [clinicId, setClinicId] = useState(clinics[0]?.id || "");
  const [remark, setRemark] = useState("");
  const [items, setItems] = useState<PurchaseFormItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addItem = () => {
    const newItem: PurchaseFormItem = {
      _tempId: generateId("tmp-"),
      id: "",
      itemId: "",
      batchNo: "",
      quantity: 1,
      unitPrice: 0,
      expireDate: "",
      traceCodes: [],
      _traceCodesInput: "",
    };
    setItems([...items, newItem]);
  };

  const removeItem = (tempId: string) => {
    setItems(items.filter((i) => i._tempId !== tempId));
  };

  const updateItem = (tempId: string, field: keyof PurchaseFormItem, value: string | number | string[]) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item._tempId !== tempId) return item;
        if (field === "itemId") {
          const selectedItem = inventoryItems.find((i) => i.id === value);
          return {
            ...item,
            itemId: value as string,
            unitPrice: selectedItem?.price || 0,
          };
        }
        if (field === "_traceCodesInput") {
          const codes = (value as string)
            .split(/[,，\n\s]+/)
            .map((c) => c.trim())
            .filter(Boolean);
          return {
            ...item,
            _traceCodesInput: value as string,
            traceCodes: codes,
          };
        }
        return { ...item, [field]: value } as PurchaseFormItem;
      })
    );
  };

  const generateTraceCodes = (tempId: string) => {
    const item = items.find((i) => i._tempId === tempId);
    if (!item || !item.itemId) return;
    const invItem = inventoryItems.find((i) => i.id === item.itemId);
    if (!invItem) return;
    const prefix = invItem.name.substring(0, 3).toUpperCase().replace(/\s/g, "");
    const codes: string[] = [];
    for (let i = 0; i < item.quantity; i++) {
      const code = `${prefix}-${Date.now().toString(36).toUpperCase()}-${String(i + 1).padStart(3, "0")}`;
      codes.push(code);
    }
    updateItem(tempId, "_traceCodesInput", codes.join(", "));
  };

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [items]);

  const handleSubmit = () => {
    if (!supplier.trim()) {
      alert("请填写供应商");
      return;
    }
    if (!clinicId) {
      alert("请选择门店");
      return;
    }
    if (items.length === 0) {
      alert("请添加至少一条物资明细");
      return;
    }
    for (const item of items) {
      if (!item.itemId) {
        alert("请选择物资");
        return;
      }
      if (!item.batchNo.trim()) {
        alert("请填写批号");
        return;
      }
      if (item.quantity <= 0) {
        alert("数量必须大于0");
        return;
      }
      const invItem = inventoryItems.find((i) => i.id === item.itemId);
      if (invItem?.category === "implant" && (!item.traceCodes || item.traceCodes.length === 0)) {
        alert(`高值耗材「${invItem.name}」必须填写追溯码`);
        return;
      }
      if (invItem?.category === "implant" && item.traceCodes && item.traceCodes.length !== item.quantity) {
        alert(`「${invItem.name}」追溯码数量(${item.traceCodes.length})必须与数量(${item.quantity})一致`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const orderItems = items.map((item) => ({
        id: generateId("poi-"),
        itemId: item.itemId,
        batchNo: item.batchNo,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        expireDate: item.expireDate,
        traceCodes: item.traceCodes,
      }));
      addPurchaseOrder({
        supplier,
        orderDate,
        clinicId,
        remark,
        items: orderItems,
      });
      alert("入库成功！");
      setSupplier("");
      setRemark("");
      setItems([]);
    } finally {
      setSubmitting(false);
    }
  };

  const getItemInfo = (itemId: string): InventoryItem | undefined => {
    return inventoryItems.find((i) => i.id === itemId);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-2">
        <Link href="/inventory">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">采购入库</h1>
          <p className="text-sm text-muted-foreground">填写入库单信息，完成物资入库</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            入库单信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">供应商 <span className="text-destructive">*</span></label>
              <Input
                placeholder="请输入供应商名称"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">入库日期 <span className="text-destructive">*</span></label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">门店 <span className="text-destructive">*</span></label>
              <Select value={clinicId} onValueChange={setClinicId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择门店" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">备注</label>
              <Input
                placeholder="请输入备注信息"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            物资明细
          </CardTitle>
          <Button size="sm" onClick={addItem}>
            <Plus className="h-4 w-4" />
            添加物资
          </Button>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-48">物资名称 <span className="text-destructive">*</span></TableHead>
                <TableHead>品牌/型号</TableHead>
                <TableHead className="w-32">批号 <span className="text-destructive">*</span></TableHead>
                <TableHead className="w-32">有效期</TableHead>
                <TableHead className="w-24 text-right">数量</TableHead>
                <TableHead className="w-28 text-right">单价</TableHead>
                <TableHead className="w-28 text-right">金额</TableHead>
                <TableHead>追溯码（高值耗材必填）</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    暂无物资明细，点击「添加物资」按钮添加
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const invItem = getItemInfo(item.itemId);
                  const isHighValue = invItem?.category === "implant";
                  const amount = item.quantity * item.unitPrice;
                  return (
                    <TableRow key={item._tempId}>
                      <TableCell>
                        <Select
                          value={item.itemId}
                          onValueChange={(v) => updateItem(item._tempId, "itemId", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择物资" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryItems.map((i) => (
                              <SelectItem key={i.id} value={i.id}>
                                <div className="flex items-center gap-2">
                                  {i.category === "implant" && <Crown className="h-3 w-3 text-amber-500" />}
                                  {i.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {invItem ? (
                          <div>
                            <div className="font-medium">{invItem.brand}</div>
                            <div className="text-xs text-muted-foreground">{invItem.model || "-"}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                        {isHighValue && (
                          <Badge variant="warning" className="text-[10px] px-1.5 py-0 mt-1">
                            <Crown className="h-3 w-3 mr-0.5" />
                            高值
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="批号"
                          value={item.batchNo}
                          onChange={(e) => updateItem(item._tempId, "batchNo", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={item.expireDate}
                          onChange={(e) => updateItem(item._tempId, "expireDate", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(item._tempId, "quantity", parseInt(e.target.value) || 0)}
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item._tempId, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(amount)}
                      </TableCell>
                      <TableCell className="w-56">
                        {isHighValue ? (
                          <div className="space-y-1">
                            <Input
                              placeholder="多个追溯码用逗号分隔"
                              value={item._traceCodesInput}
                              onChange={(e) => updateItem(item._tempId, "_traceCodesInput", e.target.value)}
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {item.traceCodes?.length || 0}/{item.quantity} 个
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => generateTraceCodes(item._tempId)}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                自动生成
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">非高值耗材</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item._tempId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {items.length} 种物资
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-sm text-muted-foreground">合计金额：</span>
              <span className="text-2xl font-bold text-primary ml-2">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/inventory">
                <Button variant="outline">取消</Button>
              </Link>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "提交中..." : "确认入库"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
