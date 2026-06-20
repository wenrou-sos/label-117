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
  Gift,
  Search,
  ArrowLeft,
  User,
  Check,
  Sparkles,
  Info,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ShieldCheck,
  Star,
  UserPlus,
  DollarSign,
  Sparkle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";
import { cn, formatDateTime } from "@/lib/utils";

const pointsRules = [
  { icon: DollarSign, title: "消费获取", desc: "消费1元 = 1积分", highlight: true },
  { icon: UserPlus, title: "推荐奖励", desc: "推荐新患者奖励100积分" },
  { icon: Sparkle, title: "储值赠送", desc: "储值充值额外赠送积分" },
  { icon: Star, title: "生日福利", desc: "生日当月消费双倍积分" },
];

const exchangeItems = [
  { id: 1, name: "洗牙服务", points: 500, icon: Sparkles, desc: "超声波洁牙+抛光一次", category: "服务" },
  { id: 2, name: "口腔拍片", points: 300, icon: Search, desc: "全景X光片检查一次", category: "服务" },
  { id: 3, name: "牙膏牙刷套装", points: 200, icon: Gift, desc: "专业口腔护理套装一份", category: "实物" },
  { id: 4, name: "免费复诊", points: 100, icon: ShieldCheck, desc: "常规复诊检查一次", category: "服务" },
];

export default function PointsPage() {
  const { members, patients, pointsTxs, addPointsTx } = useAppStore();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  const selectedItem = useMemo(() => {
    return exchangeItems.find((item) => item.id === selectedItemId);
  }, [selectedItemId]);

  const memberPointsTxs = useMemo(() => {
    return [...pointsTxs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30);
  }, [pointsTxs]);

  const getMemberName = (memberId: string) => {
    const m = memberWithPatients.find((m) => m.id === memberId);
    return m?.patient?.name || "未知会员";
  };

  const totalEarned = useMemo(() => {
    return pointsTxs.filter((tx) => tx.type === "earn").reduce((sum, tx) => sum + tx.points, 0);
  }, [pointsTxs]);

  const totalSpent = useMemo(() => {
    return pointsTxs.filter((tx) => tx.type === "spend").reduce((sum, tx) => sum + tx.points, 0);
  }, [pointsTxs]);

  const handleExchange = () => {
    if (!selectedMember || !selectedItem) return;
    if (selectedMember.points < selectedItem.points) return;

    addPointsTx({
      memberId: selectedMember.id,
      type: "spend",
      points: selectedItem.points,
      description: `积分兑换：${selectedItem.name}`,
    });

    setShowConfirmModal(false);
    setSelectedItemId(null);
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
          <h1 className="text-xl font-semibold">积分管理</h1>
          <p className="text-sm text-muted-foreground">积分规则与兑换管理</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-amber-500/5 border-amber-500/20 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-600" />
              积分规则说明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {pointsRules.map((rule, idx) => {
                const Icon = rule.icon;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-lg border p-4",
                      rule.highlight ? "bg-primary/5 border-primary/30" : "bg-background"
                    )}
                  >
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg mb-2",
                      rule.highlight ? "bg-primary text-primary-foreground" : "bg-amber-500/15 text-amber-600"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium">{rule.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rule.desc}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-success">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">累计赚取</span>
              </div>
              <p className="text-2xl font-bold text-success mt-2">{totalEarned.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium">累计消费</span>
              </div>
              <p className="text-2xl font-bold text-destructive mt-2">{totalSpent.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          <Card className="flex-1 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                积分兑换商品/服务
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exchangeItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedItemId === item.id;
                  const canExchange = selectedMember && selectedMember.points >= item.points;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedItemId(item.id);
                        if (selectedMember) {
                          setShowConfirmModal(true);
                        }
                      }}
                      className={cn(
                        "text-left rounded-lg border p-4 transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                            <div className="mt-1.5">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {item.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-amber-600">{item.points}</p>
                          <p className="text-xs text-muted-foreground">积分</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t flex items-center justify-end">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      {selectedMember && !canExchange && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-1.5 text-xs text-destructive">
                            <AlertCircle className="h-3.5 w-3.5" />
                            积分不足，还差 {(item.points - selectedMember.points).toLocaleString()} 积分
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                积分流水
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
                      <TableHead>积分</TableHead>
                      <TableHead>来源/用途</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberPointsTxs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          暂无积分流水
                        </TableCell>
                      </TableRow>
                    ) : (
                      memberPointsTxs.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formatDateTime(tx.createdAt)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{getMemberName(tx.memberId)}</span>
                          </TableCell>
                          <TableCell>
                            {tx.type === "earn" ? (
                              <Badge variant="success" className="gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                赚取
                              </Badge>
                            ) : tx.type === "spend" ? (
                              <Badge variant="warning" className="gap-1">
                                <ArrowDownRight className="h-3 w-3" />
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
                              "font-semibold whitespace-nowrap",
                              tx.type === "earn" ? "text-success" : "text-destructive"
                            )}
                          >
                            {tx.type === "earn" ? "+" : "-"}
                            {tx.points.toLocaleString()}
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

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              选择会员
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-73px)] flex flex-col">
            <div className="p-3 border-b">
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
            <div className="flex-1 overflow-auto">
              {selectedMember && (
                <div className="p-3 border-b bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{selectedMember.patient?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{selectedMember.patient?.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-600">{selectedMember.points.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">可用积分</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="divide-y">
                {filteredMembers.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    无匹配会员
                  </div>
                ) : (
                  filteredMembers.map((m) => {
                    const isSelected = selectedMemberId === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMemberId(m.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors",
                          isSelected
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="text-left min-w-0">
                            <p className={cn("font-medium truncate", isSelected && "text-primary")}>
                              {m.patient?.name || "未知"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{m.patient?.phone}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn("font-medium", isSelected ? "text-primary" : "text-amber-600")}>
                            {m.points.toLocaleString()}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>确认积分兑换</ModalTitle>
            <ModalDescription>请确认以下兑换信息</ModalDescription>
          </ModalHeader>
          {selectedMember && selectedItem && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">兑换会员</span>
                  <span className="font-medium">{selectedMember.patient?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">当前积分</span>
                  <span className="font-medium text-amber-600">{selectedMember.points.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-amber-600" />
                    <span className="font-medium">{selectedItem.name}</span>
                  </div>
                  <span className="text-lg font-bold text-destructive">-{selectedItem.points.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="font-semibold">兑换后剩余积分</span>
                  <span className="text-xl font-bold text-success">
                    {(selectedMember.points - selectedItem.points).toLocaleString()}
                  </span>
                </div>
              </div>
              {selectedMember.points < selectedItem.points && (
                <div className="rounded-lg bg-destructive/10 p-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                  <span className="text-sm text-destructive">
                    积分不足，无法兑换此商品/服务
                  </span>
                </div>
              )}
            </div>
          )}
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleExchange}
              disabled={!selectedMember || !selectedItem || selectedMember.points < selectedItem.points}
            >
              确认兑换
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
