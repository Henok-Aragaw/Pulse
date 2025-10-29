"use client";

import React, { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem } from "@/components/ui/breadcrumb";
import AppSidebar from "@/components/dashboard/app-sidebar";
import BreadCrumbClient from "@/components/dashboard/breadcrumb-client";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {/* Left Sidebar */}
        <AppSidebar />

        {/* Main Area */}
        <div className="flex flex-1 flex-col transition-all duration-300">
          {/* Top Header */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Mobile Sidebar Toggle */}
              <SidebarTrigger />

              {/* Dynamic Breadcrumb */}
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadCrumbClient />
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <Separator />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>

  );
}