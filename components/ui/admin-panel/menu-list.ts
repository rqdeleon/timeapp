import { useParams } from "next/navigation";

import {
  Boxes,
  Users,
  ShoppingBasket,
  Settings,
  Bookmark,
  Store,
  LayoutGrid,
  LucideIcon,
  Receipt,
  UsersIcon,
  Calendar
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active: boolean;
};

type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon
  submenus: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  const params = useParams();

  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Overview",
          active: pathname === "/dashboard",
          icon: LayoutGrid,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "Schedule",
      menus: [
        {
          href: '/dashboard/schedule',
          label: "Weekly",
          active: pathname === '/dashboard/schedule/',
          icon: Calendar,
          submenus: [],
        },
        {
          href: '/dashboard/schedule/list',
          label: "List",
          active: pathname === '/dashboard/schedule/list',
          icon: Bookmark,
          submenus: [],
        },
        {
          href: '/dashboard/assign/',
          label: "Assign",
          active: pathname === '/dashboard/assign/',
          icon: Receipt,
          submenus: [],
        }
      ]
    },
    {
      groupLabel: "Employee",
      menus: [
        {
          href: '/dashboard/employees/',
          label: "Employees",
          active: pathname.includes("/dashboard/employees"),
          icon: UsersIcon,
          submenus: []
        },
      ]
    },
    {
      groupLabel: "Setup",
      menus: [
        {
          href: `/dashboard/settings/`,
          label: "Settings",
          active: pathname.includes("/settings"),
          icon: Settings,
          submenus: []
        }
      ]
    }
  ];
}
