"use client"

import * as React from "react"
import {
  ChevronRight,
  Building2,
  User,
  LogOut,
  Settings,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { NotificationBell } from "@/components/NotificationBell"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { useAppStore } from "@/store"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface TopbarProps extends React.HTMLAttributes<HTMLDivElement> {
  breadcrumbs?: BreadcrumbItem[]
  onMobileMenuClick?: () => void
}

export function Topbar({
  className,
  breadcrumbs = [{ label: "工作台" }],
  onMobileMenuClick,
}: TopbarProps) {
  const { clinics, selectedClinicId, setSelectedClinicId, staff, currentUserId, setCurrentUserId } = useAppStore()
  const [showUserMenu, setShowUserMenu] = React.useState(false)

  const currentUser = staff.find((s) => s.id === currentUserId)
  const handleClinicChange = (value: string) => {
    setSelectedClinicId(value === "__all__" ? null : value)
  }
  const handleUserChange = (value: string) => {
    setCurrentUserId(value)
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMobileMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <nav className="flex flex-1 items-center gap-1 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {crumb.href ? (
              <a
                href={crumb.href}
                className="transition-colors hover:text-foreground"
              >
                {crumb.label}
              </a>
            ) : (
              <span className="text-foreground">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Select value={selectedClinicId ?? "__all__"} onValueChange={handleClinicChange}>
          <SelectTrigger className="w-36 md:w-48">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <SelectValue placeholder="选择门店" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部门店</SelectItem>
            {clinics.map((clinic) => (
              <SelectItem key={clinic.id} value={clinic.id}>
                {clinic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentUserId ?? ""} onValueChange={handleUserChange}>
          <SelectTrigger className="w-36 md:w-44">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <SelectValue placeholder="切换身份" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {staff.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}（{s.title || s.role}）
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <NotificationBell />

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
          </Button>

          {showUserMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md">
              <div className="border-b p-3">
                <p className="text-sm font-medium">{currentUser?.name || "管理员"}</p>
                <p className="text-xs text-muted-foreground">
                  {currentUser?.email || "admin@yuechi.com"}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {currentUser?.title || "系统管理员"}
                </p>
              </div>
              <div className="p-1">
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  个人设置
                </button>
                <button
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-accent hover:text-destructive"
                  onClick={() => setShowUserMenu(false)}
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
