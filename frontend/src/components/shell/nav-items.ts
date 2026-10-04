import {
  BarChart3Icon,
  ClipboardListIcon,
  FileTextIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  /** null = unlabeled leading section (Dashboard) */
  label: string | null;
  items: NavItem[];
}

/** Navigation for the admin shell — admins manage
 * students and all exam content directly.
 */
export function getNavItems(): NavSection[] {
  const sections: NavSection[] = [
    {
      label: null,
      items: [
        {
          title: "Dashboard",
          href: "/admin",
          icon: LayoutDashboardIcon,
        },
      ],
    },
    {
      label: "Exam Management",
      items: [
        { title: "Tests", href: "/admin/tests", icon: FileTextIcon },
        {
          title: "Results",
          href: "/admin/results",
          icon: BarChart3Icon,
        },
        {
          title: "Reports",
          href: "/admin/reports",
          icon: ClipboardListIcon,
        },
      ],
    },
    {
      label: "User Management",
      items: [
        {
          title: "Students",
          href: "/admin/students",
          icon: GraduationCapIcon,
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          title: "Settings",
          href: "/admin/settings",
          icon: SettingsIcon,
        },
      ],
    },
  ];

  return sections;
}
