"use client";

import * as React from "react";
import {
  CalendarClock,
  DollarSign,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Circle,
  Phone,
  User,
  ListTodo,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { cn, formatCurrency, formatTime } from "@/lib/utils";
import type { AppointmentStatus } from "@/types";

const statusMap: Record<AppointmentStatus, { label: string; variant: "default" | "success" | "warning" | "secondary" | "destructive" }> = {
  pending: { label: "待确认", variant: "warning" },
  confirmed: { label: "已确认", variant: "default" },
  in_progress: { label: "进行中", variant: "success" },
  completed: { label: "已完成", variant: "secondary" },
  cancelled: { label: "已取消", variant: "destructive" },
  no_show: { label: "未到诊", variant: "destructive" },
};

const todoItems = [
  { id: "1", title: "确认明日3位患者预约", done: false, priority: "high" as const },
  { id: "2", title: "盘点种植体库存", done: false, priority: "medium" as const },
  { id: "3", title: "审核会员储值充值申请", done: true, priority: "low" as const },
  { id: "4", title: "准备周会汇报材料", done: false, priority: "high" as const },
  { id: "5", title: "回访上周治疗患者", done: true, priority: "medium" as const },
];

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  iconBg,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: "up" | "down";
  trendValue: string;
  iconBg: string;
}) {
  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-1 text-xs">
              {trend === "up" ? (
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              )}
              <span
                className={cn(
                  "font-medium",
                  trend === "up" ? "text-success" : "text-destructive"
                )}
              >
                {trendValue}
              </span>
              <span className="text-muted-foreground">较上月</span>
            </div>
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconBg)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { appointments, patients, members, inventoryItems, staff, treatmentTypes } = useAppStore();
  const [todos, setTodos] = React.useState(todoItems);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = React.useMemo(() => {
    return appointments
      .filter((a) => a.date === todayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, todayStr]);

  const monthlyRevenue = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return appointments
      .filter((a) => {
        const d = new Date(a.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && a.status === "completed";
      })
      .reduce((sum, a) => {
        const tt = treatmentTypes.find((t) => t.id === a.treatmentTypeId);
        return sum + (tt?.price || 0);
      }, 0);
  }, [appointments, treatmentTypes]);

  const lowStockItems = React.useMemo(() => {
    return inventoryItems.filter((i) => i.currentStock <= i.safetyStock);
  }, [inventoryItems]);

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const getPatientName = (patientId: string) => {
    return patients.find((p) => p.id === patientId)?.name || "未知患者";
  };

  const getStaffName = (staffId: string) => {
    return staff.find((s) => s.id === staffId)?.name || "未知医生";
  };

  const getTreatmentName = (treatmentTypeId: string) => {
    return treatmentTypes.find((t) => t.id === treatmentTypeId)?.name || "未知项目";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">工作台</h1>
        <p className="text-sm text-muted-foreground mt-1">
          欢迎回来，今天是 {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="今日预约"
          value={todayAppointments.length.toString()}
          icon={CalendarClock}
          trend="up"
          trendValue="+12.5%"
          iconBg="bg-primary-50 text-primary-600"
        />
        <StatCard
          title="本月营收"
          value={formatCurrency(monthlyRevenue)}
          icon={DollarSign}
          trend="up"
          trendValue="+8.3%"
          iconBg="bg-green-50 text-green-600"
        />
        <StatCard
          title="会员总数"
          value={members.length.toString()}
          icon={Users}
          trend="up"
          trendValue="+5.2%"
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="库存预警"
          value={lowStockItems.length.toString()}
          icon={AlertTriangle}
          trend="down"
          trendValue="-2"
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-semibold">今日预约时间轴</CardTitle>
            <Link href="/appointments">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                查看全部 <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CalendarClock className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">今日暂无预约</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[18px] top-1 bottom-1 w-px bg-border" />
                <div className="space-y-4">
                  {todayAppointments.map((apt) => {
                    const status = statusMap[apt.status];
                    return (
                      <div key={apt.id} className="relative flex gap-4 pl-10">
                        <div className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-background">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="flex-1 rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                  {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                                </span>
                                <Badge variant={status.variant}>{status.label}</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-medium">{getPatientName(apt.patientId)}</span>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-muted-foreground">{getTreatmentName(apt.treatmentTypeId)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{getStaffName(apt.staffId)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" />
              待办事项
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {todos.filter((t) => !t.done).length} 项待完成
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todos.map((todo) => (
                <button
                  key={todo.id}
                  onClick={() => toggleTodo(todo.id)}
                  className="flex w-full items-start gap-3 rounded-lg p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    {todo.done ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium transition-colors",
                        todo.done && "text-muted-foreground line-through"
                      )}
                    >
                      {todo.title}
                    </p>
                    <div className="mt-1">
                      <Badge
                        variant={
                          todo.priority === "high"
                            ? "destructive"
                            : todo.priority === "medium"
                            ? "warning"
                            : "secondary"
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {todo.priority === "high" ? "高" : todo.priority === "medium" ? "中" : "低"}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
