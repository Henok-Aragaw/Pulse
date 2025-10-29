"use client";

import { usePathname } from "next/navigation";
import { BreadcrumbPage } from "@/components/ui/breadcrumb";

const BreadCrumbClient = () => {
  const path = usePathname();

  const getPageTitle = (path: string) => {
    switch (path) {
      case "/dashboard":
        return "Dashboard";
      case "/dashboard/chat":
        return "Chat";
      case "/dashboard/setting":
        return "Setting";
      default:
        return "Dashboard";
    }
  };

  return (
    <BreadcrumbPage className="text-sm font-medium text-foreground">
      {getPageTitle(path)}
    </BreadcrumbPage>
  );
};

export default BreadCrumbClient;