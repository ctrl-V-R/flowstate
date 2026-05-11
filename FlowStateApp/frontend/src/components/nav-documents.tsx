import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import type { LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

export function NavDocuments({
  items,
}: {
  items: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}) {
  const location = useLocation()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]">
      <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-bold">
        FlowState Assets
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = location.pathname === item.url
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton 
                asChild 
                isActive={isActive}
                tooltip={item.name}
                className="hover:bg-zinc-800/50 transition-colors"
              >
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className={`size-4 ${isActive ? 'text-green-500' : 'text-zinc-500'}`} />
                  <span className={isActive ? "text-zinc-200 font-medium" : "text-zinc-400"}>
                    {item.name}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}