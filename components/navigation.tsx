"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, LayoutDashboard, ListChecks, Settings, Users } from "lucide-react"

import { cn } from "@/lib/utils"

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const items: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Weekly Schedule", href: "/schedule", icon: CalendarDays },
  { name: "Schedule List", href: "/schedule/list", icon: ListChecks },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <aside className="w-full md:w-56 border-r bg-background">
      <nav className="space-y-1 p-4">
        {items.map(({ name, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" />
              {name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

// allow `import Navigation from '@/components/navigation'`
export default Navigation
