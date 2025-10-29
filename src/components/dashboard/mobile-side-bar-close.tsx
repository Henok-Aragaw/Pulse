"use client";

import { X } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export default function MobileSidebarClose() {
  const { setOpenMobile, isMobile } = useSidebar();
  if (!isMobile) return null;

  return (
    <div className="absolute right-2 top-2 z-50 mb-4 px-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpenMobile(false)}
        className="h-8 w-8 p-0 hover:bg-muted/50"
        aria-label="Close sidebar"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}