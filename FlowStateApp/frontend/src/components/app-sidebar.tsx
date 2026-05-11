import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Branding } from "@/components/ui/Branding"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { 
  LayoutDashboardIcon, 
  TerminalIcon, 
  CpuIcon,
  DatabaseIcon, 
  FileCodeIcon,
  DatabaseZapIcon,
  BellDotIcon,
  MessageCircleQuestionMarkIcon,
  CloudCogIcon
} from "lucide-react"
import type { AppSidebarProps } from "@/types"

const data = {
  navMain: [
    {
      title: "Control Center",
      url: "/",
      icon: <LayoutDashboardIcon />,
      roles: ["admin", "viewer"], // Everyone sees this
    },
    {
      title: "Connections",
      url: "/connections",
      icon: <DatabaseZapIcon />,
      roles: ["admin"], // Editor/Admin only
    },
    {
      title: "Terminal",
      url: "/terminal",
      icon: <TerminalIcon />,
      roles: ["admin"],
    },
    {
      title: "System Performance",
      url: "/performance",
      icon: <CpuIcon />,
      roles: ["admin", "viewer"],
    },
    {
      title: "Notification History",
      url: "/notifications",
      icon: <BellDotIcon />,
      roles: ["admin", "viewer"],
    },
  ],
  documents: [
    {
      name: "System Health",
      url: "/syshealth",
      icon: DatabaseIcon,
      roles: ["admin", "viewer"],
    },
    {
      name: "Prompt Templates",
      url: "/prompts",
      icon: FileCodeIcon,
      roles: ["admin", "viewer"],
    },
  ],
  navSecondary: [
    {
      title: "Features & Change Log",
      url: "/faq",
      icon: CloudCogIcon,
      roles: ["admin", "viewer"],
    },
    {
      title: "Support",
      url: "/support",
      icon: MessageCircleQuestionMarkIcon,
      roles: ["admin", "viewer"],
    },
  ],
}

export function AppSidebar({ onLogout, user, ...props }: AppSidebarProps) {
  // 3. Filter helper function
  const filterByRole = (items: any[]) => {
    return items.filter(item => item.roles.includes(user?.role || "viewer"));
  }

  const filteredNavMain = filterByRole(data.navMain);
  const filteredDocuments = filterByRole(data.documents);
  const filteredSecondary = filterByRole(data.navSecondary);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="relative">
            <Branding />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Pass ONLY the filtered items */}
        <NavMain items={filteredNavMain} />

        {/* Hide sections entirely if no items remain for that role */}
        {filteredDocuments.length > 0 && (
          <>
            <span className="mx-2 my-4 border-t border-zinc-800" />
            <NavDocuments items={filteredDocuments} />
          </>
        )}

        <span className="mx-2 my-4 border-t border-zinc-800" />
        <NavSecondary items={filteredSecondary} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}