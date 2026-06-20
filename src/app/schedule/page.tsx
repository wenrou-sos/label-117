"use client";

import * as React from "react";
import { useAppStore } from "@/store";
import { cn, formatDate, getWeekDay } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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
  Settings,
  LayoutGrid,
  CalendarDays,
  Calendar as CalendarIcon,
  User,
  Clock,
  Stethoscope,
  Scissors,
  Coffee,
} from "lucide-react";
import Link from "next/link";
import type { ScheduleType } from "@/types";

const HOUR_HEIGHT = 48;
const START_HOUR = 8;
const END_HOUR = 21;

const scheduleTypeMap: Record<ScheduleType, { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  clinic: { label: "门诊", color: "text-blue-600", bg: "bg-blue-500/15", border: "border-blue-500", icon: Stethoscope },
  surgery: { label: "手术", color: "text-purple-600", bg: "bg-purple-500/15", border: "border-purple-500", icon: Scissors },
  rest: { label: "休息", color: "text-gray-600", bg: "bg-gray-500/15", border: "border-gray-500", icon: Coffee },
};

const scheduleTypeColors: Record<ScheduleType, string> = {
  clinic: "#3B82F6",
  surgery: "#8B5CF6",
  rest: "#6B7280",
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getMonthDates(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const startDate = new Date(year, month, 1 - startDay);
  const dates: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(d);
  }
  return dates;
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

export default function SchedulePage() {
  const { schedules, clinics, staff, selectedClinicId, setSelectedClinicId } = useAppStore();
  const [viewMode, setViewMode] = React.useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedStaffId, setSelectedStaffId] = React.useState<string>("all");

  const doctors = React.useMemo(() => staff.filter((s) => s.role === "doctor" || s.role === "admin"), [staff]);
  const monthDates = React.useMemo(() => getMonthDates(currentDate), [currentDate]);
  const weekDates = React.useMemo(() => getWeekDates(currentDate), [currentDate]);
  const displayDates = React.useMemo(() => {
    if (viewMode === "month") return monthDates;
    if (viewMode === "week") return weekDates;
    return [currentDate];
  }, [viewMode, monthDates, weekDates, currentDate]);

  const filteredSchedules = React.useMemo(() => {
    return schedules.filter((s) => {
      if (selectedClinicId && s.clinicId !== selectedClinicId) return false;
      if (selectedStaffId !== "all" && s.staffId !== selectedStaffId) return false;
      const dateStrs = displayDates.map((d) => formatDate(d));
      return dateStrs.includes(s.date);
    });
  }, [schedules, selectedClinicId, selectedStaffId, displayDates]);

  const getStaffName = (staffId: string) => staff.find((s) => s.id === staffId)?.name || "未知";
  const getClinicName = (clinicId: string) => clinics.find((c) => c.id === clinicId)?.name || "未知";

  const handleDateChange = (delta: number) => {
    const d = new Date(currentDate);
    if (viewMode === "day") {
      d.setDate(d.getDate() + delta);
    } else if (viewMode === "week") {
      d.setDate(d.getDate() + delta * 7);
    } else {
      d.setMonth(d.getMonth() + delta);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">排班日历</h1>
      </div>
      <Link href="/schedule/settings">
        <Button size="sm">
          <Settings className="h-4 w-4" />
          排班设置
        </Button>
      </Link>
    </div>
  );

  const renderFilters = () => (
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
          <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
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

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            门诊
          </Badge>
          <Badge variant="outline" className="gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            手术
          </Badge>
          <Badge variant="outline" className="gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            休息
          </Badge>
        </div>

        <div className="flex items-center gap-1 border rounded-md p-1 bg-muted ml-auto">
          <Button
            variant={viewMode === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("month")}
            className="h-7 px-2"
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1" />
            月
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("week")}
            className="h-7 px-2"
          >
            <CalendarDays className="h-3.5 w-3.5 mr-1" />
            周
          </Button>
          <Button
            variant={viewMode === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("day")}
            className="h-7 px-2"
          >
            <CalendarIcon className="h-3.5 w-3.5 mr-1" />
            日
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            今天
          </Button>
          <div className="flex items-center gap-1 px-3 min-w-[180px] justify-center">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {viewMode === "month"
                ? formatDate(currentDate, "yyyy年MM月")
                : viewMode === "week"
                ? `${formatDate(weekDates[0], "MM月dd日")} - ${formatDate(weekDates[6], "MM月dd日")}`
                : formatDate(currentDate, "yyyy年MM月dd日 ") + getWeekDay(currentDate)}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={() => handleDateChange(1)} className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderMonthView = () => {
    const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const currentMonth = currentDate.getMonth();

    return (
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="grid grid-cols-7 border-b">
            {weekDays.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDates.map((date, idx) => {
              const dateStr = formatDate(date);
              const isToday = formatDate(new Date()) === dateStr;
              const isCurrentMonth = date.getMonth() === currentMonth;
              const daySchedules = filteredSchedules.filter((s) => s.date === dateStr);

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[120px] p-2 border-b border-r last:border-r-0",
                    !isCurrentMonth && "bg-muted/30",
                    isToday && "bg-primary-50/50"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    !isCurrentMonth && "text-muted-foreground",
                    isToday && "text-primary"
                  )}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {daySchedules.slice(0, 3).map((sch) => {
                      const typeInfo = scheduleTypeMap[sch.type];
                      const TypeIcon = typeInfo.icon;
                      return (
                        <div
                          key={sch.id}
                          className={cn(
                            "flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] truncate",
                            typeInfo.bg,
                            typeInfo.color
                          )}
                        >
                          <TypeIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{getStaffName(sch.staffId)}</span>
                          <span className="shrink-0">{sch.startTime}</span>
                        </div>
                      );
                    })}
                    {daySchedules.length > 3 && (
                      <div className="text-[11px] text-muted-foreground">
                        +{daySchedules.length - 3} 更多
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderWeekView = () => {
    return (
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full overflow-auto">
          <div className="flex min-w-max h-full">
            <div className="w-16 flex-shrink-0 border-r bg-muted/30 sticky left-0 z-10">
              <div className="h-14 border-b bg-muted/50" />
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
              {weekDates.map((date) => {
                const dateStr = formatDate(date);
                const isToday = formatDate(new Date()) === dateStr;
                const daySchedules = filteredSchedules.filter((s) => s.date === dateStr);

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      "flex-1 min-w-[140px] border-r last:border-r-0",
                      isToday && "bg-primary-50/30"
                    )}
                  >
                    <div className={cn(
                      "h-14 border-b flex flex-col items-center justify-center sticky top-0 z-10 bg-background",
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
                      {daySchedules.map((sch) => {
                        const top = (timeToMinutes(sch.startTime) - START_HOUR * 60) * (HOUR_HEIGHT / 60);
                        const height = (timeToMinutes(sch.endTime) - timeToMinutes(sch.startTime)) * (HOUR_HEIGHT / 60);
                        const typeInfo = scheduleTypeMap[sch.type];
                        const TypeIcon = typeInfo.icon;
                        const color = scheduleTypeColors[sch.type];

                        return (
                          <div
                            key={sch.id}
                            className="absolute left-1 right-1 rounded-md p-1.5 text-xs shadow-sm overflow-hidden"
                            style={{
                              top: `${top}px`,
                              height: `${Math.max(height, 28)}px`,
                              backgroundColor: color + "20",
                              borderLeft: `3px solid ${color}`,
                            }}
                          >
                            <div className={cn("font-semibold truncate flex items-center gap-1", typeInfo.color)}>
                              <TypeIcon className="h-3 w-3 shrink-0" />
                              {getStaffName(sch.staffId)}
                            </div>
                            <div className="text-muted-foreground truncate flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {sch.startTime}-{sch.endTime}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDayView = () => {
    const dateStr = formatDate(currentDate);
    const daySchedules = filteredSchedules.filter((s) => s.date === dateStr);
    const dayDoctorIds = [...new Set(daySchedules.map((s) => s.staffId))];
    const displayDoctorIds = selectedStaffId !== "all"
      ? [selectedStaffId]
      : dayDoctorIds.length > 0
      ? dayDoctorIds
      : doctors.map((d) => d.id);

    return (
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full overflow-auto">
          <div className="flex min-w-max h-full">
            <div className="w-32 flex-shrink-0 border-r bg-muted/30 sticky left-0 z-10">
              <div className="h-14 border-b bg-muted/50" />
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
              {displayDoctorIds.map((doctorId) => {
                const doctor = staff.find((s) => s.id === doctorId);
                const doctorSchedules = daySchedules.filter((s) => s.staffId === doctorId);

                return (
                  <div
                    key={doctorId}
                    className="flex-1 min-w-[200px] border-r last:border-r-0"
                  >
                    <div className="h-14 border-b flex flex-col items-center justify-center sticky top-0 z-10 bg-background">
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">{doctor?.name || "未知医生"}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {doctor?.title || ""} {doctor?.specialty || ""}
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
                      {doctorSchedules.map((sch) => {
                        const top = (timeToMinutes(sch.startTime) - START_HOUR * 60) * (HOUR_HEIGHT / 60);
                        const height = (timeToMinutes(sch.endTime) - timeToMinutes(sch.startTime)) * (HOUR_HEIGHT / 60);
                        const typeInfo = scheduleTypeMap[sch.type];
                        const TypeIcon = typeInfo.icon;
                        const color = scheduleTypeColors[sch.type];

                        return (
                          <div
                            key={sch.id}
                            className="absolute left-2 right-2 rounded-lg p-2 text-xs shadow-sm overflow-hidden"
                            style={{
                              top: `${top}px`,
                              height: `${Math.max(height, 44)}px`,
                              backgroundColor: color + "20",
                              borderLeft: `3px solid ${color}`,
                            }}
                          >
                            <div className={cn("font-semibold flex items-center gap-1", typeInfo.color)}>
                              <TypeIcon className="h-3.5 w-3.5 shrink-0" />
                              {typeInfo.label}
                            </div>
                            <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {sch.startTime} - {sch.endTime}
                            </div>
                            <div className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {getClinicName(sch.clinicId)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {renderHeader()}
      {renderFilters()}
      {viewMode === "month" && renderMonthView()}
      {viewMode === "week" && renderWeekView()}
      {viewMode === "day" && renderDayView()}
    </div>
  );
}
