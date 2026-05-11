import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useLocation } from "react-router-dom"



export function SiteHeader() {
  const location = useLocation()
  const pathname = location.pathname

  // Dynamic Page Title Logic
  const getPageConfig = (path: string) => {
    switch (path) {
      case "/": return { title: "Dashboard" }
      case "/syshealth": return { title: "System Health" }
      case "/connections": return { title: "Session Connections" }
      case "/terminal": return { title: "Live Terminal" }
      default: return { title: "FlowState" }
    }
  }

  const { title } = getPageConfig(pathname)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-40 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 size-10 text-zinc-400 hover:text-white transition-colors" />
        
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 bg-zinc-800"
        />

        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold tracking-tight text-zinc-200 uppercase tracking-wider">
            {title}
          </h1>
        </div>

        {/* Right side status */}
        <div className="ml-auto flex items-center gap-4">
           <div className="hidden md:flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Node: Core-01</span>
           </div>
        </div>
      </div>
    </header>
  )
}