"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Stethoscope,
  Shield,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/store";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const featureCards = [
  {
    title: "门店管理",
    description: "管理连锁门店信息、营业时间、地址等",
    icon: Building2,
    href: "/settings/clinics",
    color: "bg-blue-50 text-blue-600",
    borderColor: "border-blue-200",
    hoverColor: "hover:border-blue-400",
  },
  {
    title: "人员管理",
    description: "管理员工信息、角色权限、所属门店",
    icon: Users,
    href: "/settings/staff",
    color: "bg-green-50 text-green-600",
    borderColor: "border-green-200",
    hoverColor: "hover:border-green-400",
  },
  {
    title: "治疗项目配置",
    description: "配置治疗项目、时长、价格、颜色标签",
    icon: Stethoscope,
    href: "/settings/treatments",
    color: "bg-purple-50 text-purple-600",
    borderColor: "border-purple-200",
    hoverColor: "hover:border-purple-400",
  },
  {
    title: "权限管理",
    description: "配置角色权限、菜单访问控制",
    icon: Shield,
    href: "#",
    color: "bg-amber-50 text-amber-600",
    borderColor: "border-amber-200",
    hoverColor: "hover:border-amber-400",
  },
];

export default function SettingsPage() {
  const { clinics, staff, treatmentTypes } = useAppStore();

  const statsMap: Record<string, number> = {
    "/settings/clinics": clinics.length,
    "/settings/staff": staff.length,
    "/settings/treatments": treatmentTypes.length,
    "#": 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">系统设置</h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理门店、人员、项目及系统权限
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {featureCards.map((card) => {
          const Icon = card.icon;
          const count = statsMap[card.href];
          return (
            <Link key={card.title} href={card.href}>
              <Card
                className={`h-full border-2 ${card.borderColor} ${card.hoverColor} transition-all hover:shadow-lg cursor-pointer`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${card.color}`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{card.title}</CardTitle>
                          {count > 0 && (
                            <Badge variant="secondary">{count}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {card.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-2" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
