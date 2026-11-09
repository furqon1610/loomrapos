"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
  badge?: number;
  /** Label kecil di samping nama menu, mis. "Pro" untuk fitur terkunci. */
  tag?: string;
};

export default function SidebarNav({
  items,
  variant,
}: {
  items: NavItem[];
  variant: "side" | "top";
}) {
  const pathname = usePathname();
  const side = variant === "side";

  return (
    <nav
      className={side ? "flex flex-col gap-1" : "flex gap-1 overflow-x-auto px-3 pb-3 pt-1"}
    >
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl text-sm font-semibold transition ${
              side ? "px-4 py-2.5" : "shrink-0 whitespace-nowrap px-3 py-2"
            } ${active ? "bg-[#e8f3fc] text-[#2875b4]" : "text-[#4a5f7d] hover:bg-[#f0f6fc]"}`}
          >
            <Icon name={item.icon} className="h-5 w-5" />
            <span>{item.label}</span>
            {item.tag && (
              <span className="ml-auto rounded-full bg-[#e8f3fc] px-2 py-0.5 text-[10px] font-bold text-[#2875b4]">
                {item.tag}
              </span>
            )}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
