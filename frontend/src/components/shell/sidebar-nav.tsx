"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavSection } from "./nav-items";

export function SidebarNav({
  sections,
  onNavigate,
}: {
  sections: NavSection[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex flex-col gap-5 px-3">
      {sections.map((section, i) => (
        <div
          key={section.label ?? `section-${i}`}
          className="flex flex-col gap-1"
        >
          {section.label && (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-navy-foreground/40">
              {section.label}
            </p>
          )}
          {section.items.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-navy-foreground/60 hover:bg-white/5 hover:text-navy-foreground",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-electric" />
                )}
                <Icon
                  className={cn(
                    "size-4",
                    active && "text-electric",
                  )}
                />
                {item.title}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
