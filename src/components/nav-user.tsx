"use client";

import { BadgeCheck, ChevronsUpDown, LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { getInitials } from "@/lib/utils";
import { useAuthStore } from "@/components/providers/auth-store-provider";
import { logout } from "@/servers/auth";
import { saveProfile } from "@/servers/profile";
import type { UserMetadata } from "@/types/metadata";
import { toast } from "sonner";

import { PROFILE_FIELDS } from "@/constants/profilefield-constant";
import {
  profileSchema,
  type ProfileSchema,
} from "@/validation/profile-validation";
import { useMutation } from "@tanstack/react-query";
import { TriggerSheet } from "./sheet-trigger";

export function NavUser({ user }: { user: UserMetadata }) {
  const { isMobile } = useSidebar();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const profileDefaults: ProfileSchema = {
    name: user.name ?? "",
    email: user.email ?? "",
    password: "",
  };

  const { mutate, isPending } = useMutation({
    mutationFn: saveProfile,
    onSuccess: (result) => {
      // Kenapa store diisi manual padahal root layout sudah mengoper
      // <AuthStoreProvider user={user}>? Karena prop itu HANYA dibaca oleh
      // initializer `useState` di provider, yang React panggil tepat sekali
      // saat mount — dan provider itu tidak pernah remount, jadi nilai baru
      // dari server tidak akan pernah menyusul masuk ke store.
      //
      // `revalidatePath` di dalam saveProfile juga tidak menolong halaman yang
      // sedang terbuka: ia cuma menandai cache server basi untuk request
      // berikutnya. Dan `mutate()` milik react-query bukan transition, jadi
      // Next tidak mengirim RSC payload baru di roundtrip ini.
      //
      // Baris inilah yang membuat nama di sidebar berubah tanpa reload.
      if (result.user) setUser(result.user);

      toast.success(result.message ?? "Profil berhasil diperbarui");
      setIsSheetOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: ProfileSchema) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    mutate(formData);
  };

  const displayName = user.name ?? "";
  const displayEmail = user.email ?? "";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {/* Belum ada sumber avatar: tabel `profiles` tidak punya
                  kolomnya dan belum ada storage bucket. Inisial saja. */}
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                {user.role && (
                  <span className="truncate text-xs text-muted-foreground capitalize">
                    {user.role}
                  </span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setIsSheetOpen(true);
              }}
            >
              <BadgeCheck />
              Account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TriggerSheet<ProfileSchema>
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          fields={PROFILE_FIELDS}
          sheetTitle="Account"
          defaultValues={profileDefaults}
          schema={profileSchema}
          onSubmit={onSubmit}
          submitLabel="Save changes"
          isPending={isPending}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
