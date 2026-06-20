"use client";

import * as React from "react";
import { useAppStore } from "@/store";
import { formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/Modal";
import {
  Plus,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  Stethoscope,
  Scissors,
  Coffee,
  User,
  Calendar,
  Clock,
  Building2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import type { ScheduleType, Schedule } from "@/types";

const scheduleTypeMap: Record<ScheduleType, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  clinic: { label: "门诊", color: "text-blue-600", bg: "bg-blue-500/15", icon: Stethoscope },
  surgery: { label: "手术", color: "text-purple-600", bg: "bg-purple-500/15", icon: Scissors },
  rest: { label: "休息", color: "text-gray-600", bg: "bg-gray-500/15", icon: Coffee },
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function checkConflict(
  schedules: Schedule[],
  staffId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): Schedule[] {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  return schedules.filter((s) => {
    if (excludeId && s.id === excludeId) return false;
    if (s.staffId !== staffId || s.date !== date) return false;
    const sStartMin = timeToMinutes(s.startTime);
    const sEndMin = timeToMinutes(s.endTime);
    return startMin < sEndMin && endMin > sStartMin;
  });
}

interface FormData {
  staffId: string;
  clinicId: string;
  date: string;
  endDate: string;
  type: ScheduleType;
  startTime: string;
  endTime: string;
  repeat: "none" | "weekly";
}

const initialFormData: FormData = {
  staffId: "",
  clinicId: "",
  date: formatDate(new Date()),
  endDate: formatDate(new Date()),
  type: "clinic",
  startTime: "09:00",
  endTime: "18:00",
  repeat: "none",
};

export default function ScheduleSettingsPage() {
  const { schedules, clinics, staff, addSchedule, deleteSchedule } = useAppStore();
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [filterClinicId, setFilterClinicId] = React.useState<string>("all");
  const [filterStaffId, setFilterStaffId] = React.useState<string>("all");
  const [conflictModalOpen, setConflictModalOpen] = React.useState(false);
  const [conflictSchedules, setConflictSchedules] = React.useState<Schedule[]>([]);
  const [pendingSchedules, setPendingSchedules] = React.useState<Array<Omit<Schedule, "id" | "createdAt">>>([]);

  const doctors = React.useMemo(() => staff.filter((s) => s.role === "doctor" || s.role === "admin"), [staff]);

  const filteredSchedules = React.useMemo(() => {
    return schedules
      .filter((s) => {
        if (filterClinicId !== "all" && s.clinicId !== filterClinicId) return false;
        if (filterStaffId !== "all" && s.staffId !== filterStaffId) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });
  }, [schedules, filterClinicId, filterStaffId]);

  const getStaffName = (staffId: string) => staff.find((s) => s.id === staffId)?.name || "未知";
  const getClinicName = (clinicId: string) => clinics.find((c) => c.id === clinicId)?.name || "未知";

  const getDatesInRange = (startDate: string, endDate: string, repeat: "none" | "weekly"): string[] => {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (repeat === "none") {
      dates.push(formatDate(start));
      return dates;
    }

    const current = new Date(start);
    while (current <= end) {
      dates.push(formatDate(current));
      current.setDate(current.getDate() + 7);
    }
    return dates;
  };

  const validateAndPrepareSchedules = (): { hasConflict: boolean; conflicts: Schedule[]; prepared: Array<Omit<Schedule, "id" | "createdAt">> } => {
    const dates = getDatesInRange(formData.date, formData.endDate, formData.repeat);
    const prepared: Array<Omit<Schedule, "id" | "createdAt">> = [];
    const allConflicts: Schedule[] = [];

    for (const date of dates) {
      const conflicts = checkConflict(schedules, formData.staffId, date, formData.startTime, formData.endTime);
      if (conflicts.length > 0) {
        allConflicts.push(...conflicts);
      }
      prepared.push({
        staffId: formData.staffId,
        clinicId: formData.clinicId,
        date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        type: formData.type,
      });
    }

    return { hasConflict: allConflicts.length > 0, conflicts: allConflicts, prepared };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.staffId || !formData.clinicId) {
      return;
    }

    const { hasConflict, conflicts, prepared } = validateAndPrepareSchedules();

    if (hasConflict) {
      setConflictSchedules(conflicts);
      setPendingSchedules(prepared);
      setConflictModalOpen(true);
      return;
    }

    prepared.forEach((p) => addSchedule(p));
    setFormData(initialFormData);
  };

  const handleForceSave = () => {
    pendingSchedules.forEach((p) => addSchedule(p));
    setConflictModalOpen(false);
    setPendingSchedules([]);
    setFormData(initialFormData);
  };

  const handleCancelConflict = () => {
    setConflictModalOpen(false);
    setPendingSchedules([]);
  };

  const handleDelete = (id: string) => {
    deleteSchedule(id);
  };

  const isFormValid = formData.staffId && formData.clinicId && formData.date && formData.startTime && formData.endTime;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/schedule">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">排班设置</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" />
              新增排班
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                  医生
                </label>
                <Select value={formData.staffId} onValueChange={(v) => setFormData({ ...formData, staffId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择医生" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} - {d.title || "医生"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  门店
                </label>
                <Select value={formData.clinicId} onValueChange={(v) => setFormData({ ...formData, clinicId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择门店" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  班次类型
                </label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as ScheduleType })}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择班次类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinic">门诊</SelectItem>
                    <SelectItem value="surgery">手术</SelectItem>
                    <SelectItem value="rest">休息</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  重复方式
                </label>
                <Select value={formData.repeat} onValueChange={(v) => setFormData({ ...formData, repeat: v as "none" | "weekly" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择重复方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不重复</SelectItem>
                    <SelectItem value="weekly">每周重复</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.repeat === "none" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    日期
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      开始日期
                    </label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      结束日期
                    </label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    开始时间
                  </label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    结束时间
                  </label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={!isFormValid}>
                <Plus className="h-4 w-4" />
                {formData.repeat === "weekly" ? "批量添加排班" : "添加排班"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold">排班列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="w-48">
                <Select value={filterClinicId} onValueChange={setFilterClinicId}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部门店" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部门店</SelectItem>
                    {clinics.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Select value={filterStaffId} onValueChange={setFilterStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部医生" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部医生</SelectItem>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>医生</TableHead>
                    <TableHead>门店</TableHead>
                    <TableHead>班次</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        暂无排班记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchedules.map((sch) => {
                      const typeInfo = scheduleTypeMap[sch.type];
                      const TypeIcon = typeInfo.icon;
                      return (
                        <TableRow key={sch.id}>
                          <TableCell className="font-medium">{sch.date}</TableCell>
                          <TableCell>{getStaffName(sch.staffId)}</TableCell>
                          <TableCell>{getClinicName(sch.clinicId)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("gap-1", typeInfo.bg, typeInfo.color)}>
                              <TypeIcon className="h-3 w-3" />
                              {typeInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{sch.startTime} - {sch.endTime}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(sch.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal open={conflictModalOpen} onOpenChange={setConflictModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              排班冲突警告
            </ModalTitle>
            <ModalDescription>
              以下时段存在排班冲突，是否仍要保存？
            </ModalDescription>
          </ModalHeader>
          <div className="space-y-2 max-h-[300px] overflow-auto">
            {conflictSchedules.map((sch) => {
              const typeInfo = scheduleTypeMap[sch.type];
              const TypeIcon = typeInfo.icon;
              return (
                <div key={sch.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getStaffName(sch.staffId)}</span>
                      <Badge variant="outline" className={cn("gap-1", typeInfo.bg, typeInfo.color)}>
                        <TypeIcon className="h-3 w-3" />
                        {typeInfo.label}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {sch.date} {sch.startTime} - {sch.endTime} · {getClinicName(sch.clinicId)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={handleCancelConflict}>
              取消
            </Button>
            <Button variant="danger" onClick={handleForceSave}>
              仍要保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
