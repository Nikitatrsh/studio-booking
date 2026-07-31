"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const roleTone = {
  admin: "amber",
  instructor: "blue",
  member: "green",
} as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-sm font-semibold text-slate-900">Studio Booking</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user.name}</span>
            <Badge tone={roleTone[user.role]}>{user.role}</Badge>
            <Button variant="ghost" onClick={() => logout()}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
