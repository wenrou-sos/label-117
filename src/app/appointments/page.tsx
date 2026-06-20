"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store";
import { formatDate, getWeekDay, cn } from "@/lib/utils";
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
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  Clock,
  Stethoscope,
  LayoutGrid,
  List,
} from "lucide-react";
import Link from "next/link";
import type { Appointment, AppointmentStatus } from "@/types";

const statusMap: Record<AppointmentStatus, { label: string; variant: "default" | "success" | "warning" | "secondary" | "destructive" }> = {
  pending: { label: "待确认", variant: "warning" },
  confirmed: { label: "已确认", variant: "default" },
  in_progress: { label: "进行中", variant: "success" },
  completed: { label: "已完成", variant: "secondary" },
  cancelled: { label: "已取消", variant: "destructive" },
  no_show: { label: "未到诊", variant: "destructive" },
};

const HOUR_HEIGHT = 64;
const START_HOUR = 8;
const END_HOUR = 21;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    dates.push(nd);
  }
  return dates;
}

function AppointmentCard({ appointment }: { appointment: Appointment & { patientName: string; staffName: string; treatmentName: string; treatmentColor: string } }) {
  const top = (timeToMinutes(appointment.startTime) - START_HOUR * 60) * (HOUR_HEIGHT / 60);
  const height = appointment.duration * (HOUR_HEIGHT / 60);
  const statusInfo = statusMap[appointment.status];

  return (
    <div
      className="absolute left-1 right-1 rounded-lg p-2 text-xs shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 40)}px`,
        backgroundColor: appointment.treatmentColor + "20",
        borderLeft: `3px solid ${appointment.treatmentColor}`,
      }}
    >
      <div className="font-semibold truncate" style={{ color: appointment.treatmentColor }}>
        {appointment.patientName}
      </div>
      <div className="text-muted-foreground truncate flex items-center gap-1">
        <Stethoscope className="h-3 w-3" />
        {appointment.treatmentName}
      </div>
      <div className="text-muted-foreground truncate flex items-center gap-1">
        <User className="h-3 w-3" />
        {appointment.staffName}
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {appointment.startTime}-{appointment.endTime}
        </div>
        <Badge variant={statusInfo.variant} className="px-1.5 py-0 text-[10px]">
          {statusInfo.label}
        </Badge>
      </div>
    </div>
  );
}

export default function AppointmentsBoardPage() {
  const { appointments, clinics, patients, staff, treatmentTypes, selectedClinicId, selectedDate, setSelectedClinicId, setSelectedDate } = useAppStore();

  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [treatmentTypeId, setTreatmentTypeId] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate));

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const displayDates = useMemo(
    () => (viewMode === "day" ? [currentDate] : weekDates),
    [viewMode, currentDate, weekDates]
  );

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (selectedClinicId && apt.clinicId !== selectedClinicId) return false;
      if (treatmentTypeId !== "all" && apt.treatmentTypeId !== treatmentTypeId) return false;
      const aptDate = apt.date;
      const dateStrs = displayDates.map((d) => formatDate(d));
      if (!dateStrs.includes(aptDate)) return false;
      return true;
    }).map((apt) => {
      const patient = patients.find((p) => p.id === apt.patientId);
      const doctor = staff.find((s) => s.id === apt.staffId);
      const treatment = treatmentTypes.find((t) => t.id === apt.treatmentTypeId);
      return {
        ...apt,
        patientName: patient?.name || "未知患者",
        staffName: doctor?.name || "未知医生",
        treatmentName: treatment?.name || "未知项目",
        treatmentColor: treatment?.color || "#64748B",
      };
    });
  }, [appointments, selectedClinicId, treatmentTypeId, displayDates, patients, staff, treatmentTypes]);

  const handleDateChange = (delta: number) => {
    const d = new Date(currentDate);
    if (viewMode === "day") {
      d.setDate(d.getDate() + delta);
    } else {
      d.setDate(d.getDate() + delta * 7);
    }
    setCurrentDate(d);
    setSelectedDate(formatDate(d));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(formatDate(today));
  };

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">预约看板</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/appointments/list">
            <Button variant="outline" size="sm">
              <List className="h-4 w-4" />
              预约列表
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
          <div className="w-48">
            <Select value={selectedClinicId || "all"} onValueChange={(v) => setSelectedClinicId(v === "all" ? null : v)}>
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
            <Select value={treatmentTypeId} onValueChange={setTreatmentTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="全部项目类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部项目类型</SelectItem>
                {treatmentTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 border rounded-md p-1 bg-muted">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("day")}
              className="h-7 px-2"
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1" />
              日视图
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("week")}
              className="h-7 px-2"
            >
              <Calendar className="h-3.5 w-3.5 mr-1" />
              周视图
            </Button>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)} className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              今天
            </Button>
            <div className="flex items-center gap-1 px-3 min-w-[160px] justify-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {viewMode === "day"
                  ? formatDate(currentDate, "yyyy年MM月dd日 ") + getWeekDay(currentDate)
                  : `${formatDate(weekDates[0], "MM月dd日")} - ${formatDate(weekDates[6], "MM月dd日")}`}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={() => handleDateChange(1)} className="h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full overflow-auto">
          <div className="flex min-w-max h-full">
            <div className="w-16 flex-shrink-0 border-r bg-muted/30 sticky left-0 z-10">
              <div className="h-12 border-b bg-muted/50" />
              {hours.map((h) => (
                <div
                  key={h}
                  className="text-xs text-muted-foreground text-right pr-2 pt-1 border-b"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            <div className="flex flex-1">
              {displayDates.map((date) => {
                const dateStr = formatDate(date);
                const isToday = formatDate(new Date()) === dateStr;
                const dayAppointments = filteredAppointments.filter((a) => a.date === dateStr);

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      "flex-1 min-w-[180px] border-r last:border-r-0",
                      isToday && "bg-primary-50/30"
                    )}
                  >
                    <div className={cn(
                      "h-12 border-b flex items-center justify-center flex-col sticky top-0 z-10 bg-background",
                      isToday && "bg-primary-50/50"
                    )}>
                      <div className="text-xs text-muted-foreground">{getWeekDay(date)}</div>
                      <div className={cn(
                        "text-sm font-semibold",
                        isToday && "text-primary"
                      )}>
                        {formatDate(date, "MM/dd")}
                      </div>
                    </div>
                    <div className="relative" style={{ height: `${hours.length * HOUR_HEIGHT}px` }}>
                      {hours.map((h) => (
                        <div
                          key={h}
                          className="border-b border-dashed"
                          style={{ height: `${HOUR_HEIGHT}px` }}
                        />
                      ))}
                      {dayAppointments.map((apt) => (
                        <AppointmentCard key={apt.id} appointment={apt} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
