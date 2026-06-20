"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CalendarClock,
  Calendar,
  Package,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

type MenuItem = {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

const menuItems: MenuItem[] = [
  { title: "工作台", icon: LayoutDashboard, href: "/" },
  { title: "预约管理", icon: CalendarClock, href: "/appointments" },
  { title: "排班管理", icon: Calendar, href: "/schedule" },
  { title: "物资管理", icon: Package, href: "/inventory" },
  { title: "会员管理", icon: Users, href: "/members" },
  { title: "数据统计", icon: BarChart3, href: "/statistics" },
  { title: "系统设置", icon: Settings, href: "/settings" },
]

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  defaultCollapsed?: boolean
}

export function Sidebar({ className, defaultCollapsed = false }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  const pathname = usePathname()

  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname?.startsWith(href + "/")
  }

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <span className="truncate text-lg font-semibold tracking-tight">
              悦齿口腔连锁
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && "justify-center px-0"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="w-full justify-center text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>
    </aside>
  )
}
