"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/Tabs";
import {
  User,
  Phone,
  MapPin,
  CalendarDays,
  UserCircle,
  ClipboardList,
  Wallet,
  Gift,
  CreditCard,
  ArrowLeft,
  Cake,
  Info,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  History,
  Activity,
  PlusCircle,
  MinusCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { MemberLevel, InstallmentStatus, AppointmentStatus } from "@/types";
import { cn, formatCurrency, formatDate, formatDateTime, formatTime } from "@/lib/utils";

const levelLabelMap: Record<MemberLevel, string> = {
  normal: "普通会员",
  silver: "银卡会员",
  gold: "金卡会员",
  platinum: "铂金会员",
};

const levelColorMap: Record<MemberLevel, string> = {
  normal: "bg-gray-500/15 text-gray-600",
  silver: "bg-blue-500/15 text-blue-600",
  gold: "bg-yellow-500/15 text-yellow-600",
  platinum: "bg-purple-500/15 text-purple-600",
};

const appointmentStatusMap: Record<AppointmentStatus, { label: string; variant: "default" | "success" | "warning" | "secondary" | "destructive" }> = {
  pending: { label: "待确认", variant: "warning" },
  confirmed: { label: "已确认", variant: "default" },
  in_progress: { label: "进行中", variant: "success" },
  completed: { label: "已完成", variant: "secondary" },
  cancelled: { label: "已取消", variant: "destructive" },
  no_show: { label: "未到诊", variant: "destructive" },
};

const installmentStatusMap: Record<InstallmentStatus, { label: string; variant: "default" | "success" | "warning" | "secondary" | "destructive" }> = {
  active: { label: "进行中", variant: "default" },
  completed: { label: "已完成", variant: "success" },
  overdue: { label: "已逾期", variant: "destructive" },
};

function calculateAge(birthday?: string): number {
  if (!birthday) return 0;
  const birth = new Date(birthday);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function MemberDetailPage() {
  const params = useParams();
  const memberId = params.id as string;
  const { members, patients, appointments, treatmentTypes, staff, storedValueTxs, pointsTxs, installmentPlans, consumeOrders, inventoryItems } = useAppStore();

  const member = useMemo(() => members.find((m) => m.id === memberId), [members, memberId]);
  const patient = useMemo(() => patients.find((p) => p.id === member?.patientId), [patients, member]);

  const memberAppointments = useMemo(() => {
    if (!patient) return [];
    return appointments
      .filter((a) => a.patientId === patient.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [appointments, patient]);

  const memberStoredValueTxs = useMemo(() => {
    if (!member) return [];
    return storedValueTxs
      .filter((tx) => tx.memberId === member.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [storedValueTxs, member]);

  const memberPointsTxs = useMemo(() => {
    if (!member) return [];
    return pointsTxs
      .filter((tx) => tx.memberId === member.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [pointsTxs, member]);

  const memberInstallments = useMemo(() => {
    if (!member) return [];
    return installmentPlans
      .filter((ip) => ip.memberId === member.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [installmentPlans, member]);

  const totalPointsEarned = useMemo(() => {
    return memberPointsTxs.filter((tx) => tx.type === "earn").reduce((sum, tx) => sum + tx.points, 0);
  }, [memberPointsTxs]);

  const totalStoredValueRecharged = useMemo(() => {
    return memberStoredValueTxs.filter((tx) => tx.type === "recharge").reduce((sum, tx) => sum + tx.amount, 0);
  }, [memberStoredValueTxs]);

  const totalStoredValueConsumed = useMemo(() => {
    return memberStoredValueTxs.filter((tx) => tx.type === "consume").reduce((sum, tx) => sum + tx.amount, 0);
  }, [memberStoredValueTxs]);

  const totalPointsSpent = useMemo(() => {
    return memberPointsTxs.filter((tx) => tx.type === "spend" || tx.type === "expire").reduce((sum, tx) => sum + tx.points, 0);
  }, [memberPointsTxs]);

  const getTreatmentName = (treatmentTypeId: string) => {
    return treatmentTypes.find((t) => t.id === treatmentTypeId)?.name || "未知项目";
  };

  const getStaffName = (staffId: string) => {
    return staff.find((s) => s.id === staffId)?.name || "未知医生";
  };

  const memberConsumeOrders = useMemo(() => {
    if (!patient) return [];
    return consumeOrders
      .filter((co) => co.patientId === patient.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [consumeOrders, patient]);

  type TimelineType = "appointment" | "recharge" | "stored_consume" | "points_earn" | "points_spend" | "points_expire" | "consumable";

  interface TimelineItem {
    id: string;
    type: TimelineType;
    timestamp: string;
    title: string;
    description?: string;
    amount?: number;
    amountType?: "currency" | "points";
    doctorName?: string;
    icon: typeof Stethoscope;
    color: string;
    bgColor: string;
  }

  const timelineItems = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = [];
    const treatmentMap = new Map(treatmentTypes.map((t) => [t.id, t]));
    const staffMap = new Map(staff.map((s) => [s.id, s.name]));
    const itemMap = new Map(inventoryItems.map((i) => [i.id, i]));
    const aptMap = new Map(appointments.map((a) => [a.id, a]));
    const TERMINAL_STATUSES: AppointmentStatus[] = ["completed", "cancelled", "no_show"];

    const resolveDoctor = (directStaffId?: string, aptRefId?: string): string | undefined => {
      if (directStaffId) return staffMap.get(directStaffId);
      if (aptRefId) {
        const apt = aptMap.get(aptRefId);
        if (apt) return staffMap.get(apt.staffId);
      }
      return undefined;
    };

    memberAppointments.forEach((apt) => {
      if (!TERMINAL_STATUSES.includes(apt.status)) return;
      const treatment = treatmentMap.get(apt.treatmentTypeId);
      const treatmentName = treatment?.name || "未知项目";
      const doctorName = staffMap.get(apt.staffId) || "未知医生";
      const status = appointmentStatusMap[apt.status];
      const amount = treatment?.price;
      items.push({
        id: `apt-${apt.id}`,
        type: "appointment",
        timestamp: apt.startTime.length === 5 ? `${apt.date}T${apt.startTime}:00` : apt.date,
        title: `${status.label} · ${treatmentName}`,
        description: `${formatDate(apt.date)} ${formatTime(apt.startTime)} - ${formatTime(apt.endTime)}`,
        amount,
        amountType: amount !== undefined ? "currency" : undefined,
        doctorName,
        icon: Stethoscope,
        color: "text-primary",
        bgColor: "bg-primary/10",
      });
    });

    memberStoredValueTxs.forEach((tx) => {
      const doctorName = resolveDoctor(tx.staffId, tx.referenceId);
      if (tx.type === "recharge") {
        items.push({
          id: `sv-r-${tx.id}`,
          type: "recharge",
          timestamp: tx.createdAt,
          title: "储值充值",
          description: tx.description,
          amount: tx.amount,
          amountType: "currency",
          doctorName,
          icon: PlusCircle,
          color: "text-success",
          bgColor: "bg-success/10",
        });
      } else {
        items.push({
          id: `sv-c-${tx.id}`,
          type: "stored_consume",
          timestamp: tx.createdAt,
          title: "储值消费",
          description: tx.description,
          amount: tx.amount,
          amountType: "currency",
          doctorName,
          icon: MinusCircle,
          color: "text-amber-600",
          bgColor: "bg-amber-500/10",
        });
      }
    });

    memberPointsTxs.forEach((tx) => {
      const doctorName = resolveDoctor(tx.staffId, tx.referenceId);
      if (tx.type === "earn") {
        items.push({
          id: `pt-e-${tx.id}`,
          type: "points_earn",
          timestamp: tx.createdAt,
          title: "积分获取",
          description: tx.description,
          amount: tx.points,
          amountType: "points",
          doctorName,
          icon: TrendingUp,
          color: "text-success",
          bgColor: "bg-success/10",
        });
      } else if (tx.type === "spend") {
        items.push({
          id: `pt-s-${tx.id}`,
          type: "points_spend",
          timestamp: tx.createdAt,
          title: "积分兑换",
          description: tx.description,
          amount: tx.points,
          amountType: "points",
          doctorName,
          icon: TrendingDown,
          color: "text-amber-600",
          bgColor: "bg-amber-500/10",
        });
      } else {
        items.push({
          id: `pt-ex-${tx.id}`,
          type: "points_expire",
          timestamp: tx.createdAt,
          title: "积分过期",
          description: tx.description,
          amount: tx.points,
          amountType: "points",
          doctorName,
          icon: AlertCircle,
          color: "text-destructive",
          bgColor: "bg-destructive/10",
        });
      }
    });

    memberConsumeOrders.forEach((co) => {
      const doctorName = resolveDoctor(undefined, co.appointmentId);
      const itemsStr = co.items
        .map((item) => `${itemMap.get(item.itemId)?.name || "未知物品"} ×${item.quantity}`)
        .join("、");
      const totalAmount = co.items.reduce((sum, item) => {
        const invItem = itemMap.get(item.itemId);
        return sum + (invItem?.price || 0) * item.quantity;
      }, 0);
      items.push({
        id: `co-${co.id}`,
        type: "consumable",
        timestamp: co.createdAt,
        title: "耗材消耗",
        description: itemsStr,
        amount: totalAmount,
        amountType: "currency",
        doctorName,
        icon: Package,
        color: "text-purple-600",
        bgColor: "bg-purple-500/10",
      });
    });

    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [memberAppointments, memberStoredValueTxs, memberPointsTxs, memberConsumeOrders, treatmentTypes, staff, inventoryItems, appointments]);

  if (!member || !patient) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <AlertCircle className="h-12 w-12" />
        <p>会员不存在</p>
        <Link href="/members">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </Button>
        </Link>
      </div>
    );
  }

  const age = calculateAge(patient.birthday);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-3">
        <Link href="/members">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">会员详情</h1>
          <p className="text-sm text-muted-foreground">会员编号：{member.memberNo}</p>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-amber-500/5">
        <CardContent className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserCircle className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{patient.name}</h2>
                  <Badge variant="default" className={cn(levelColorMap[member.level])}>
                    {levelLabelMap[member.level]}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {patient.phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {patient.gender === "male" ? "男" : "女"}
                  </div>
                  {age > 0 && (
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {age}岁
                    </div>
                  )}
                  {patient.birthday && (
                    <div className="flex items-center gap-1">
                      <Cake className="h-3.5 w-3.5" />
                      {formatDate(patient.birthday)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">储值余额</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(member.balance)}</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">可用积分</p>
                <p className="text-2xl font-bold text-amber-600">{member.points.toLocaleString()}</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">注册日期</p>
                <p className="text-lg font-semibold">{formatDate(member.joinDate)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          <Tabs defaultValue="info" className="flex flex-col h-full">
            <div className="px-6 pt-4 border-b">
              <TabsList>
                <TabsTrigger value="info" className="gap-1.5">
                  <Info className="h-4 w-4" />
                  基本信息
                </TabsTrigger>
                <TabsTrigger value="appointments" className="gap-1.5">
                  <ClipboardList className="h-4 w-4" />
                  就诊记录
                </TabsTrigger>
                <TabsTrigger value="stored" className="gap-1.5">
                  <Wallet className="h-4 w-4" />
                  储值账户
                </TabsTrigger>
                <TabsTrigger value="points" className="gap-1.5">
                  <Gift className="h-4 w-4" />
                  积分账户
                </TabsTrigger>
                <TabsTrigger value="installment" className="gap-1.5">
                  <CreditCard className="h-4 w-4" />
                  分期付款
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <TabsContent value="info" className="mt-0 h-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        联系信息
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground">姓名</p>
                        <p className="font-medium">{patient.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">联系电话</p>
                        <p className="font-medium">{patient.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">性别</p>
                        <p className="font-medium">{patient.gender === "male" ? "男" : "女"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">出生日期</p>
                        <p className="font-medium">{patient.birthday ? formatDate(patient.birthday) : "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">年龄</p>
                        <p className="font-medium">{age > 0 ? `${age}岁` : "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">身份证号</p>
                        <p className="font-medium">{patient.idCard || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">居住地址</p>
                        <p className="font-medium">
                          {patient.address ? (
                            <span className="flex items-start gap-1">
                              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              {patient.address}
                            </span>
                          ) : "-"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-primary" />
                        就诊偏好
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground">会员等级</p>
                        <Badge variant="default" className={cn(levelColorMap[member.level])}>
                          {levelLabelMap[member.level]}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">注册日期</p>
                        <p className="font-medium">{formatDate(member.joinDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">会员有效期</p>
                        <p className="font-medium">{member.expiryDate ? formatDate(member.expiryDate) : "长期有效"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">累计就诊次数</p>
                        <p className="font-medium">{memberAppointments.length} 次</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">储值余额</p>
                        <p className="font-medium text-primary">{formatCurrency(member.balance)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">可用积分</p>
                        <p className="font-medium text-amber-600">{member.points.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        备注
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">
                        {patient.notes || "暂无备注"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <History className="h-4 w-4 text-primary" />
                      活动时间线
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {timelineItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Activity className="h-10 w-10 mb-2 opacity-50" />
                        <p className="text-sm">暂无活动记录</p>
                      </div>
                    ) : (
                      <div className="relative pl-8">
                        <div className="absolute left-2.5 top-1 bottom-1 w-px bg-border" />
                        <div className="space-y-6">
                          {timelineItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <div key={item.id} className="relative">
                                <div
                                  className={cn(
                                    "absolute -left-[26px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background",
                                    item.bgColor
                                  )}
                                >
                                  <Icon className={cn("h-3 w-3", item.color)} />
                                </div>
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className={cn("font-medium text-sm", item.color)}>
                                        {item.title}
                                      </span>
                                      {item.doctorName && (
                                        <Badge variant="outline" className="gap-1 text-xs font-normal">
                                          <User className="h-3 w-3" />
                                          {item.doctorName}
                                        </Badge>
                                      )}
                                    </div>
                                    {item.description && (
                                      <p className="text-sm text-muted-foreground mb-1">
                                        {item.description}
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      {formatDateTime(item.timestamp)}
                                    </p>
                                  </div>
                                  {item.amount !== undefined && (
                                    <div className="shrink-0 text-right">
                                      <p
                                        className={cn(
                                          "font-semibold text-sm",
                                          item.type === "recharge" || item.type === "points_earn" ? "text-success" : "text-destructive"
                                        )}
                                      >
                                        {item.type === "recharge" || item.type === "points_earn" ? "+" : "-"}
                                        {item.amountType === "currency"
                                          ? formatCurrency(item.amount)
                                          : `${item.amount.toLocaleString()} 积分`}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appointments" className="mt-0 h-full">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">总预约次数</p>
                        <p className="text-2xl font-bold mt-1">{memberAppointments.length}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">已完成</p>
                        <p className="text-2xl font-bold mt-1 text-success">
                          {memberAppointments.filter((a) => a.status === "completed").length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">待就诊</p>
                        <p className="text-2xl font-bold mt-1 text-primary">
                          {memberAppointments.filter((a) => a.status === "confirmed" || a.status === "pending").length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">已取消</p>
                        <p className="text-2xl font-bold mt-1 text-destructive">
                          {memberAppointments.filter((a) => a.status === "cancelled" || a.status === "no_show").length}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>预约日期</TableHead>
                          <TableHead>时间段</TableHead>
                          <TableHead>治疗项目</TableHead>
                          <TableHead>主治医生</TableHead>
                          <TableHead>状态</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {memberAppointments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                              暂无就诊记录
                            </TableCell>
                          </TableRow>
                        ) : (
                          memberAppointments.map((apt) => {
                            const status = appointmentStatusMap[apt.status];
                            return (
                              <TableRow key={apt.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{formatDate(apt.date)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatTime(apt.startTime)} - {formatTime(apt.endTime)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{getTreatmentName(apt.treatmentTypeId)}</TableCell>
                                <TableCell>{getStaffName(apt.staffId)}</TableCell>
                                <TableCell>
                                  <Badge variant={status.variant}>{status.label}</Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stored" className="mt-0 h-full">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Wallet className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">当前余额</p>
                            <p className="text-2xl font-bold text-primary">{formatCurrency(member.balance)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-success/5 border-success/20">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success text-success-foreground">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">累计充值</p>
                            <p className="text-2xl font-bold text-success">{formatCurrency(totalStoredValueRecharged)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-amber-500/5 border-amber-500/20">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white">
                            <TrendingDown className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">累计消费</p>
                            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalStoredValueConsumed)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4 text-success" />
                          充值记录
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="max-h-64 overflow-auto">
                          <Table>
                            <TableHeader className="bg-muted/50 sticky top-0">
                              <TableRow>
                                <TableHead>时间</TableHead>
                                <TableHead>金额</TableHead>
                                <TableHead>说明</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {memberStoredValueTxs.filter((tx) => tx.type === "recharge").length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    暂无充值记录
                                  </TableCell>
                                </TableRow>
                              ) : (
                                memberStoredValueTxs
                                  .filter((tx) => tx.type === "recharge")
                                  .map((tx) => (
                                    <TableRow key={tx.id}>
                                      <TableCell className="text-muted-foreground">
                                        {formatDateTime(tx.createdAt)}
                                      </TableCell>
                                      <TableCell className="font-medium text-success">
                                        +{formatCurrency(tx.amount)}
                                      </TableCell>
                                      <TableCell>{tx.description}</TableCell>
                                    </TableRow>
                                  ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <ArrowDownRight className="h-4 w-4 text-amber-600" />
                          消费记录
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="max-h-64 overflow-auto">
                          <Table>
                            <TableHeader className="bg-muted/50 sticky top-0">
                              <TableRow>
                                <TableHead>时间</TableHead>
                                <TableHead>金额</TableHead>
                                <TableHead>说明</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {memberStoredValueTxs.filter((tx) => tx.type === "consume").length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    暂无消费记录
                                  </TableCell>
                                </TableRow>
                              ) : (
                                memberStoredValueTxs
                                  .filter((tx) => tx.type === "consume")
                                  .map((tx) => (
                                    <TableRow key={tx.id}>
                                      <TableCell className="text-muted-foreground">
                                        {formatDateTime(tx.createdAt)}
                                      </TableCell>
                                      <TableCell className="font-medium text-amber-600">
                                        -{formatCurrency(tx.amount)}
                                      </TableCell>
                                      <TableCell>{tx.description}</TableCell>
                                    </TableRow>
                                  ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="points" className="mt-0 h-full">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-amber-500/5 border-amber-500/20">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white">
                            <Gift className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">可用积分</p>
                            <p className="text-2xl font-bold text-amber-600">{member.points.toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-success/5 border-success/20">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success text-success-foreground">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">累计获得</p>
                            <p className="text-2xl font-bold text-success">{totalPointsEarned.toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-destructive/5 border-destructive/20">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
                            <TrendingDown className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">累计消费</p>
                            <p className="text-2xl font-bold text-destructive">
                              {totalPointsSpent.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">积分流水</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-96 overflow-auto">
                        <Table>
                          <TableHeader className="bg-muted/50 sticky top-0">
                            <TableRow>
                              <TableHead>类型</TableHead>
                              <TableHead>积分</TableHead>
                              <TableHead>说明</TableHead>
                              <TableHead>时间</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {memberPointsTxs.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                  暂无积分流水
                                </TableCell>
                              </TableRow>
                            ) : (
                              memberPointsTxs.map((tx) => (
                                <TableRow key={tx.id}>
                                  <TableCell>
                                    {tx.type === "earn" ? (
                                      <Badge variant="success" className="gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        赚取
                                      </Badge>
                                    ) : tx.type === "spend" ? (
                                      <Badge variant="warning" className="gap-1">
                                        <TrendingDown className="h-3 w-3" />
                                        消费
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive" className="gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        过期
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell
                                    className={cn(
                                      "font-semibold",
                                      tx.type === "earn" ? "text-success" : "text-destructive"
                                    )}
                                  >
                                    {tx.type === "earn" ? "+" : "-"}
                                    {tx.points.toLocaleString()}
                                  </TableCell>
                                  <TableCell>{tx.description}</TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {formatDateTime(tx.createdAt)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="installment" className="mt-0 h-full">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">分期计划数</p>
                        <p className="text-2xl font-bold mt-1">{memberInstallments.length}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">进行中</p>
                        <p className="text-2xl font-bold mt-1 text-primary">
                          {memberInstallments.filter((ip) => ip.status === "active").length}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">已完成</p>
                        <p className="text-2xl font-bold mt-1 text-success">
                          {memberInstallments.filter((ip) => ip.status === "completed").length}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    {memberInstallments.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>暂无分期付款记录</p>
                        </CardContent>
                      </Card>
                    ) : (
                      memberInstallments.map((ip) => {
                        const progress = (ip.paidPeriods / ip.periods) * 100;
                        const status = installmentStatusMap[ip.status];
                        return (
                          <Card key={ip.id}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold">{ip.description || "分期计划"}</h3>
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    开始日期：{formatDate(ip.startDate)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">总金额</p>
                                  <p className="text-xl font-bold text-primary">{formatCurrency(ip.totalAmount)}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">分期期数</p>
                                  <p className="font-medium">{ip.periods}期</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">每期金额</p>
                                  <p className="font-medium">{formatCurrency(ip.periodAmount)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">已还期数</p>
                                  <p className="font-medium text-success">{ip.paidPeriods}期</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">下次还款日</p>
                                  <p className="font-medium text-primary">{formatDate(ip.nextDueDate)}</p>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span className="text-muted-foreground">还款进度</span>
                                  <span className="font-medium">{ip.paidPeriods}/{ip.periods}期 ({progress.toFixed(0)}%)</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      ip.status === "completed" ? "bg-success" : ip.status === "overdue" ? "bg-destructive" : "bg-primary"
                                    )}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
