"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import MobileSidebarClose from "./mobile-side-bar-close";
import Link from "next/link";
import { LogOut, Settings, User } from "lucide-react";
import SidebarMenuItems from "./sidebar-menu-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const AppSidebar = () => {
  const [isPending, setIsPending] = useState(false);

  const { data: session, refetch } = useSession();
  const router = useRouter();

    useEffect(() => {
    refetch();
  }, [refetch]);

  const handleClick = async () => {
    await signOut({
      fetchOptions: {
        onRequest: () => {
          setIsPending(true);
        },
        onResponse: () => {
          setIsPending(false);
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
        onSuccess: () => {
          router.push("/auth/sign-in");
          toast.success("Logout successful");
        },
      },
    });
  };

  return (
    <Sidebar className="bg-gradient-to-b from-background to-muted/20 border-r">
      {/* Sidebar Content */}
      <SidebarContent className="relative px-3">
        <MobileSidebarClose />
        <SidebarGroup>
          <SidebarGroupLabel className="mt-6 mb-8 flex flex-col items-start justify-start px-2 text-primary">
            <Link href="/" className="mb-1 flex items-center gap-2">
              <p className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-2xl font-bold tracking-tight text-transparent font-heading">
                 Pulse
              </p>
            </Link>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItems />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="border-t bg-muted/30 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between px-2 py-2 hover:bg-muted cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image ?? ""} alt={session?.user?.name ?? "User"} />
                  <AvatarFallback>
                    {session?.user?.name?.charAt(0)?.toUpperCase() ?? "L"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{session?.user?.name ?? "Unknown User"}</span>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="start"
            className="w-56 rounded-lg border bg-popover p-2 shadow-md"
          >
            {/* Display name & email instead of "My Account" */}
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span className="text-sm font-semibold">{session?.user?.name ?? "User"}</span>
              <span className="text-xs text-muted-foreground truncate">
                {session?.user?.email ?? "user@example.com"}
              </span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem> */}

            <DropdownMenuItem asChild>
              <Link href="/dashboard/setting" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleClick}
              disabled={isPending}
              className="flex cursor-pointer items-center gap-2 text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {isPending ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;