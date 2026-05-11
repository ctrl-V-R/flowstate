"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupContent
} from "@/components/ui/sidebar"

import { Link, useLocation } from "react-router-dom"
import type { LucideIcon } from "lucide-react"

export function NavSecondary({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
}) {
  const location = useLocation()
  
  return (
    <SidebarGroup className="group-data-[collapsible=icon]">
      <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">
        Docs & Resources
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = location.pathname === item.url
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  tooltip={item.title}
                  className="hover:bg-zinc-800/50 transition-colors"
                >
                  <Link to={item.url} className="flex items-center gap-3">
                    <item.icon className={`size-4 ${isActive ? 'text-green-500' : 'text-zinc-500'}`} />
                    <span className={isActive ? "text-zinc-200 font-medium" : "text-zinc-400"}>
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
