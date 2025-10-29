"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { authClient, useSession } from "@/lib/auth-client";
import { UAParser } from "ua-parser-js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ Proper typing for sessions
type Session = {
  id: string;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  browser: string;
  os: string;
  device: string;
};

const Settings = () => {
  const { data: session, refetch } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPendingName, setIsPendingName] = useState(false);
  const [isPendingEmail, setIsPendingEmail] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (session) {
          setName(session.user?.name ?? "");
          setEmail(session.user?.email ?? "");

          const { data } = await authClient.listSessions();

          const enhanced: Session[] = (data ?? []).map((s) => {
            const parser = new UAParser(s.userAgent || "");
            const browser = parser.getBrowser().name || "Unknown Browser";
            const os = parser.getOS().name || "Unknown OS";
            const device = parser.getDevice().model || "Desktop";
            return { ...s, browser, os, device, createdAt: s.createdAt.toISOString() } as Session;
          });

          setSessions(enhanced);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load session data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleChangeName = async () => {
    if (!name.trim()) {
      toast.error("Please enter a valid name.");
      return;
    }

    try {
      setIsPendingName(true);
      await authClient.updateUser({ name });
      refetch?.();
      toast.success("Display name updated successfully!");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Something went wrong");
    } finally {
      setIsPendingName(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email.");
      return;
    }

    try {
      setIsPendingEmail(true);
      await authClient.changeEmail({
        newEmail: email,
        callbackURL: "/dashboard/setting",
      });
      refetch?.();
      toast.success("Email updated successfully!");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Something went wrong");
    } finally {
      setIsPendingEmail(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      setIsRevoking(true);
      await authClient.revokeOtherSessions();
      toast.success("All other sessions have been logged out.");

      const { data } = await authClient.listSessions();
      const enhanced: Session[] = (data ?? []).map((s) => {
        const parser = new UAParser(s.userAgent || "");
        const browser = parser.getBrowser().name || "Unknown Browser";
        const os = parser.getOS().name || "Unknown OS";
        const device = parser.getDevice().model || "Desktop";
        return { ...s, browser, os, device, createdAt: s.createdAt.toISOString() } as Session;
      });
      setSessions(enhanced);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to revoke other sessions.");
    } finally {
      setIsRevoking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-lg space-y-6">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36 mb-1" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-28" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36 mb-1" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-28" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40 mb-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences and security settings.
        </p>
      </div>

      {/* Display Name */}
      <Card>
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
          <CardDescription>
            Update your public display name used across the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter new name"
            disabled={isPendingName}
          />
          <Button
            onClick={handleChangeName}
            disabled={isPendingName || !name.trim()}
            className="self-end cursor-pointer"
          >
            {isPendingName ? "Updating..." : "Change Name"}
          </Button>
        </CardContent>
      </Card>

      {/* Email */}
      <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>
            Change the email associated with your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter new email"
            type="email"
            disabled={isPendingEmail}
          />
          <Button
            onClick={handleChangeEmail}
            disabled={isPendingEmail || !email.trim()}
            className="self-end cursor-pointer"
          >
            {isPendingEmail ? "Updating..." : "Change Email"}
          </Button>
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            See and manage where you’re currently signed in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className={`p-3 rounded-md border ${
                    s.id === session?.session?.id
                      ? "border-green-500 bg-green-50 dark:bg-green-950/40"
                      : "border-border"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>
                      {s.browser} — {s.os} ({s.device})
                    </span>
                    {s.id === session?.session?.id && (
                      <span className="text-xs text-green-500 font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    IP: {s.ipAddress ?? "Unknown"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              No active sessions found.
            </p>
          )}

          <Button
            onClick={handleRevokeOtherSessions}
            disabled={isRevoking || sessions.length <= 1}
            variant="destructive"
            className="self-end cursor-pointer"
          >
            {isRevoking ? "Revoking..." : "Revoke Other Sessions"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
