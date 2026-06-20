"use client"

import * as React from "react"
import {
  ChevronRight,
  Bell,
  Building2,
  User,
  LogOut,
  Settings,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface TopbarProps extends React.HTMLAttributes<HTMLDivElement> {
  breadcrumbs?: BreadcrumbItem[]
  onMobileMenuClick?: () => void
}

const stores = [
  { value: "hq", label: "总部" },
  { value: "shanghai-pudong", label: "上海浦东店" },
  { value: "shanghai-xuhui", label: "上海徐汇店" },
  { value: "beijing-chaoyang", label: "北京朝阳店" },
]

export function Topbar({
  className,
  breadcrumbs = [{ label: "工作台" }],
  onMobileMenuClick,
}: TopbarProps) {
  const [selectedStore, setSelectedStore] = React.useState(stores[0].value)
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [hasNotification] = React.useState(true)

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
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger className="w-36 md:w-48">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <SelectValue placeholder="选择门店" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {stores.map((store) => (
              <SelectItem key={store.value} value={store.value}>
                {store.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasNotification && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>

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
                <p className="text-sm font-medium">管理员</p>
                <p className="text-xs text-muted-foreground">
                  admin@yuechi.com
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
