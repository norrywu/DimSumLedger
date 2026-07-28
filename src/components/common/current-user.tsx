"use client";

import { LogOutIcon } from "lucide-react";

import { useAuthStore } from "@/components/providers/auth-store-provider";
import { Button } from "@/components/ui/button";
import { logout } from "@/servers/auth";

export function CurrentUser() {
  // Selector atomik: komponen ini hanya re-render saat `user` berubah.
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col text-right leading-tight">
        <span className="text-sm font-medium">{user.name ?? user.email}</span>
        {user.role && (
          <span className="text-xs text-muted-foreground capitalize">
            {user.role}
          </span>
        )}
      </div>
      <form action={logout}>
        <Button variant="outline" size="icon" type="submit" title="Keluar">
          <LogOutIcon />
          <span className="sr-only">Keluar</span>
        </Button>
      </form>
    </div>
  );
}
