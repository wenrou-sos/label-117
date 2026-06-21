"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/Modal";
import {
  CreditCard,
  Search,
  ArrowLeft,
  User,
  CalendarDays,
  DollarSign,
  Percent,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ChevronRight,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import type { InstallmentStatus } from "@/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const installmentPlans = [
  { periods: 3, interestRate: 0, label: "3期免息" },
  { periods: 6, interestRate: 0.02, label: "6期 2%手续费" },
  { periods: 12, interestRate: 0.05, label: "12期 5%手续费" },
];

const statusMap: Record<InstallmentStatus, { label: string; variant: "default" | "success" | "warning" | "secondary" | "destructive" }> = {
  active: { label: "进行中", variant: "default" },
  completed: { label: "已完成", variant: "success" },
  overdue: { label: "已逾期", variant: "destructive" },
};

export default function InstallmentPage() {
  const { members, patients, installmentPlans: storePlans, appointments, treatmentTypes, addInstallmentPlan, updateInstallmentPlan } = useAppStore();
  const [selectedPlanPeriods, setSelectedPlanPeriods] = useState<number>(3);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    memberId: "",
    appointmentId: "",
    totalAmount: "",
    downPayment: "",
    description: "",
  });
  const [searchKeyword, setSearchKeyword] = useState("");

  const memberWithPatients = useMemo(() => {
    return members.map((m) => ({
      ...m,
      patient: patients.find((p) => p.id === m.patientId),
    }));
  }, [members, patients]);

  const memberAppointments = useMemo(() => {
    if (!formData.memberId) return [];
    const member = memberWithPatients.find((m) => m.id === formData.memberId);
    if (!member) return [];
    return appointments
      .filter((a) => a.patientId === member.patientId)
      .map((a) => ({
        ...a,
        treatmentName: treatmentTypes.find((t) => t.id === a.treatmentTypeId)?.name || "未知项目",
      }));
  }, [appointments, treatmentTypes, memberWithPatients, formData.memberId]);

  const filteredPlans = useMemo(() => {
    let result = storePlans;
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter((p) => {
        const member = memberWithPatients.find((m) => m.id === p.memberId);
        const matchName = member?.patient?.name.toLowerCase().includes(keyword);
        const matchPhone = member?.patient?.phone.includes(keyword);
        return matchName || matchPhone;
      });
    }
    return [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [storePlans, memberWithPatients, searchKeyword]);

  const getMemberName = (memberId: string) => {
    const m = memberWithPatients.find((m) => m.id === memberId);
    return m?.patient?.name || "未知会员";
  };

  const selectedPlan = useMemo(() => {
    return storePlans.find((p) => p.id === selectedPlanId);
  }, [storePlans, selectedPlanId]);

  const currentPlan = installmentPlans.find((p) => p.periods === selectedPlanPeriods) || installmentPlans[0];

  const totalAmount = Number(formData.totalAmount) || 0;
  const downPayment = Number(formData.downPayment) || 0;
  const loanAmount = totalAmount - downPayment;
  const interest = loanAmount * currentPlan.interestRate;
  const totalToPay = loanAmount + interest;
  const periodAmount = selectedPlanPeriods > 0 ? totalToPay / selectedPlanPeriods : 0;

  const handleCreatePlan = () => {
    if (!formData.memberId || totalAmount <= 0) return;

    const nextDueDate = new Date();
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    addInstallmentPlan({
      memberId: formData.memberId,
      appointmentId: formData.appointmentId || undefined,
      totalAmount: totalAmount,
      periods: selectedPlanPeriods,
      periodAmount: Math.round(periodAmount * 100) / 100,
      paidPeriods: 0,
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
      nextDueDate: nextDueDate.toISOString().split("T")[0],
      description: formData.description || "分期付款计划",
    });

    setShowCreateModal(false);
    setFormData({
      memberId: "",
      appointmentId: "",
      totalAmount: "",
      downPayment: "",
      description: "",
    });
  };

  const handlePayment = () => {
    if (!selectedPlan) return;

    const newPaidPeriods = selectedPlan.paidPeriods + 1;
    const nextDueDate = new Date(selectedPlan.nextDueDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    updateInstallmentPlan(selectedPlan.id, {
      paidPeriods: newPaidPeriods,
      nextDueDate: nextDueDate.toISOString().split("T")[0],
      status: newPaidPeriods >= selectedPlan.periods ? "completed" : "active",
    });

    setShowPaymentModal(false);
    setSelectedPlanId(null);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-3">
        <Link href="/members">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">分期付款管理</h1>
          <p className="text-sm text-muted-foreground">分期方案管理与还款登记</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          新建分期
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {installmentPlans.map((plan) => {
          const isSelected = selectedPlanPeriods === plan.periods;
          return (
            <Card
              key={plan.periods}
              className={cn(
                "cursor-pointer transition-all",
                isSelected && "border-primary bg-primary/5 ring-2 ring-primary/20"
              )}
              onClick={() => setSelectedPlanPeriods(plan.periods)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-3xl font-bold">{plan.periods}</p>
                    <p className="text-sm text-muted-foreground mt-1">期</p>
                  </div>
                  <Badge variant={plan.interestRate === 0 ? "success" : "warning"} className="gap-1">
                    <Percent className="h-3 w-3" />
                    {plan.interestRate === 0 ? "免息" : `${(plan.interestRate * 100).toFixed(0)}%手续费`}
                  </Badge>
                </div>
                <p className="text-sm font-medium mt-4">{plan.label}</p>
                {isSelected && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">示例：借款10000元</p>
                    <p className="text-sm font-medium text-primary mt-1">
                      每期 {formatCurrency((10000 + 10000 * plan.interestRate) / plan.periods)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="flex-1 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            分期计划列表
          </CardTitle>
          <div className="w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索会员姓名、电话..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-73px)]">
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>会员</TableHead>
                  <TableHead>项目</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>期数</TableHead>
                  <TableHead>每期金额</TableHead>
                  <TableHead>进度</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>下次还款</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      暂无分期计划
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map((plan) => {
                    const progress = (plan.paidPeriods / plan.periods) * 100;
                    const status = statusMap[plan.status];
                    return (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{getMemberName(plan.memberId)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{plan.description || "-"}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(plan.totalAmount)}</TableCell>
                        <TableCell>
                          <span className="font-medium">{plan.paidPeriods}</span>
                          <span className="text-muted-foreground">/{plan.periods}</span>
                        </TableCell>
                        <TableCell>{formatCurrency(plan.periodAmount)}</TableCell>
                        <TableCell className="w-32">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  plan.status === "completed" ? "bg-success" : plan.status === "overdue" ? "bg-destructive" : "bg-primary"
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            {plan.status === "completed" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : plan.status === "overdue" ? (
                              <AlertCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{formatDate(plan.nextDueDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {plan.status !== "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPlanId(plan.id);
                                setShowPaymentModal(true);
                              }}
                            >
                              <DollarSign className="h-4 w-4" />
                              还款登记
                            </Button>
                          )}
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

      <Modal open={showCreateModal} onOpenChange={setShowCreateModal}>
        <ModalContent className="max-w-xl">
          <ModalHeader>
            <ModalTitle>新建分期计划</ModalTitle>
            <ModalDescription>为会员创建分期付款计划</ModalDescription>
          </ModalHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">选择会员 <span className="text-destructive">*</span></label>
              <Select value={formData.memberId} onValueChange={(v) => setFormData({ ...formData, memberId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择会员" />
                </SelectTrigger>
                <SelectContent>
                  {memberWithPatients.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.patient?.name} - {m.patient?.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.memberId && (
              <div className="space-y-1">
                <label className="text-sm font-medium">关联预约</label>
                <Select value={formData.appointmentId} onValueChange={(v) => setFormData({ ...formData, appointmentId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择关联预约（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberAppointments.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {formatDate(a.date)} {a.treatmentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">项目总金额 <span className="text-destructive">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">首付金额</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.downPayment}
                    onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">选择分期期数 <span className="text-destructive">*</span></label>
              <div className="grid grid-cols-3 gap-3">
                {installmentPlans.map((plan) => {
                  const isSelected = selectedPlanPeriods === plan.periods;
                  return (
                    <button
                      key={plan.periods}
                      type="button"
                      onClick={() => setSelectedPlanPeriods(plan.periods)}
                      className={cn(
                        "rounded-lg border p-3 text-center transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "hover:border-primary/50"
                      )}
                    >
                      <p className="text-xl font-bold">{plan.periods}期</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">项目说明</label>
              <Input
                placeholder="例如：种植牙分期（2颗）"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {totalAmount > 0 && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">项目总金额</span>
                  <span className="font-medium">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">首付金额</span>
                  <span className="font-medium">{formatCurrency(downPayment)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">分期金额</span>
                  <span className="font-medium">{formatCurrency(loanAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">手续费</span>
                  <span className="font-medium text-amber-600">{formatCurrency(interest)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-semibold">每期还款</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(periodAmount)}</span>
                </div>
              </div>
            )}
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreatePlan} disabled={!formData.memberId || totalAmount <= 0}>
              确认创建
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>还款登记</ModalTitle>
            <ModalDescription>确认本期还款信息</ModalDescription>
          </ModalHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">会员</span>
                  <span className="font-medium">{getMemberName(selectedPlan.memberId)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">项目</span>
                  <span className="font-medium">{selectedPlan.description || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">还款期数</span>
                  <span className="font-medium">第 {selectedPlan.paidPeriods + 1} / {selectedPlan.periods} 期</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">本期还款金额</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(selectedPlan.periodAmount)}</span>
                </div>
                {selectedPlan.paidPeriods + 1 < selectedPlan.periods && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-muted-foreground">下次还款日期</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {(() => {
                        const next = new Date(selectedPlan.nextDueDate);
                        next.setMonth(next.getMonth() + 1);
                        return formatDate(next.toISOString().split("T")[0]);
                      })()}
                    </span>
                  </div>
                )}
              </div>
              {selectedPlan.paidPeriods + 1 >= selectedPlan.periods && (
                <div className="rounded-lg bg-success/10 p-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="text-sm text-success font-medium">本期还款后，分期计划将全部完成</span>
                </div>
              )}
            </div>
          )}
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              取消
            </Button>
            <Button onClick={handlePayment}>
              确认还款
              <ChevronRight className="h-4 w-4" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
