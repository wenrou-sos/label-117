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
  ArrowUpFromLine,
  User,
  Search,
  CalendarClock,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { generateId } from "@/lib/utils";
import type { ConsumeOrderItem, InventoryItem } from "@/types";

interface ConsumeFormItem extends ConsumeOrderItem {
  _tempId: string;
}

export default function ConsumePage() {
  const { inventoryItems, clinics, patients, appointments, traceCodes, addConsumeOrder } = useAppStore();

  const [patientId, setPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [consumeDate, setConsumeDate] = useState(new Date().toISOString().split("T")[0]);
  const [clinicId, setClinicId] = useState(clinics[0]?.id || "");
  const [items, setItems] = useState<ConsumeFormItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return [];
    const keyword = patientSearch.toLowerCase();
    return patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(keyword) ||
          p.phone.includes(keyword)
      )
      .slice(0, 8);
  }, [patients, patientSearch]);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === patientId);
  }, [patients, patientId]);

  const patientAppointments = useMemo(() => {
    if (!patientId) return [];
    return appointments
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [appointments, patientId]);

  const addItem = () => {
    const newItem: ConsumeFormItem = {
      _tempId: generateId("tmp-"),
      id: "",
      itemId: "",
      quantity: 1,
      purpose: "",
    };
    setItems([...items, newItem]);
  };

  const removeItem = (tempId: string) => {
    setItems(items.filter((i) => i._tempId !== tempId));
  };

  const updateItem = (tempId: string, field: keyof ConsumeFormItem, value: string | number | undefined) => {
    setItems((prev) =>
      prev.map((item) => (item._tempId === tempId ? { ...item, [field]: value } as ConsumeFormItem : item))
    );
  };

  const getItemInfo = (itemId: string): InventoryItem | undefined => {
    return inventoryItems.find((i) => i.id === itemId);
  };

  const getAvailableTraceCodes = (itemId: string) => {
    return traceCodes.filter((tc) => tc.itemId === itemId && tc.status === "in_stock");
  };

  const handleSubmit = () => {
    if (!patientId) {
      alert("请选择患者");
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
      if (item.quantity <= 0) {
        alert("数量必须大于0");
        return;
      }
      const invItem = getItemInfo(item.itemId);
      if (!invItem) continue;
      if (invItem.currentStock < item.quantity) {
        alert(`「${invItem.name}」库存不足，当前库存：${invItem.currentStock}`);
        return;
      }
      if (invItem.category === "implant" && !item.traceCode) {
        alert(`高值耗材「${invItem.name}」必须选择追溯码`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const orderItems = items.map((item) => ({
        id: generateId("coi-"),
        itemId: item.itemId,
        batchId: item.batchId,
        quantity: item.quantity,
        traceCode: item.traceCode,
        purpose: item.purpose,
      }));
      addConsumeOrder({
        patientId,
        appointmentId: appointmentId || undefined,
        consumeDate,
        clinicId,
        items: orderItems,
      });
      alert("出库成功！");
      setPatientId("");
      setPatientSearch("");
      setAppointmentId("");
      setItems([]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPatient = (id: string, name: string) => {
    setPatientId(id);
    setPatientSearch(name);
    setShowPatientDropdown(false);
    setAppointmentId("");
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
          <h1 className="text-xl font-semibold">消耗出库</h1>
          <p className="text-sm text-muted-foreground">关联患者和预约，完成物资消耗出库</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            出库单信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <label className="text-sm font-medium">关联患者 <span className="text-destructive">*</span></label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索患者姓名或手机号"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setShowPatientDropdown(true);
                    if (patientId) setPatientId("");
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  className="pl-9"
                />
              </div>
              {showPatientDropdown && filteredPatients.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border bg-popover shadow-lg max-h-60 overflow-auto">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => handleSelectPatient(p.id, p.name)}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.phone}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedPatient && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 text-sm">
                  <Badge variant="default">{selectedPatient.name}</Badge>
                  <span className="text-muted-foreground">{selectedPatient.phone}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">关联预约（可选）</label>
              <Select value={appointmentId} onValueChange={setAppointmentId}>
                <SelectTrigger>
                  <SelectValue placeholder={patientId ? "选择预约" : "请先选择患者"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">不关联预约</SelectItem>
                  {patientAppointments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.date} {a.startTime} - {a.endTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {appointmentId && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarClock className="h-3 w-3" />
                  已关联预约
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">出库日期 <span className="text-destructive">*</span></label>
              <Input
                type="date"
                value={consumeDate}
                onChange={(e) => setConsumeDate(e.target.value)}
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
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpFromLine className="h-4 w-4" />
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
                <TableHead className="w-24 text-right">可用库存</TableHead>
                <TableHead className="w-24 text-right">数量</TableHead>
                <TableHead className="w-48">批号/追溯码</TableHead>
                <TableHead className="w-48">用途</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    暂无物资明细，点击「添加物资」按钮添加
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const invItem = getItemInfo(item.itemId);
                  const isHighValue = invItem?.category === "implant";
                  const availableCodes = item.itemId ? getAvailableTraceCodes(item.itemId) : [];
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
                      <TableCell className="text-right">
                        {invItem ? (
                          <span className={invItem.currentStock <= invItem.safetyStock ? "text-destructive font-semibold" : ""}>
                            {invItem.currentStock} {invItem.unit}
                          </span>
                        ) : (
                          "-"
                        )}
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
                        {isHighValue ? (
                          <Select
                            value={item.traceCode || ""}
                            onValueChange={(v) => updateItem(item._tempId, "traceCode", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择追溯码" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCodes.length === 0 ? (
                                <SelectItem value="" disabled>暂无可用追溯码</SelectItem>
                              ) : (
                                availableCodes.map((tc) => (
                                  <SelectItem key={tc.id} value={tc.code}>{tc.code}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">非高值耗材</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="如：种植牙手术"
                          value={item.purpose || ""}
                          onChange={(e) => updateItem(item._tempId, "purpose", e.target.value)}
                        />
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
          <div className="flex items-center gap-2">
            <Link href="/inventory">
              <Button variant="outline">取消</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "提交中..." : "确认出库"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
