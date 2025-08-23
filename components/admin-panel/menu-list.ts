import { useParams } from "next/navigation";

import {
  UploadCloud,
  IdCard,
  FileClock,
  Settings,
  Bookmark,
  ChartNoAxesCombined,
  LayoutGrid,
  LucideIcon,
  Clock1,
  UsersIcon, 
  LogIn
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
      groupLabel: "Attendance",
      menus: [
        {
          href: '/dashboard/schedule/',
          label: "Schedule",
          active: pathname === '/dashboard/schedule/',
          icon: LogIn,
          submenus: [],
        },
        {
          href: '/dashboard/attendances',
          label: "Attendance Logs",
          active: pathname === '/dashboard/attendances',
          icon: FileClock,
          submenus: [],
        },
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
      groupLabel: "Report",
      menus: [
        {
          href: '/dashboard/attendance-report/',
          label: "Attendance Report",
          active: pathname.includes("/dashboard/attendance-report"),
          icon: ChartNoAxesCombined,
          submenus: []
        },
        {
          href: '/dashboard/timein-report/',
          label: "Time Logs Report",
          active: pathname.includes("/dashboard/timein-report"),
          icon: IdCard,
          submenus: []
        },
        {
          href: '/dashboard/employee-schedule-report/',
          label: "Employee Schedule Report",
          active: pathname.includes("/dashboard/employee-schedule-report"),
          icon: IdCard,
          submenus: []
        },
                {
          href: '/dashboard/late-report/',
          label: "Late & Tardiness Report",
          active: pathname.includes("/dashboard/late-report"),
          icon: Clock1,
          submenus: []
        },
      ]
    },
    {
      groupLabel: "Setup",
      menus: [
        {
          href: `/dashboard/upload/`,
          label: "Upload Center",
          active: pathname.includes("/upload"),
          icon: UploadCloud,
          submenus: []
        },
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
