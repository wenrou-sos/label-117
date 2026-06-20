"use client";

import * as React from "react";
import ReactECharts from "echarts-for-react";
import {
  DollarSign,
  CalendarClock,
  Users,
  UserPlus,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  BarChart3,
} from "lucide-react";
import { useAppStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { cn, formatCurrency } from "@/lib/utils";

type TimeRange = "today" | "week" | "month" | "quarter" | "year" | "custom";

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: "today", label: "今日" },
  { value: "week", label: "本周" },
  { value: "month", label: "本月" },
  { value: "quarter", label: "本季度" },
  { value: "year", label: "本年" },
  { value: "custom", label: "自定义" },
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

export default function StatisticsPage() {
  const { appointments, clinics, staff, treatmentTypes, members } = useAppStore();
  const [timeRange, setTimeRange] = React.useState<TimeRange>("month");
  const [clinicId, setClinicId] = React.useState<string>("all");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  const getDateRange = React.useCallback(() => {
    const now = new Date();
    let start: Date, end: Date;

    switch (timeRange) {
      case "today":
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case "week":
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      case "custom":
        start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }
    return { start, end };
  }, [timeRange, startDate, endDate]);

  const filteredAppointments = React.useMemo(() => {
    const { start, end } = getDateRange();
    return appointments.filter((a) => {
      const aptDate = new Date(a.date);
      if (aptDate < start || aptDate > end) return false;
      if (clinicId !== "all" && a.clinicId !== clinicId) return false;
      return true;
    });
  }, [appointments, clinicId, getDateRange]);

  const totalRevenue = React.useMemo(() => {
    return filteredAppointments
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => {
        const tt = treatmentTypes.find((t) => t.id === a.treatmentTypeId);
        return sum + (tt?.price || 0);
      }, 0);
  }, [filteredAppointments, treatmentTypes]);

  const totalAppointments = filteredAppointments.length;

  const completedAppointments = filteredAppointments.filter(
    (a) => a.status === "completed"
  );
  const uniquePatients = new Set(completedAppointments.map((a) => a.patientId)).size;

  const dateRangeForNewMembers = React.useMemo(() => getDateRange(), [getDateRange]);
  const newMembers = React.useMemo(() => {
    return members.filter((m) => {
      const joinDate = new Date(m.joinDate);
      return joinDate >= dateRangeForNewMembers.start && joinDate <= dateRangeForNewMembers.end;
    }).length;
  }, [members, dateRangeForNewMembers]);

  const avgPrice = completedAppointments.length > 0
    ? totalRevenue / completedAppointments.length
    : 0;

  const revenueTrendData = React.useMemo(() => {
    const days: string[] = [];
    const values: number[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      days.push(`${d.getMonth() + 1}/${d.getDate()}`);
      const dayRevenue = appointments
        .filter((a) => a.date === dateStr && a.status === "completed")
        .reduce((sum, a) => {
          const tt = treatmentTypes.find((t) => t.id === a.treatmentTypeId);
          return sum + (tt?.price || 0);
        }, 0);
      values.push(dayRevenue);
    }
    return { days, values };
  }, [appointments, treatmentTypes]);

  const treatmentDistributionData = React.useMemo(() => {
    const map = new Map<string, number>();
    filteredAppointments.forEach((a) => {
      const tt = treatmentTypes.find((t) => t.id === a.treatmentTypeId);
      if (tt) {
        map.set(tt.name, (map.get(tt.name) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredAppointments, treatmentTypes]);

  const clinicRevenueData = React.useMemo(() => {
    return clinics.map((clinic) => {
      const clinicApts = appointments.filter(
        (a) => a.clinicId === clinic.id && a.status === "completed"
      );
      const revenue = clinicApts.reduce((sum, a) => {
        const tt = treatmentTypes.find((t) => t.id === a.treatmentTypeId);
        return sum + (tt?.price || 0);
      }, 0);
      return { name: clinic.name.replace("美齿口腔·", ""), value: revenue };
    });
  }, [clinics, appointments, treatmentTypes]);

  const memberGrowthData = React.useMemo(() => {
    const months: string[] = [];
    const values: number[] = [];
    const today = new Date();
    let cumulative = 0;
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      const monthMembers = members.filter((m) => {
        const joinDate = new Date(m.joinDate);
        return joinDate.getFullYear() === d.getFullYear() && joinDate.getMonth() === d.getMonth();
      }).length;
      cumulative += monthMembers;
      values.push(cumulative);
    }
    return { months, values };
  }, [members]);

  const topTreatments = React.useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    filteredAppointments
      .filter((a) => a.status === "completed")
      .forEach((a) => {
        const tt = treatmentTypes.find((t) => t.id === a.treatmentTypeId);
        if (tt) {
          const existing = map.get(tt.id) || { count: 0, revenue: 0 };
          map.set(tt.id, {
            count: existing.count + 1,
            revenue: existing.revenue + tt.price,
          });
        }
      });
    return Array.from(map.entries())
      .map(([id, data]) => {
        const tt = treatmentTypes.find((t) => t.id === id)!;
        return {
          name: tt.name,
          color: tt.color,
          count: data.count,
          revenue: data.revenue,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredAppointments, treatmentTypes]);

  const doctorRanking = React.useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    filteredAppointments
      .filter((a) => a.status === "completed")
      .forEach((a) => {
        const existing = map.get(a.staffId) || { count: 0, revenue: 0 };
        const tt = treatmentTypes.find((t) => t.id === a.treatmentTypeId);
        map.set(a.staffId, {
          count: existing.count + 1,
          revenue: existing.revenue + (tt?.price || 0),
        });
      });
    return Array.from(map.entries())
      .map(([id, data]) => {
        const s = staff.find((st) => st.id === id);
        const c = clinics.find((cl) => cl.id === s?.clinicId);
        return {
          name: s?.name || "未知",
          clinic: c?.name || "未知",
          specialty: s?.specialty || "-",
          count: data.count,
          revenue: data.revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredAppointments, staff, clinics, treatmentTypes]);

  const revenueTrendOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const arr = params as Array<{ name: string; value: number }>;
        const data = arr[0];
        return `${data.name}<br/>营收: ${formatCurrency(data.value)}`;
      },
    },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: revenueTrendData.days,
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      axisLabel: { color: "#6b7280", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#f3f4f6" } },
      axisLabel: {
        color: "#6b7280",
        fontSize: 11,
        formatter: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value,
      },
    },
    series: [
      {
        name: "营收",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: "#3B82F6", width: 3 },
        itemStyle: { color: "#3B82F6" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(59, 130, 246, 0.25)" },
              { offset: 1, color: "rgba(59, 130, 246, 0.02)" },
            ],
          },
        },
        data: revenueTrendData.values,
      },
    ],
  };

  const treatmentPieOption = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: "5%",
      top: "center",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: "#6b7280", fontSize: 12 },
    },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        center: ["35%", "50%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: "bold" },
        },
        data: treatmentDistributionData.map((item, idx) => ({
          ...item,
          itemStyle: {
            color: treatmentTypes.find((t) => t.name === item.name)?.color || [
              "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4",
            ][idx % 7],
          },
        })),
      },
    ],
  };

  const clinicBarOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: unknown) => {
        const arr = params as Array<{ name: string; value: number }>;
        const data = arr[0];
        return `${data.name}<br/>营收: ${formatCurrency(data.value)}`;
      },
    },
    grid: { left: "3%", right: "4%", bottom: "3%", top: "10%", containLabel: true },
    xAxis: {
      type: "category",
      data: clinicRevenueData.map((d) => d.name),
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      axisLabel: { color: "#6b7280", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#f3f4f6" } },
      axisLabel: {
        color: "#6b7280",
        fontSize: 11,
        formatter: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value,
      },
    },
    series: [
      {
        type: "bar",
        barWidth: "45%",
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#10B981" },
              { offset: 1, color: "#059669" },
            ],
          },
        },
        data: clinicRevenueData.map((d) => d.value),
      },
    ],
  };

  const memberGrowthOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const arr = params as Array<{ name: string; value: number }>;
        const data = arr[0];
        return `${data.name}<br/>会员总数: ${data.value}`;
      },
    },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: memberGrowthData.months,
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      axisLabel: { color: "#6b7280", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#f3f4f6" } },
      axisLabel: { color: "#6b7280", fontSize: 11 },
    },
    series: [
      {
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: "#8B5CF6", width: 3 },
        itemStyle: { color: "#8B5CF6" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(139, 92, 246, 0.25)" },
              { offset: 1, color: "rgba(139, 92, 246, 0.02)" },
            ],
          },
        },
        data: memberGrowthData.values,
      },
    ],
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">数据统计</h1>
          <p className="text-sm text-muted-foreground mt-1">
            查看业务运营数据与趋势分析
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
          导出报表
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">筛选条件</span>
          </div>
          <div className="w-40">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {timeRange === "custom" && (
            <>
              <div className="w-36">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="开始日期"
                />
              </div>
              <span className="text-muted-foreground">至</span>
              <div className="w-36">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="结束日期"
                />
              </div>
            </>
          )}
          <div className="w-48">
            <Select value={clinicId} onValueChange={setClinicId}>
              <SelectTrigger>
                <SelectValue placeholder="全部门店" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部门店</SelectItem>
                {clinics.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="总营收"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          trend="up"
          trendValue="+12.5%"
          iconBg="bg-primary-50 text-primary-600"
        />
        <StatCard
          title="预约总数"
          value={totalAppointments.toString()}
          icon={CalendarClock}
          trend="up"
          trendValue="+8.3%"
          iconBg="bg-green-50 text-green-600"
        />
        <StatCard
          title="就诊人数"
          value={uniquePatients.toString()}
          icon={Users}
          trend="up"
          trendValue="+5.2%"
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="新增会员"
          value={newMembers.toString()}
          icon={UserPlus}
          trend="up"
          trendValue="+15.8%"
          iconBg="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="客单价"
          value={formatCurrency(avgPrice)}
          icon={CreditCard}
          trend="up"
          trendValue="+3.1%"
          iconBg="bg-cyan-50 text-cyan-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">营收趋势（近30天）</CardTitle>
            <Badge variant="secondary">折线图</Badge>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={revenueTrendOption}
              style={{ height: 280 }}
              opts={{ renderer: "canvas" }}
            />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">预约项目分布</CardTitle>
            <Badge variant="secondary">饼图</Badge>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={treatmentPieOption}
              style={{ height: 280 }}
              opts={{ renderer: "canvas" }}
            />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">各门店营收</CardTitle>
            <Badge variant="secondary">柱状图</Badge>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={clinicBarOption}
              style={{ height: 280 }}
              opts={{ renderer: "canvas" }}
            />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">会员增长趋势</CardTitle>
            <Badge variant="secondary">面积图</Badge>
          </CardHeader>
          <CardContent>
            <ReactECharts
              option={memberGrowthOption}
              style={{ height: 280 }}
              opts={{ renderer: "canvas" }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              热门项目 TOP5
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">排名</TableHead>
                  <TableHead>项目名称</TableHead>
                  <TableHead className="text-right">预约次数</TableHead>
                  <TableHead className="text-right">营收</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topTreatments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  topTreatments.map((item, idx) => (
                    <TableRow key={item.name}>
                      <TableCell>
                        <Badge
                          variant={idx === 0 ? "default" : idx < 3 ? "warning" : "secondary"}
                          className="w-6 h-6 justify-center p-0"
                        >
                          {idx + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{item.count}</TableCell>
                      <TableCell className="text-right font-medium text-success">
                        {formatCurrency(item.revenue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              医生业绩排行
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">排名</TableHead>
                  <TableHead>医生</TableHead>
                  <TableHead>所属门店</TableHead>
                  <TableHead className="text-right">接诊数</TableHead>
                  <TableHead className="text-right">业绩</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctorRanking.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  doctorRanking.map((item, idx) => (
                    <TableRow key={item.name}>
                      <TableCell>
                        <Badge
                          variant={idx === 0 ? "default" : idx < 3 ? "warning" : "secondary"}
                          className="w-6 h-6 justify-center p-0"
                        >
                          {idx + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.specialty}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.clinic}</TableCell>
                      <TableCell className="text-right font-medium">{item.count}</TableCell>
                      <TableCell className="text-right font-medium text-success">
                        {formatCurrency(item.revenue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
