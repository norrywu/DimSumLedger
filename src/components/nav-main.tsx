"use client";

import { ChevronRight } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/types/navigation";

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          // `items` bertipe `undefined` di NavLink dan `NavSubItem[]` di
          // NavGroup, jadi cek ini menyempitkan union dengan benar. Bukan
          // `"items" in item`: sejak NavLink punya `items?: never`, kedua
          // cabang sama-sama mendeklarasikan properti itu dan `in` tidak lagi
          // membedakan apa pun.
          if (!item.items) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.url}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Buka grup kalau salah satu anaknya sedang aktif — tanpa ini, user
          // yang mendarat di /APP/admin/categories melihat grup "Produk"
          // terlipat dan kehilangan konteks posisinya. Dihitung di sini, bukan
          // ditulis tangan di konstanta, karena konstanta tidak tahu pathname.
          const hasActiveChild = item.items.some(
            (subItem) => subItem.url === pathname,
          );

          return (
            // `group/collapsible` dipasang di sini supaya chevron di dalamnya
            // bisa ikut `data-[state]` milik Collapsible lewat varian
            // `group-data-[state=open]/collapsible:`.
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={hasActiveChild}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                {/* Seluruh baris jadi pemicu lipat — tidak ada <Link> di sini,
                    jadi menu grup tidak pernah memindahkan halaman. */}
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <item.icon />
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === subItem.url}
                        >
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
