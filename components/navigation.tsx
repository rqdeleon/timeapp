"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, Users, BarChart3, Menu, Home, Clock, LogOut, User, SettingsIcon, ListChecks } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { RealtimeNotification } from "@/components/realtime-notification"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Employees", href: "/employees", icon: Users },
    { name: "Schedule", href: "/schedule", icon: Calendar },
    { name: "Schedule List", href: "/schedule/list", icon: ListChecks }, // New link
    { name: "Settings", href: "/settings", icon: SettingsIcon }, // Added Settings link
  ]

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const NavItems = ({ mobile = false }) => (
    <nav className={`${mobile ? "flex flex-col space-y-2" : "hidden md:flex md:space-x-8"}`}>
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
            onClick={() => mobile && setIsOpen(false)}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">SJEJ Scheduling</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <NavItems />

            {/* Real-time Notifications */}
            <RealtimeNotification />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt="User" />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem className="flex flex-col items-start">
                  <div className="text-sm font-medium">{user?.email}</div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex items-center gap-2 mb-8">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                  <span className="text-xl font-bold text-gray-900">SchedulePro</span>
                </div>
                <NavItems mobile />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
