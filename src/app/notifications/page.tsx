"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store";
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
  Bell,
  Calendar,
  CheckCheck,
  Scissors,
  AlertCircle,
  CreditCard,
  Trash2,
  MailOpen,
  Mail,
  Stethoscope,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import type { NotificationType, NotificationPriority } from "@/types";

const typeLabelMap: Record<NotificationType, string> = {
  appointment_new: "新预约",
  appointment_confirmed: "预约确认",
  appointment_cancelled: "预约取消",
  appointment_completed: "预约完成",
  appointment_in_progress: "诊疗中",
  appointment_no_show: "患者未到",
  appointment_reminder: "预约提醒",
  settlement_new: "结算通知",
  system: "系统通知",
};

const typeIconMap: Record<NotificationType, React.ReactNode> = {
  appointment_new: <Calendar className="h-5 w-5" />,
  appointment_confirmed: <CheckCheck className="h-5 w-5" />,
  appointment_cancelled: <Scissors className="h-5 w-5" />,
  appointment_completed: <CheckCheck className="h-5 w-5" />,
  appointment_in_progress: <Stethoscope className="h-5 w-5" />,
  appointment_no_show: <AlertCircle className="h-5 w-5" />,
  appointment_reminder: <AlertCircle className="h-5 w-5" />,
  settlement_new: <CreditCard className="h-5 w-5" />,
  system: <Bell className="h-5 w-5" />,
};

const typeColorMap: Record<NotificationType, string> = {
  appointment_new: "text-blue-600 bg-blue-50 border-blue-200",
  appointment_confirmed: "text-green-600 bg-green-50 border-green-200",
  appointment_cancelled: "text-destructive bg-destructive/10 border-destructive/20",
  appointment_completed: "text-green-600 bg-green-50 border-green-200",
  appointment_in_progress: "text-indigo-600 bg-indigo-50 border-indigo-200",
  appointment_no_show: "text-red-600 bg-red-50 border-red-200",
  appointment_reminder: "text-amber-600 bg-amber-50 border-amber-200",
  settlement_new: "text-purple-600 bg-purple-50 border-purple-200",
  system: "text-muted-foreground bg-muted border-border",
};

const priorityLabelMap: Record<NotificationPriority, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const priorityVariantMap: Record<NotificationPriority, "default" | "secondary" | "destructive"> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
};

export default function NotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    markNotificationsReadByIds,
    clearNotificationsByIds,
    selectedClinicId,
    currentUserId,
  } = useAppStore();

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("mine");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (scopeFilter === "mine") {
        if (n.staffId && currentUserId && n.staffId !== currentUserId) return false;
        if (selectedClinicId && n.clinicId && n.clinicId !== selectedClinicId) return false;
      }
      if (scopeFilter === "clinic" && selectedClinicId && n.clinicId && n.clinicId !== selectedClinicId) {
        return false;
      }
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      if (readFilter === "unread" && n.read) return false;
      if (readFilter === "read" && !n.read) return false;
      return true;
    });
  }, [notifications, typeFilter, readFilter, scopeFilter, selectedClinicId, currentUserId]);

  const visibleNotificationsAll = useMemo(() => {
    return notifications.filter((n) => {
      if (n.staffId && currentUserId && n.staffId !== currentUserId) return false;
      if (selectedClinicId && n.clinicId && n.clinicId !== selectedClinicId) return false;
      return true;
    });
  }, [notifications, selectedClinicId, currentUserId]);

  const unreadCount = visibleNotificationsAll.filter((n) => !n.read).length;

  const visibleIds = filteredNotifications.map((n) => n.id);
  const visibleUnreadCount = filteredNotifications.filter((n) => !n.read).length;

  const handleMarkAllVisibleRead = () => {
    markNotificationsReadByIds(visibleIds);
  };

  const handleClearVisible = () => {
    const scopeLabel =
      scopeFilter === "mine" ? "我的" : scopeFilter === "clinic" ? "本门店" : "全部";
    if (confirm(`确定要清空当前${scopeLabel}可见的 ${filteredNotifications.length} 条通知吗？此操作不可恢复。`)) {
      clearNotificationsByIds(visibleIds);
    }
  };

  const handleNotificationClick = (id: string) => {
    markNotificationRead(id);
  };

  // 按日期分组
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, typeof notifications> = {};
    filteredNotifications.forEach((n) => {
      const date = n.createdAt.split("T")[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(n);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredNotifications]);

  const formatDateLabel = (dateStr: string) => {
    return formatDateTime(new Date(dateStr)).split(" ")[0];
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">消息通知</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <Mail className="h-3 w-3" />
              {unreadCount} 条未读
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllVisibleRead}
            disabled={visibleUnreadCount === 0}
            className="gap-1"
          >
            <MailOpen className="h-4 w-4" />
            全部已读
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearVisible}
            disabled={filteredNotifications.length === 0}
            className="text-destructive hover:text-destructive gap-1"
          >
            <Trash2 className="h-4 w-4" />
            清空
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="w-40">
            <Select value={scopeFilter} onValueChange={setScopeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="通知范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mine">我的通知</SelectItem>
                <SelectItem value="clinic">本门店</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-40">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="全部类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {(Object.keys(typeLabelMap) as NotificationType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {typeLabelMap[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-40">
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger>
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="unread">未读</SelectItem>
                <SelectItem value="read">已读</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(typeFilter !== "all" || readFilter !== "all" || scopeFilter !== "mine") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter("all");
                setReadFilter("all");
                setScopeFilter("mine");
              }}
            >
              重置筛选
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full overflow-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <Bell className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">暂无通知消息</p>
            </div>
          ) : (
            <div className="divide-y">
              {groupedNotifications.map(([date, items]) => (
                <div key={date}>
                  <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                    {formatDateLabel(date)}
                  </div>
                  <div className="divide-y">
                    {items.map((notification) => (
                      <button
                        key={notification.id}
                        className={cn(
                          "flex w-full gap-4 px-4 py-4 text-left transition-colors hover:bg-accent/50",
                          !notification.read && "bg-accent/20"
                        )}
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                            typeColorMap[notification.type]
                          )}
                        >
                          {typeIconMap[notification.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p
                                className={cn(
                                  "text-sm font-medium",
                                  !notification.read && "font-semibold"
                                )}
                              >
                                {notification.title}
                              </p>
                              <Badge
                                variant={priorityVariantMap[notification.priority]}
                                className="h-5 text-[10px]"
                              >
                                {priorityLabelMap[notification.priority]}
                              </Badge>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatDateTime(new Date(notification.createdAt)).split(" ")[1]?.slice(0, 5)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {notification.content}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-3 text-sm text-muted-foreground">
        共 {filteredNotifications.length} 条通知
      </div>
    </div>
  );
}
