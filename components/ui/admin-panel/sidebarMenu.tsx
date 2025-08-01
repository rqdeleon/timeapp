"use client"
import React from 'react'
import Link from 'next/link'
import { PanelsTopLeft } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useStore } from '@/hooks/use-store'
import { SidebarToggle } from './sidebar-toggle'
import { useSidebarToggle } from '@/hooks/use-sidebar-toggle'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { Menu } from './menu'

export default function SidebarMenu() {
  const sidebar = useStore(useSidebarToggle, (state) => state);
  const param = useParams();

  if(!sidebar) return null

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300",
        sidebar?.isOpen === false ? "w-[90px]" : "w-52"
      )}
    >
      <SidebarToggle isOpen={sidebar?.isOpen} setIsOpen={sidebar?.setIsOpen} />
      <div className="relative h-full flex flex-col px-3 py-4 overflow-y-auto shadow-md dark:shadow-zinc-800">
        <Button
          className={cn(
            "transition-transform ease-in-out duration-300 mb-1",
            sidebar?.isOpen === false ? "translate-x-1" : "translate-x-0"
          )}
          variant="link"
          asChild
        >
          <Link href={`/dashboard/${param.companyId}`} className="flex items-center gap-2">
            <PanelsTopLeft className="w-6 h-6 mr-1" />
            <h1
              className={cn(
                "font-bold text-lg whitespace-nowrap transition-[transform,opacity,display] ease-in-out duration-300",
                sidebar?.isOpen === false
                  ? "-translate-x-96 opacity-0 hidden"
                  : "translate-x-0 opacity-100"
              )}
            >
              SJEJ
            </h1>
          </Link>
        </Button>
        <Menu isOpen={sidebar?.isOpen} />
      </div>
    </aside>
  )
}
