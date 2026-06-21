"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
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
  ModalFooter,
} from "@/components/ui/Modal";
import {
  Receipt,
  Wallet,
  CreditCard,
  Smartphone,
  Banknote,
  Gift,
  CalendarClock,
  Calculator,
  Check,
  User,
} from "lucide-react";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import type { PaymentMethod, Appointment } from "@/types";

interface SettlementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment & {
    patientName: string;
    staffName: string;
    treatmentName: string;
    treatmentPrice: number;
    clinicName: string;
  } | null;
  onSettled?: (settlementId: string) => void;
}

const POINTS_VALUE_RATIO = 100;

export function SettlementModal({ open, onOpenChange, appointment, onSettled }: SettlementModalProps) {
  const { members, staff, clinics, addSettlement, selectedClinicId } = useAppStore();

  const [primaryPaymentMethod, setPrimaryPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [wechatAlipayAmount, setWechatAlipayAmount] = useState("");
  const [useStoredValue, setUseStoredValue] = useState(false);
  const [storedValueAmount, setStoredValueAmount] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [pointsUsed, setPointsUsed] = useState("");
  const [useInstallment, setUseInstallment] = useState(false);
  const [installmentPeriods, setInstallmentPeriods] = useState("6");
  const [discountAmount, setDiscountAmount] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [remark, setRemark] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [settlementId, setSettlementId] = useState<string | null>(null);

  const member = useMemo(() => {
    if (!appointment) return null;
    return members.find((m) => m.patientId === appointment.patientId) || null;
  }, [members, appointment]);

  const treatment = useMemo(() => {
    if (!appointment) return null;
    return { name: appointment.treatmentName, price: appointment.treatmentPrice };
  }, [appointment]);

  const totalAmount = treatment?.price || 0;

  const discount = Number(discountAmount) || 0;
  const pointsDeduction = usePoints ? Math.floor((Number(pointsUsed) || 0) / POINTS_VALUE_RATIO) : 0;
  const storedValueUsed = useStoredValue ? Number(storedValueAmount) || 0 : 0;

  const remainingAfterDeductions = Math.max(0, totalAmount - discount - pointsDeduction - storedValueUsed);

  const cash = Number(cashAmount) || 0;
  const card = Number(cardAmount) || 0;
  const wechatAlipay = Number(wechatAlipayAmount) || 0;

  const amountPaid = cash + card + wechatAlipay + storedValueUsed + pointsDeduction + (useInstallment ? remainingAfterDeductions : 0);
  const unpaidAmount = Math.max(0, totalAmount - discount - amountPaid);

  const clinicStaff = useMemo(() => {
    const clinicId = appointment?.clinicId || selectedClinicId;
    if (!clinicId) return staff;
    return staff.filter((s) => s.clinicId === clinicId);
  }, [staff, appointment, selectedClinicId]);

  const resetForm = useCallback(() => {
    setPrimaryPaymentMethod("cash");
    setCashAmount("");
    setCardAmount("");
    setWechatAlipayAmount("");
    setUseStoredValue(false);
    setStoredValueAmount("");
    setUsePoints(false);
    setPointsUsed("");
    setUseInstallment(false);
    setInstallmentPeriods("6");
    setDiscountAmount("");
    setOperatorId(clinicStaff.length > 0 ? clinicStaff[0].id : "");
    setRemark("");
    setShowReceipt(false);
    setSettlementId(null);
  }, [clinicStaff]);

  useEffect(() => {
    if (open) {
      // Reset form state when modal opens - intentional
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetForm();
    }
  }, [open, resetForm]);

  const updatePaymentAmounts = (method: PaymentMethod, remaining: number) => {
    if (method === "cash") {
      setCashAmount(remaining.toFixed(2));
      setCardAmount("");
      setWechatAlipayAmount("");
    } else if (method === "card") {
      setCardAmount(remaining.toFixed(2));
      setCashAmount("");
      setWechatAlipayAmount("");
    } else if (method === "wechat_alipay") {
      setWechatAlipayAmount(remaining.toFixed(2));
      setCashAmount("");
      setCardAmount("");
    }
  };

  const handleConfirmSettlement = () => {
    if (!appointment) return;
    if (!operatorId) {
      alert("请选择操作人");
      return;
    }
    if (amountPaid <= 0) {
      alert("请输入支付金额");
      return;
    }

    addSettlement({
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      memberId: member?.id,
      totalAmount,
      discountAmount: discount,
      pointsUsed: usePoints ? Number(pointsUsed) || 0 : 0,
      pointsDeduction,
      storedValueUsed,
      installmentAmount: useInstallment ? remainingAfterDeductions : 0,
      primaryPaymentMethod,
      cashAmount: cash,
      cardAmount: card,
      wechatAlipayAmount: wechatAlipay,
      operatorId,
      clinicId: appointment.clinicId,
      remark: remark || undefined,
    });

    const newSettlementId = useAppStore.getState().settlements[useAppStore.getState().settlements.length - 1]?.id;
    if (newSettlementId) {
      setSettlementId(newSettlementId);
      setShowReceipt(true);
      onSettled?.(newSettlementId);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (!appointment || !treatment) return null;

  const paymentMethodLabels: Record<PaymentMethod, { label: string; icon: typeof Banknote }> = {
    cash: { label: "现金", icon: Banknote },
    card: { label: "刷卡", icon: CreditCard },
    wechat_alipay: { label: "微信/支付宝", icon: Smartphone },
    stored_value: { label: "储值卡扣", icon: Wallet },
    points: { label: "积分抵扣", icon: Gift },
    installment: { label: "分期付款", icon: CalendarClock },
  };

  return (
    <>
      <Modal open={open && !showReceipt} onOpenChange={onOpenChange}>
        <ModalContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              收费结算
            </ModalTitle>
          </ModalHeader>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  患者信息
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">患者姓名：</span>
                  <span className="font-medium">{appointment.patientName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">主治医生：</span>
                  <span>{appointment.staffName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">治疗项目：</span>
                  <span>{treatment.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">门店：</span>
                  <span>{appointment.clinicName}</span>
                </div>
                {member && (
                  <>
                    <div>
                      <span className="text-muted-foreground">会员余额：</span>
                      <span className="text-primary font-medium">{formatCurrency(member.balance)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">可用积分：</span>
                      <span className="text-amber-600 font-medium">{member.points.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  费用明细
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">项目原价</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm gap-2">
                  <span className="text-muted-foreground">优惠减免</span>
                  <div className="flex items-center gap-1">
                    <span className="text-destructive">-</span>
                    <Input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="w-24 h-7 text-right"
                      min={0}
                      max={totalAmount}
                    />
                  </div>
                </div>
                {member && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usePoints}
                        onChange={(e) => setUsePoints(e.target.checked)}
                        className="rounded"
                      />
                      <span>积分抵扣</span>
                      <span className="text-xs text-muted-foreground">({POINTS_VALUE_RATIO}积分=1元)</span>
                    </label>
                    {usePoints && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={pointsUsed}
                          onChange={(e) => setPointsUsed(e.target.value)}
                          className="w-24 h-7 text-right"
                          min={0}
                          max={member.points}
                        />
                        <span className="text-xs text-muted-foreground">积分</span>
                        <span className="text-destructive text-xs">-¥{pointsDeduction.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
                {member && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useStoredValue}
                        onChange={(e) => setUseStoredValue(e.target.checked)}
                        className="rounded"
                      />
                      <span>储值卡扣</span>
                    </label>
                    {useStoredValue && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={storedValueAmount}
                          onChange={(e) => setStoredValueAmount(e.target.value)}
                          className="w-24 h-7 text-right"
                          min={0}
                          max={member.balance}
                        />
                        <span className="text-xs text-muted-foreground">元</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="font-medium">应付金额</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(Math.max(0, totalAmount - discount - pointsDeduction))}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  支付方式
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {(["cash", "card", "wechat_alipay"] as PaymentMethod[]).map((method) => {
                    const info = paymentMethodLabels[method];
                    const Icon = info.icon;
                    return (
                      <button
                        key={method}
                        onClick={() => {
                          setPrimaryPaymentMethod(method);
                          setUseInstallment(false);
                          updatePaymentAmounts(method, remainingAfterDeductions);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all",
                          primaryPaymentMethod === method && !useInstallment
                            ? "border-primary bg-primary/5 text-primary"
                            : "hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{info.label}</span>
                      </button>
                    );
                  })}
                  {member && (
                    <button
                      onClick={() => {
                        setUseInstallment(!useInstallment);
                        if (!useInstallment) {
                          setPrimaryPaymentMethod("installment");
                        }
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all",
                        useInstallment
                          ? "border-primary bg-primary/5 text-primary"
                          : "hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <CalendarClock className="h-5 w-5" />
                      <span className="text-xs">分期付款</span>
                    </button>
                  )}
                </div>

                {!useInstallment && primaryPaymentMethod !== "installment" && (
                  <div className="space-y-2">
                    {primaryPaymentMethod === "cash" && (
                      <div className="flex items-center gap-2">
                        <Label className="w-20 text-sm">现金金额</Label>
                        <Input
                          type="number"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          className="flex-1"
                          min={0}
                        />
                      </div>
                    )}
                    {primaryPaymentMethod === "card" && (
                      <div className="flex items-center gap-2">
                        <Label className="w-20 text-sm">刷卡金额</Label>
                        <Input
                          type="number"
                          value={cardAmount}
                          onChange={(e) => setCardAmount(e.target.value)}
                          className="flex-1"
                          min={0}
                        />
                      </div>
                    )}
                    {primaryPaymentMethod === "wechat_alipay" && (
                      <div className="flex items-center gap-2">
                        <Label className="w-20 text-sm">扫码金额</Label>
                        <Input
                          type="number"
                          value={wechatAlipayAmount}
                          onChange={(e) => setWechatAlipayAmount(e.target.value)}
                          className="flex-1"
                          min={0}
                        />
                      </div>
                    )}
                  </div>
                )}

                {useInstallment && (
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Label className="w-20 text-sm">分期期数</Label>
                      <Select value={installmentPeriods} onValueChange={setInstallmentPeriods}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3期</SelectItem>
                          <SelectItem value="6">6期</SelectItem>
                          <SelectItem value="12">12期</SelectItem>
                          <SelectItem value="24">24期</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      分期总金额：{formatCurrency(remainingAfterDeductions)}
                      ，每期约 {formatCurrency(remainingAfterDeductions / Number(installmentPeriods || 6))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Label className="w-20 text-sm">操作人</Label>
                    <Select value={operatorId} onValueChange={setOperatorId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="请选择操作人" />
                      </SelectTrigger>
                      <SelectContent>
                        {clinicStaff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {s.name}
                              {s.title ? ` (${s.title})` : ""}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-20 text-sm">备注</Label>
                    <Input
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      className="flex-1"
                      placeholder="可选填备注信息"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">项目原价</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">优惠减免</span>
                    <span className="text-destructive">-{formatCurrency(discount)}</span>
                  </div>
                )}
                {pointsDeduction > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">积分抵扣</span>
                    <span className="text-destructive">-{formatCurrency(pointsDeduction)}</span>
                  </div>
                )}
                {storedValueUsed > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">储值卡扣</span>
                    <span className="text-destructive">-{formatCurrency(storedValueUsed)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                  <span className="font-medium">实付金额</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(amountPaid)}
                  </span>
                </div>
                {unpaidAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-destructive">未付金额</span>
                    <span className="text-destructive font-medium">{formatCurrency(unpaidAmount)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <ModalFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmSettlement}>
              <Check className="h-4 w-4" />
              确认结算
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {showReceipt && settlementId && (
        <Modal open={showReceipt} onOpenChange={setShowReceipt}>
          <ModalContent className="max-w-md">
            <ModalHeader>
              <ModalTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                结算单
              </ModalTitle>
            </ModalHeader>
            <div className="p-4 space-y-4 print:p-0">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold">{clinics.find((c) => c.id === appointment.clinicId)?.name || "美齿口腔"}</h3>
                <p className="text-xs text-muted-foreground">收费结算单</p>
              </div>

              <div className="border-t border-b border-dashed py-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">单号</span>
                  <span className="font-mono">{settlementId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">日期</span>
                  <span>{formatDateTime(new Date())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">患者</span>
                  <span>{appointment.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">医生</span>
                  <span>{appointment.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">项目</span>
                  <span>{treatment.name}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">项目金额</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">优惠减免</span>
                    <span className="text-destructive">-{formatCurrency(discount)}</span>
                  </div>
                )}
                {pointsDeduction > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">积分抵扣</span>
                    <span className="text-destructive">-{formatCurrency(pointsDeduction)}</span>
                  </div>
                )}
                {storedValueUsed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">储值卡扣</span>
                    <span className="text-destructive">-{formatCurrency(storedValueUsed)}</span>
                  </div>
                )}
                {cash > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">现金支付</span>
                    <span>{formatCurrency(cash)}</span>
                  </div>
                )}
                {card > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">刷卡支付</span>
                    <span>{formatCurrency(card)}</span>
                  </div>
                )}
                {wechatAlipay > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">扫码支付</span>
                    <span>{formatCurrency(wechatAlipay)}</span>
                  </div>
                )}
                {useInstallment && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">分期付款</span>
                    <span>{formatCurrency(remainingAfterDeductions)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-medium">
                  <span>实收金额</span>
                  <span className="text-primary text-lg font-bold">{formatCurrency(amountPaid)}</span>
                </div>
              </div>

              {remark && (
                <div className="text-sm text-muted-foreground pt-2 border-t">
                  <p>备注：{remark}</p>
                </div>
              )}

              <div className="text-center text-xs text-muted-foreground pt-2">
                <p>操作人：{staff.find((s) => s.id === operatorId)?.name || "-"}</p>
                <p className="mt-1">谢谢惠顾，欢迎下次光临！</p>
              </div>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowReceipt(false)}>
                关闭
              </Button>
              <Button onClick={handlePrintReceipt}>
                <Receipt className="h-4 w-4" />
                打印结算单
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
