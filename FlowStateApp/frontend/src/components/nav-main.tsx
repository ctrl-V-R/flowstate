import { Link, useLocation } from "react-router-dom"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { NavItem } from "@/types"



export function NavMain({ items }: { items: NavItem[] }) {
  const location = useLocation()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            // Check if the current route matches the item's URL for "active" styling
            const isActive = location.pathname === item.url

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title} 
                  isActive={isActive}
                >
                  <Link to={item.url}>
                    <span className={`size-4 ${isActive ? 'text-green-500' : 'text-zinc-500'}`}>{item.icon}</span>
                    <span className={isActive ? "text-primary font-medium" : "text-zinc-500"}>{item.title}</span>
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