"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store";
import { Bell, CheckCheck, ChevronRight, Calendar, CreditCard, AlertCircle, Scissors, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import type { NotificationType } from "@/types";

const typeIconMap: Record<NotificationType, React.ReactNode> = {
  appointment_new: <Calendar className="h-4 w-4" />,
  appointment_confirmed: <CheckCheck className="h-4 w-4" />,
  appointment_cancelled: <Scissors className="h-4 w-4" />,
  appointment_completed: <CheckCheck className="h-4 w-4" />,
  appointment_in_progress: <Stethoscope className="h-4 w-4" />,
  appointment_no_show: <AlertCircle className="h-4 w-4" />,
  appointment_reminder: <AlertCircle className="h-4 w-4" />,
  settlement_new: <CreditCard className="h-4 w-4" />,
  system: <Bell className="h-4 w-4" />,
};

const typeColorMap: Record<NotificationType, string> = {
  appointment_new: "text-blue-600 bg-blue-50",
  appointment_confirmed: "text-green-600 bg-green-50",
  appointment_cancelled: "text-destructive bg-destructive/10",
  appointment_completed: "text-green-600 bg-green-50",
  appointment_in_progress: "text-indigo-600 bg-indigo-50",
  appointment_no_show: "text-red-600 bg-red-50",
  appointment_reminder: "text-amber-600 bg-amber-50",
  settlement_new: "text-purple-600 bg-purple-50",
  system: "text-muted-foreground bg-muted",
};

interface NotificationBellProps {
  className?: string;
}

function getLocalDateStr(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    appointments,
    patients,
    staff,
    treatmentTypes,
    markNotificationRead,
    markNotificationsReadByIds,
    addNotification,
    currentUserId,
  } = useAppStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const remindedRef = useRef<Set<string>>(new Set());
  const currentUser = staff.find((member) => member.id === currentUserId);
  const currentUserClinicId = currentUser?.clinicId;

  const visibleNotifications = notifications.filter((n) => {
    if (n.staffId) {
      return !!currentUserId && n.staffId === currentUserId;
    }
    if (n.clinicId) {
      return !!currentUserClinicId && n.clinicId === currentUserClinicId;
    }
    return true;
  });

  const unreadCount = visibleNotifications.filter((n) => !n.read).length;
  const recentNotifications = visibleNotifications.slice(0, 5);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const checkUpcomingAppointments = () => {
      const now = new Date();
      const today = getLocalDateStr(now);
      const reminderWindow = 30 * 60 * 1000;

      appointments.forEach((apt) => {
        if (apt.date !== today) return;
        if (apt.status !== "pending" && apt.status !== "confirmed") return;
        if (remindedRef.current.has(apt.id)) return;

        const [hours, minutes] = apt.startTime.split(":").map(Number);
        const aptTime = new Date();
        aptTime.setHours(hours, minutes, 0, 0);

        const timeDiff = aptTime.getTime() - now.getTime();
        if (timeDiff > 0 && timeDiff <= reminderWindow) {
          const patient = patients.find((p) => p.id === apt.patientId);
          const doctor = staff.find((s) => s.id === apt.staffId);
          const treatment = treatmentTypes.find((t) => t.id === apt.treatmentTypeId);
          const minutesLeft = Math.round(timeDiff / 60000);

          addNotification({
            type: "appointment_reminder",
            priority: "high",
            title: `预约即将开始（${minutesLeft}分钟后）`,
            content: `${patient?.name || "未知患者"} 的${treatment?.name || "诊疗项目"}预约，${doctor?.name || "未知医生"} 接诊，${apt.startTime} 开始`,
            referenceId: apt.id,
            referenceType: "appointment",
            clinicId: apt.clinicId,
          });
          remindedRef.current.add(apt.id);
        }
      });
    };

    checkUpcomingAppointments();
    const interval = setInterval(checkUpcomingAppointments, 60000);
    return () => clearInterval(interval);
  }, [appointments, patients, staff, treatmentTypes, addNotification]);

  const handleNotificationClick = (id: string) => {
    markNotificationRead(id);
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markNotificationsReadByIds(visibleNotifications.map((n) => n.id));
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">通知</h3>
            <button
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              全部已读
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">暂无通知</p>
            </div>
            ) : (
              recentNotifications.map((notification) => (
                <button
                  key={notification.id}
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                    !notification.read && "bg-accent/30"
                  )}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      typeColorMap[notification.type]
                    )}
                  >
                    {typeIconMap[notification.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          !notification.read && "font-semibold"
                        )}
                      >
                        {notification.title}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(new Date(notification.createdAt)).split(" ")[1]?.slice(0, 5) || ""}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {notification.content}
                    </p>
                  </div>
                  {!notification.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="border-t p-2">
            <Link
              href="/notifications"
              className="flex items-center justify-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              查看全部通知
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
