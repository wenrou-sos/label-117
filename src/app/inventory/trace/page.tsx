"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  ArrowLeft,
  Search,
  QrCode,
  Package,
  User,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { cn, formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

const statusLabelMap: Record<string, { label: string; variant: "success" | "warning" | "secondary" | "destructive" }> = {
  in_stock: { label: "在库", variant: "success" },
  used: { label: "已使用", variant: "secondary" },
  returned: { label: "已退回", variant: "warning" },
};

const actionLabelMap: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  inbound: { label: "入库", icon: ArrowDownToLine, color: "text-green-600 bg-green-500/15" },
  outbound: { label: "出库", icon: ArrowUpFromLine, color: "text-amber-600 bg-amber-500/15" },
  used: { label: "已使用", icon: CheckCircle2, color: "text-blue-600 bg-blue-500/15" },
  returned: { label: "退回", icon: RotateCcw, color: "text-purple-600 bg-purple-500/15" },
};

export default function TracePage() {
  const { traceCodes, traceRecords, inventoryItems, inventoryBatches, patients, appointments, clinics, staff } = useAppStore();

  const [traceCode, setTraceCode] = useState("");
  const [searchedCode, setSearchedCode] = useState("");

  const traceInfo = useMemo(() => {
    if (!searchedCode) return null;
    const tc = traceCodes.find((t) => t.code === searchedCode);
    if (!tc) return null;
    const item = inventoryItems.find((i) => i.id === tc.itemId);
    const batch = inventoryBatches.find((b) => b.id === tc.batchId);
    const patient = tc.usedByPatientId ? patients.find((p) => p.id === tc.usedByPatientId) : null;
    const appointment = tc.appointmentId ? appointments.find((a) => a.id === tc.appointmentId) : null;
    const clinic = batch ? clinics.find((c) => c.id === batch.clinicId) : null;
    const records = traceRecords
      .filter((r) => r.traceCode === searchedCode)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { tc, item, batch, patient, appointment, clinic, records };
  }, [searchedCode, traceCodes, inventoryItems, inventoryBatches, patients, appointments, clinics, traceRecords]);

  const handleSearch = () => {
    if (!traceCode.trim()) {
      alert("请输入追溯码");
      return;
    }
    setSearchedCode(traceCode.trim());
  };

  const handleExampleClick = (code: string) => {
    setTraceCode(code);
    setSearchedCode(code);
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
          <h1 className="text-xl font-semibold">一物一码追溯</h1>
          <p className="text-sm text-muted-foreground">输入或扫描追溯码，查询物资全生命周期</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="请输入或扫描追溯码，如：NB-ACT-202601001-A003"
                value={traceCode}
                onChange={(e) => setTraceCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-11 h-11 text-base"
              />
            </div>
            <Button size="lg" onClick={handleSearch}>
              <Search className="h-4 w-4" />
              查询
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">快速查询：</span>
            {traceCodes.slice(0, 4).map((tc) => (
              <button
                key={tc.id}
                onClick={() => handleExampleClick(tc.code)}
                className="text-xs px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                {tc.code}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {searchedCode && !traceInfo && (
        <Card>
          <CardContent className="p-12 text-center">
            <QrCode className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">未找到追溯码「{searchedCode}」的相关信息</p>
            <p className="text-sm text-muted-foreground mt-1">请检查追溯码是否正确</p>
          </CardContent>
        </Card>
      )}

      {traceInfo && (
        <div className="grid gap-4 lg:grid-cols-5 flex-1 min-h-0">
          <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  物资基本信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">追溯码</div>
                    <div className="font-mono font-semibold text-primary">{traceInfo.tc.code}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">当前状态</div>
                    <Badge variant={statusLabelMap[traceInfo.tc.status]?.variant || "secondary"}>
                      {statusLabelMap[traceInfo.tc.status]?.label || traceInfo.tc.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">物资名称</div>
                    <div className="font-medium">{traceInfo.item?.name || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">品牌 / 型号</div>
                    <div>{traceInfo.item?.brand || "-"}{traceInfo.item?.model ? ` / ${traceInfo.item.model}` : ""}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">规格</div>
                    <div>{traceInfo.item?.unit || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">单价</div>
                    <div className="font-medium">{traceInfo.item ? formatCurrency(traceInfo.item.price) : "-"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  批次信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">批号</div>
                    <div className="font-medium font-mono">{traceInfo.batch?.batchNo || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">有效期</div>
                    <div>{traceInfo.batch?.expireDate ? formatDate(traceInfo.batch.expireDate) : "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">供应商</div>
                    <div>{traceInfo.batch?.supplier || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">所属门店</div>
                    <div>{traceInfo.clinic?.name || "-"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {traceInfo.patient && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    使用信息
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">使用患者</div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{traceInfo.patient.name}</div>
                          <div className="text-xs text-muted-foreground">{traceInfo.patient.phone}</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">使用时间</div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {traceInfo.tc.usedAt ? formatDateTime(traceInfo.tc.usedAt) : "-"}
                      </div>
                    </div>
                    {traceInfo.appointment && (
                      <div className="col-span-2">
                        <div className="text-xs text-muted-foreground mb-1">关联预约</div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(traceInfo.appointment.date)} {traceInfo.appointment.startTime} - {traceInfo.appointment.endTime}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="lg:col-span-2 overflow-hidden flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                追溯历史
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              <div className="p-6">
                {traceInfo.records.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无追溯记录</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[18px] top-2 bottom-2 w-px bg-border" />
                    <div className="space-y-6">
                      {traceInfo.records.map((record, idx) => {
                        const actionInfo = actionLabelMap[record.action];
                        const ActionIcon = actionInfo?.icon || Clock;
                        const recordClinic = clinics.find((c) => c.id === record.clinicId);
                        const recordPatient = record.patientId ? patients.find((p) => p.id === record.patientId) : null;
                        const recordOperator = record.operatorId ? staff.find((s) => s.id === record.operatorId) : null;
                        const isLast = idx === traceInfo.records.length - 1;
                        return (
                          <div key={record.id} className="relative pl-12">
                            <div
                              className={cn(
                                "absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full ring-4 ring-background",
                                actionInfo?.color || "bg-muted text-muted-foreground"
                              )}
                            >
                              <ActionIcon className="h-4 w-4" />
                            </div>
                            <div className={cn("rounded-lg border p-4", isLast && "border-primary/30 bg-primary/5")}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">{actionInfo?.label || record.action}</Badge>
                                  {isLast && <Badge variant="default">最新</Badge>}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(record.createdAt)}
                                </span>
                              </div>
                              {record.remark && (
                                <p className="text-sm mb-2">{record.remark}</p>
                              )}
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {recordClinic && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {recordClinic.name}
                                  </span>
                                )}
                                {recordPatient && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {recordPatient.name}
                                  </span>
                                )}
                                {recordOperator && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {recordOperator.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
