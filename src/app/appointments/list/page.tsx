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
} from "lucide-react";
import Link from "next/link";
import type { AppointmentStatus } from "@/types";

const statusMap: Record<AppointmentStatus, { label: string; variant: "default" | "success" | "warning" | "secondary" | "destructive" }> = {
  pending: { label: "待确认", variant: "warning" },
  confirmed: { label: "已确认", variant: "default" },
  in_progress: { label: "进行中", variant: "success" },
  completed: { label: "已完成", variant: "secondary" },
  cancelled: { label: "已取消", variant: "destructive" },
  no_show: { label: "未到诊", variant: "destructive" },
};

export default function AppointmentsListPage() {
  const { appointments, clinics, patients, staff, treatmentTypes, updateAppointmentStatus } = useAppStore();

  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const enrichedAppointments = useMemo(() => {
    return appointments
      .map((apt) => {
        const patient = patients.find((p) => p.id === apt.patientId);
        const doctor = staff.find((s) => s.id === apt.staffId);
        const clinic = clinics.find((c) => c.id === apt.clinicId);
        const treatment = treatmentTypes.find((t) => t.id === apt.treatmentTypeId);
        return {
          ...apt,
          patientName: patient?.name || "未知患者",
          patientPhone: patient?.phone || "",
          staffName: doctor?.name || "未知医生",
          clinicName: clinic?.name || "未知门店",
          treatmentName: treatment?.name || "未知项目",
          treatmentPrice: treatment?.price || 0,
          treatmentColor: treatment?.color || "#64748B",
        };
      })
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.startTime.localeCompare(b.startTime);
      });
  }, [appointments, patients, staff, clinics, treatmentTypes]);

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
      if (startDate && apt.date < startDate) return false;
      if (endDate && apt.date > endDate) return false;
      return true;
    });
  }, [enrichedAppointments, searchKeyword, statusFilter, startDate, endDate]);

  const handleCancel = (aptId: string, patientName: string) => {
    if (confirm(`确定要取消 ${patientName} 的预约吗？`)) {
      updateAppointmentStatus(aptId, "cancelled");
    }
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
                <TableHead>状态</TableHead>
                <TableHead>金额</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    暂无预约数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((apt) => {
                  const statusInfo = statusMap[apt.status];
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
                      <TableCell>{formatCurrency(apt.treatmentPrice)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
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
    </div>
  );
}
