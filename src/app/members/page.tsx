"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
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
  Search,
  Plus,
  Eye,
  Wallet,
  Gift,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";
import type { MemberLevel } from "@/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const levelList: { key: MemberLevel | "all"; label: string }[] = [
  { key: "all", label: "全部等级" },
  { key: "normal", label: "普通会员" },
  { key: "silver", label: "银卡会员" },
  { key: "gold", label: "金卡会员" },
  { key: "platinum", label: "铂金会员" },
];

const levelLabelMap: Record<MemberLevel, string> = {
  normal: "普通会员",
  silver: "银卡会员",
  gold: "金卡会员",
  platinum: "铂金会员",
};

const levelVariantMap: Record<MemberLevel, "default" | "secondary" | "success" | "warning"> = {
  normal: "secondary",
  silver: "default",
  gold: "warning",
  platinum: "success",
};

const levelColorMap: Record<MemberLevel, string> = {
  normal: "bg-gray-500/15 text-gray-600",
  silver: "bg-blue-500/15 text-blue-600",
  gold: "bg-yellow-500/15 text-yellow-600",
  platinum: "bg-purple-500/15 text-purple-600",
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

export default function MembersListPage() {
  const { members, patients, appointments, treatmentTypes } = useAppStore();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterLevel, setFilterLevel] = useState<MemberLevel | "all">("all");
  const [minBalance, setMinBalance] = useState("");
  const [maxBalance, setMaxBalance] = useState("");
  const [minPoints, setMinPoints] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const memberList = useMemo(() => {
    const getPatient = (patientId: string) => {
      return patients.find((p) => p.id === patientId);
    };
    const getTotalSpent = (patientId: string) => {
      return appointments
        .filter((a) => a.patientId === patientId && a.status === "completed")
        .reduce((sum, a) => {
          const tt = treatmentTypes.find((t) => t.id === a.treatmentTypeId);
          return sum + (tt?.price || 0);
        }, 0);
    };
    return members
      .map((m) => {
        const patient = getPatient(m.patientId);
        return {
          ...m,
          patient,
          age: calculateAge(patient?.birthday),
          totalSpent: getTotalSpent(m.patientId),
        };
      })
      .filter((item) => {
        if (searchKeyword) {
          const keyword = searchKeyword.toLowerCase();
          const matchName = item.patient?.name.toLowerCase().includes(keyword);
          const matchPhone = item.patient?.phone.includes(keyword);
          if (!matchName && !matchPhone) return false;
        }
        if (filterLevel !== "all" && item.level !== filterLevel) return false;
        if (minBalance && item.balance < Number(minBalance)) return false;
        if (maxBalance && item.balance > Number(maxBalance)) return false;
        if (minPoints && item.points < Number(minPoints)) return false;
        if (maxPoints && item.points > Number(maxPoints)) return false;
        return true;
      });
  }, [members, patients, appointments, treatmentTypes, searchKeyword, filterLevel, minBalance, maxBalance, minPoints, maxPoints]);

  const resetFilters = () => {
    setFilterLevel("all");
    setMinBalance("");
    setMaxBalance("");
    setMinPoints("");
    setMaxPoints("");
  };

  const hasActiveFilters = filterLevel !== "all" || minBalance || maxBalance || minPoints || maxPoints;

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">会员档案</h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {members.length} 位会员
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/members/stored-value">
            <Button variant="outline" size="sm">
              <Wallet className="h-4 w-4" />
              储值充值
            </Button>
          </Link>
          <Link href="/members/points">
            <Button variant="outline" size="sm">
              <Gift className="h-4 w-4" />
              积分兑换
            </Button>
          </Link>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            新增会员
          </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索姓名、电话..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="h-4 w-4" />
                筛选
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                    !
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="h-4 w-4" />
                  重置
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">会员等级</label>
                  <Select value={filterLevel} onValueChange={(v) => setFilterLevel(v as MemberLevel | "all")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {levelList.map((lv) => (
                        <SelectItem key={lv.key} value={lv.key}>
                          {lv.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">储值余额(最小)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minBalance}
                    onChange={(e) => setMinBalance(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">储值余额(最大)</label>
                  <Input
                    type="number"
                    placeholder="不限"
                    value={maxBalance}
                    onChange={(e) => setMaxBalance(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">积分(最小)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minPoints}
                    onChange={(e) => setMinPoints(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">积分(最大)</label>
                  <Input
                    type="number"
                    placeholder="不限"
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>性别</TableHead>
                  <TableHead>年龄</TableHead>
                  <TableHead>会员等级</TableHead>
                  <TableHead>储值余额</TableHead>
                  <TableHead>可用积分</TableHead>
                  <TableHead>累计消费</TableHead>
                  <TableHead>注册日期</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      暂无符合条件的会员
                    </TableCell>
                  </TableRow>
                ) : (
                  memberList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="font-medium">{item.patient?.name || "未知"}</span>
                      </TableCell>
                      <TableCell>{item.patient?.phone || "-"}</TableCell>
                      <TableCell>
                        {item.patient?.gender === "male" ? "男" : item.patient?.gender === "female" ? "女" : "-"}
                      </TableCell>
                      <TableCell>{item.age > 0 ? `${item.age}岁` : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={levelVariantMap[item.level]} className={cn(levelColorMap[item.level])}>
                          {levelLabelMap[item.level]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {formatCurrency(item.balance)}
                      </TableCell>
                      <TableCell className="font-medium text-amber-600">
                        {item.points.toLocaleString()}
                      </TableCell>
                      <TableCell>{formatCurrency(item.totalSpent)}</TableCell>
                      <TableCell>{formatDate(item.joinDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/members/${item.id}`}>
                            <Button variant="ghost" size="icon" title="查看详情">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href="/members/stored-value">
                            <Button variant="ghost" size="icon" title="储值充值">
                              <Wallet className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href="/members/points">
                            <Button variant="ghost" size="icon" title="积分兑换">
                              <Gift className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
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
  );
}
