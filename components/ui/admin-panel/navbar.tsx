'use client'
import { useRouter } from "next/navigation";
import { Calendar, Users, BarChart3, Menu, Clock, LogOut, User } from "lucide-react"

import { SheetMenu } from "@/components/ui/admin-panel/sheet-menu";
import { RealtimeNotification } from "@/components/realtime-notification"
import { useAuth } from "@/components/auth/auth-provider"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "../button";
import { SearchForm } from "./search-form";


export  function Navbar() {
    const router = useRouter()
    const { user, signOut } = useAuth()

    const handleSignOut = async () => {
        await signOut()
        router.push("/login")
    }

  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="mx-4 sm:mx-8 flex h-14 items-center">
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu />
        </div>
        <div className="flex flex-1 items-center space-x-2 justify-end">
            <SearchForm />
        </div>
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
      </div>
    </header>
  );
}
