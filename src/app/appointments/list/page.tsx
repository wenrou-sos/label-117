"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
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
  Search,
  Calendar,
  Eye,
  Pencil,
  XCircle,
  Plus,
  LayoutGrid,
  Receipt,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import type { AppointmentStatus, SettlementStatus } from "@/types";
import { SettlementModal } from "@/components/SettlementModal";

type EnrichedAppointment = {
  id: string;
  patientId: string;
  staffId: string;
  clinicId: string;
  treatmentTypeId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: AppointmentStatus;
  createdAt: string;
  patientName: string;
  patientPhone: string;
  staffName: string;
  clinicName: string;
  treatmentName: string;
  treatmentPrice: number;
  treatmentColor: string;
  settlementStatus: SettlementStatus;
  totalPaid: number;
  settlementId?: string;
};

const statusMap: Record<AppointmentStatus, { label: string; variant: "default" | "success" | "warning" | "secondary" | "destructive" }> = {
  pending: { label: "待确认", variant: "warning" },
  confirmed: { label: "已确认", variant: "default" },
  in_progress: { label: "进行中", variant: "success" },
  completed: { label: "已完成", variant: "secondary" },
  cancelled: { label: "已取消", variant: "destructive" },
  no_show: { label: "未到诊", variant: "destructive" },
};

export default function AppointmentsListPage() {
  const { appointments, clinics, patients, staff, treatmentTypes, settlements, updateAppointmentStatus } = useAppStore();

  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [settlementFilter, setSettlementFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<EnrichedAppointment | null>(null);
  const [viewingSettlementId, setViewingSettlementId] = useState<string | null>(null);

  const enrichedAppointments = useMemo(() => {
    return appointments
      .map((apt) => {
        const patient = patients.find((p) => p.id === apt.patientId);
        const doctor = staff.find((s) => s.id === apt.staffId);
        const clinic = clinics.find((c) => c.id === apt.clinicId);
        const treatment = treatmentTypes.find((t) => t.id === apt.treatmentTypeId);
        const aptSettlements = settlements.filter((s) => s.appointmentId === apt.id);
        const totalPaid = aptSettlements.reduce((sum, s) => sum + s.amountPaid, 0);
        const totalDiscount = aptSettlements.reduce((sum, s) => sum + s.discountAmount, 0);
        const receivable = treatment?.price || 0;
        let settlementStatus: SettlementStatus = "unsettled";
        if (aptSettlements.length > 0) {
          settlementStatus = totalPaid + totalDiscount >= receivable - 0.01 ? "settled" : "partial";
        }
        const lastSettlement = aptSettlements.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        return {
          ...apt,
          patientName: patient?.name || "未知患者",
          patientPhone: patient?.phone || "",
          staffName: doctor?.name || "未知医生",
          clinicName: clinic?.name || "未知门店",
          treatmentName: treatment?.name || "未知项目",
          treatmentPrice: treatment?.price || 0,
          treatmentColor: treatment?.color || "#64748B",
          settlementStatus,
          totalPaid,
          settlementId: lastSettlement?.id,
        };
      })
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.startTime.localeCompare(b.startTime);
      });
  }, [appointments, patients, staff, clinics, treatmentTypes, settlements]);

  const filteredAppointments = useMemo(() => {
    return enrichedAppointments.filter((apt) => {
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matchName = apt.patientName.toLowerCase().includes(keyword);
        const matchPhone = apt.patientPhone.includes(keyword);
        const matchTreatment = apt.treatmentName.toLowerCase().includes(keyword);
        if (!matchName && !matchPhone && !matchTreatment) return false;
      }
      if (statusFilter !== "all" && apt.status !== statusFilter) return false;
      if (settlementFilter !== "all" && apt.settlementStatus !== settlementFilter) return false;
      if (startDate && apt.date < startDate) return false;
      if (endDate && apt.date > endDate) return false;
      return true;
    });
  }, [enrichedAppointments, searchKeyword, statusFilter, settlementFilter, startDate, endDate]);

  const handleCancel = (aptId: string, patientName: string) => {
    if (confirm(`确定要取消 ${patientName} 的预约吗？`)) {
      updateAppointmentStatus(aptId, "cancelled");
    }
  };

  const handleSettlement = (apt: EnrichedAppointment) => {
    setSelectedAppointment(apt);
    if (apt.settlementStatus === "settled" && apt.settlementId) {
      setViewingSettlementId(apt.settlementId);
    } else {
      setViewingSettlementId(null);
    }
    setSettlementModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">预约列表</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/appointments">
            <Button variant="outline" size="sm">
              <LayoutGrid className="h-4 w-4" />
              预约看板
            </Button>
          </Link>
          <Link href="/appointments/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              新建预约
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索患者姓名、电话、项目..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="w-40">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {(Object.keys(statusMap) as AppointmentStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>{statusMap[status].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-40">
            <Select value={settlementFilter} onValueChange={setSettlementFilter}>
              <SelectTrigger>
                <SelectValue placeholder="全部结算" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部结算</SelectItem>
                <SelectItem value="unsettled">未结算</SelectItem>
                <SelectItem value="partial">部分结算</SelectItem>
                <SelectItem value="settled">已结算</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
            <span className="text-muted-foreground">至</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>

          {(searchKeyword || statusFilter !== "all" || startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchKeyword("");
                setStatusFilter("all");
                setStartDate("");
                setEndDate("");
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
                <TableHead>患者</TableHead>
                <TableHead>项目</TableHead>
                <TableHead>医生</TableHead>
                <TableHead>门店</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>预约状态</TableHead>
                <TableHead>结算状态</TableHead>
                <TableHead>金额</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    暂无预约数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((apt) => {
                  const statusInfo = statusMap[apt.status];
                  const settlementInfo = {
                    unsettled: { label: "未结算", variant: "warning" as const, icon: Clock },
                    partial: { label: "部分结算", variant: "secondary" as const, icon: Clock },
                    settled: { label: "已结算", variant: "success" as const, icon: CheckCircle },
                  }[apt.settlementStatus as "unsettled" | "partial" | "settled"];
                  const SettlementIcon = settlementInfo.icon;
                  return (
                    <TableRow key={apt.id}>
                      <TableCell>
                        <div className="font-medium">{apt.patientName}</div>
                        <div className="text-xs text-muted-foreground">{apt.patientPhone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: apt.treatmentColor }}
                          />
                          <span>{apt.treatmentName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{apt.staffName}</TableCell>
                      <TableCell>{apt.clinicName}</TableCell>
                      <TableCell>
                        <div>{formatDate(apt.date, "yyyy-MM-dd")}</div>
                        <div className="text-xs text-muted-foreground">
                          {apt.startTime} - {apt.endTime} ({apt.duration}分钟)
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={settlementInfo.variant} className="gap-1">
                          <SettlementIcon className="h-3 w-3" />
                          {settlementInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(apt.treatmentPrice)}</div>
                        {apt.totalPaid > 0 && (
                          <div className="text-xs text-muted-foreground">
                            已付：{formatCurrency(apt.totalPaid)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {apt.status === "completed" && apt.settlementStatus !== "settled" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="结算"
                              onClick={() => handleSettlement(apt)}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                          )}
                          {apt.settlementStatus === "settled" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="查看结算单"
                              onClick={() => handleSettlement(apt)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="查看">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="编辑">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {apt.status !== "cancelled" && apt.status !== "completed" && apt.status !== "no_show" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="取消"
                              onClick={() => handleCancel(apt.id, apt.patientName)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-3 text-sm text-muted-foreground">
        共 {filteredAppointments.length} 条预约记录
      </div>

      <SettlementModal
        open={settlementModalOpen}
        onOpenChange={(v) => {
          setSettlementModalOpen(v);
          if (!v) setViewingSettlementId(null);
        }}
        appointment={selectedAppointment}
        settlementId={viewingSettlementId}
      />
    </div>
  );
}
