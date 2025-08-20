"use client";

import { useStore } from "@/hooks/use-store";

import { cn } from "@/lib/utils";
import { Footer } from "@/components/admin-panel/footer";
import  SidebarMenu  from "@/components/admin-panel/sidebarMenu";
import { useSidebarToggle } from "@/hooks/use-sidebar-toggle";
import { Navbar } from "./navbar";

interface AdminPanelProps {
  children: React.ReactNode;
  user?: {
    id:string;
    email?:string;
    name?: string | null;
  } | null
}

export default function AdminPanelLayout({children, user}:AdminPanelProps) {
  const sidebar = useStore(useSidebarToggle, (state) => state);

  if (!sidebar) return null;

  return (
    <>
      <SidebarMenu />
      <Navbar user={user}/>
      <main
        className={cn(
          "min-h-[calc(100vh_-_56px)] bg-zinc-50 dark:bg-zinc-900 transition-[margin-left] ease-in-out duration-300",
          sidebar?.isOpen === false ? "lg:ml-[90px]" : "lg:ml-72"
        )}
      >
        {children}
      </main>
      <footer
        className={cn(
          "transition-[margin-left] ease-in-out duration-300",
          sidebar?.isOpen === false ? "lg:ml-[90px]" : "lg:ml-72"
        )}
      >
        <Footer />
      </footer>
    </>
  );
}
