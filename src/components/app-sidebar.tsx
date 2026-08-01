"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import { Command } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/components/providers/auth-store-provider";
import { siteConfig } from "@/configs/site";
import { navItems } from "@/constants/sidebar-constant";
import { defaultUserMetadata } from "@/constants/user-constant";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { logo, name, subtitle } = siteConfig.company;
  // Selector atomik — mengembalikan seluruh state akan memicu re-render pada
  // setiap perubahan store.
  const user = useAuthStore((state) => state.user);
  // Role yang tidak dikenal jatuh ke menu kasir, bukan menu admin.
  const menu = user?.role === "admin" ? navItems.admin : navItems.cashier;

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  {logo ? (
                    <Image
                      src={logo}
                      alt={name}
                      width={32}
                      height={32}
                      className="size-5 object-contain"
                    />
                  ) : (
                    <Command className="size-4" />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs">{subtitle}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menu} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user ?? defaultUserMetadata} />
      </SidebarFooter>
    </Sidebar>
  );
}
