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
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/Modal";
import {
  Wallet,
  Gift,
  Search,
  Check,
  Sparkles,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Plus,
} from "lucide-react";
import Link from "next/link";
import type { MemberLevel } from "@/types";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";

const storedValuePackages = [
  { id: 1, amount: 1000, bonus: 100, points: 200 },
  { id: 2, amount: 3000, bonus: 500, points: 600 },
  { id: 3, amount: 5000, bonus: 1000, points: 1000 },
  { id: 4, amount: 10000, bonus: 2000, points: 2000 },
];

const levelLabelMap: Record<MemberLevel, string> = {
  normal: "普通会员",
  silver: "银卡会员",
  gold: "金卡会员",
  platinum: "铂金会员",
};

export default function StoredValuePage() {
  const { members, patients, storedValueTxs, addStoredValueTx, addPointsTx } = useAppStore();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingRecharge, setPendingRecharge] = useState<{ amount: number; bonus: number; points: number } | null>(null);

  const memberWithPatients = useMemo(() => {
    return members.map((m) => ({
      ...m,
      patient: patients.find((p) => p.id === m.patientId),
    }));
  }, [members, patients]);

  const filteredMembers = useMemo(() => {
    if (!searchKeyword) return memberWithPatients;
    const keyword = searchKeyword.toLowerCase();
    return memberWithPatients.filter((m) => {
      const matchName = m.patient?.name.toLowerCase().includes(keyword);
      const matchPhone = m.patient?.phone.includes(keyword);
      return matchName || matchPhone;
    });
  }, [memberWithPatients, searchKeyword]);

  const selectedMember = useMemo(() => {
    return memberWithPatients.find((m) => m.id === selectedMemberId);
  }, [memberWithPatients, selectedMemberId]);

  const recentTxs = useMemo(() => {
    return [...storedValueTxs]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);
  }, [storedValueTxs]);

  const getMemberName = (memberId: string) => {
    const m = memberWithPatients.find((m) => m.id === memberId);
    return m?.patient?.name || "未知会员";
  };

  const handlePackageSelect = (pkg: typeof storedValuePackages[0]) => {
    setSelectedPackage(pkg.id);
    setCustomAmount("");
    setPendingRecharge({
      amount: pkg.amount,
      bonus: pkg.bonus,
      points: pkg.points,
    });
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedPackage(null);
    const amount = Number(value);
    if (amount > 0) {
      const bonus = Math.floor(amount / 100) * 10;
      const points = amount * 2;
      setPendingRecharge({ amount, bonus, points });
    } else {
      setPendingRecharge(null);
    }
  };

  const handleConfirmRecharge = () => {
    if (!selectedMember || !pendingRecharge) return;

    addStoredValueTx({
      memberId: selectedMember.id,
      amount: pendingRecharge.amount + pendingRecharge.bonus,
      type: "recharge",
      description: `储值卡充值${pendingRecharge.amount}元${pendingRecharge.bonus > 0 ? `送${pendingRecharge.bonus}元` : ""}`,
    });

    if (pendingRecharge.points > 0) {
      addPointsTx({
        memberId: selectedMember.id,
        type: "earn",
        points: pendingRecharge.points,
        description: `储值卡充值赠送积分`,
      });
    }

    setShowConfirmModal(false);
    setSelectedPackage(null);
    setCustomAmount("");
    setPendingRecharge(null);
  };

  const canRecharge = selectedMember && pendingRecharge && pendingRecharge.amount > 0;

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-3">
        <Link href="/members">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">储值卡管理</h1>
          <p className="text-sm text-muted-foreground">会员储值充值与记录查询</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-1 space-y-4 flex flex-col">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                选择会员
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索会员姓名、电话..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-48 overflow-auto rounded-md border">
                {filteredMembers.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    无匹配会员
                  </div>
                ) : (
                  filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMemberId(m.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm border-b last:border-b-0 transition-colors",
                        selectedMemberId === m.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="h-4 w-4 shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="font-medium truncate">{m.patient?.name || "未知"}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.patient?.phone}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium text-primary">{formatCurrency(m.balance)}</p>
                        <p className="text-xs text-muted-foreground">{levelLabelMap[m.level]}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {selectedMember && (
                <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">当前余额</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(selectedMember.balance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">可用积分</span>
                    <span className="text-sm font-medium text-amber-600">
                      {selectedMember.points.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex-1 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                储值套餐
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {storedValuePackages.map((pkg) => {
                const isSelected = selectedPackage === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => handlePackageSelect(pkg)}
                    className={cn(
                      "w-full rounded-lg border p-4 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold">{formatCurrency(pkg.amount)}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">实得 {formatCurrency(pkg.amount + pkg.bonus)}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="success" className="gap-1">
                          <Gift className="h-3 w-3" />
                          送{pkg.bonus}元
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1.5">赠{pkg.points}积分</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-3 flex items-center justify-end">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </button>
                );
              })}

              <div className="pt-2 border-t space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">自定义充值金额</label>
                  <div className="mt-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                    <Input
                      type="number"
                      placeholder="请输入金额"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      className="pl-7"
                      min={1}
                    />
                  </div>
                </div>
                {pendingRecharge && (
                  <div className="rounded-lg bg-amber-500/10 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">充值金额</span>
                      <span className="font-medium">{formatCurrency(pendingRecharge.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">赠送金额</span>
                      <span className="font-medium text-success">+{formatCurrency(pendingRecharge.bonus)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">赠送积分</span>
                      <span className="font-medium text-amber-600">+{pendingRecharge.points.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-1.5 border-t border-amber-500/20">
                      <span className="font-medium">实到金额</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(pendingRecharge.amount + pendingRecharge.bonus)}
                      </span>
                    </div>
                  </div>
                )}
                <Button
                  className="w-full"
                  disabled={!canRecharge}
                  onClick={() => setShowConfirmModal(true)}
                >
                  <Plus className="h-4 w-4" />
                  确认充值
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              充值记录
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-73px)]">
            <div className="h-full overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>会员</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>说明</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTxs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        暂无充值记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTxs.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatDateTime(tx.createdAt)}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{getMemberName(tx.memberId)}</span>
                        </TableCell>
                        <TableCell>
                          {tx.type === "recharge" ? (
                            <Badge variant="success" className="gap-1">
                              <ArrowUpRight className="h-3 w-3" />
                              充值
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="gap-1">
                              <ArrowDownRight className="h-3 w-3" />
                              消费
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-semibold whitespace-nowrap",
                            tx.type === "recharge" ? "text-success" : "text-amber-600"
                          )}
                        >
                          {tx.type === "recharge" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{tx.description}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>确认充值</ModalTitle>
            <ModalDescription>请确认以下充值信息</ModalDescription>
          </ModalHeader>
          {selectedMember && pendingRecharge && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">会员</span>
                  <span className="font-medium">{selectedMember.patient?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">充值金额</span>
                  <span className="font-medium">{formatCurrency(pendingRecharge.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">赠送金额</span>
                  <span className="font-medium text-success">+{formatCurrency(pendingRecharge.bonus)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">赠送积分</span>
                  <span className="font-medium text-amber-600">+{pendingRecharge.points.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="font-semibold">实到金额</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(pendingRecharge.amount + pendingRecharge.bonus)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmRecharge}>
              确认支付
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
