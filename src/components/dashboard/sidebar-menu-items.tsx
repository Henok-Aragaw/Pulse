"use client";

import { usePathname } from "next/navigation";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { FolderOpen, LayoutDashboard, Settings, Wand2, FileText, FolderOpenDot, FolderDot } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const SidebarMenuItems = () => {
  const path = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const items = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Chat", url: "/dashboard/chat", icon: Wand2 },
    { title: "Setting", url: "/dashboard/setting", icon: Settings },
  ].map((item) => ({
    ...item,
    active: path === item.url,
  }));

  const handleMenuClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            isActive={item.active}
            className={cn(
              "group relative h-10 w-full justify-start rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary",
              item.active && "bg-primary/15 text-primary shadow-sm"
            )}
          >
            <Link
              href={item.url}
              onClick={handleMenuClick}
              className="flex items-center gap-2"
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  item.active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-primary"
                )}
              />
              <span>{item.title}</span>
              {item.active && (
                <div className="bg-primary absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full" />
              )}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
};

export default SidebarMenuItems;