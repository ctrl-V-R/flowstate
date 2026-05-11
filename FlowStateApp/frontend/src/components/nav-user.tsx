import { useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { 
  EllipsisVerticalIcon, 
  LogOutIcon,
  SettingsIcon, 
  BookOpenIcon,
  KeyIcon, 
  CheckIcon
} from "lucide-react"

import { useNavigate } from "react-router-dom"
import { LogoutDialog } from "./LogoutDialog"

export function NavUser({ onLogout }: { onLogout: () => void }) {
  const { isMobile } = useSidebar()
  const [showKey, setShowKey] = useState(false)
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false);
  const accessKey = localStorage.getItem("fs_session_id");

  const sessionStart = localStorage.getItem("fs_session_start") || "Just now"

  const [isLogoutAlertDialogOpen, setIsLogoutAlertDialogOpen] = useState(false);

  const handleCopyAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Copy to clipboard
    if (accessKey) {
      await navigator.clipboard.writeText(accessKey);
      setCopied(true);
      
      // 2. Visual Feedback: Toggle the "Eye" icon momentarily
      setShowKey(true);

      // 3. Reset after delay
      setTimeout(() => {
        setCopied(false);
        setShowKey(false);
      }, 2000);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem className="relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild >
          <SidebarMenuButton
        size="lg"
        className="transition-all duration-300 group-data-[state=open]:bg-sidebar-accent"
      >
        <div className="h-8 w-8 shrink-0" /> {/* Spacer */}
        
        {/* Wrap text in a div that moves slightly on hover */}
        <div className="grid flex-1 text-left text-sm leading-tight transition-transform duration-200 group-hover:translate-x-1">
          <span className="truncate font-semibold tracking-wider">
            {showKey ? accessKey : "••••••"}
          </span>
          <span className="truncate text-xs text-muted-foreground group-hover:text-primary transition-colors">
            Active Instance
          </span>
        </div>
        
        <EllipsisVerticalIcon className="ml-auto size-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        {/* THE EYE ICON */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={handleCopyAction}
              className="
                absolute top-1/2 -translate-y-1/2 z-20 
                flex h-8 w-8 items-center justify-center rounded-lg 
                bg-primary/10 text-primary cursor-pointer 
                transition-all duration-300
                
                /* Sidebar States */
                group-data-[collapsible=panel]:left-2
                group-data-[collapsible=icon]:left-0 
                group-data-[collapsible=icon]:w-full
                
                hover:scale-110 hover:bg-primary/20
                active:scale-95
              "
            >
              {showKey ? (
                <CheckIcon className="size-4 animate-in zoom-in duration-300" />
              ) : (
                <KeyIcon className="size-4 animate-in fade-in duration-300" />
              )}
            </div>
          </TooltipTrigger>
          
          <TooltipContent side="right" className="font-mono text-xs">
            {copied ? "Copied!" : "Copy Session ID"}
          </TooltipContent>
        </Tooltip>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
                  <KeyIcon className="size-4 text-zinc-400" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">FlowState Viewer</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Active Since: {sessionStart}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              {/* Only show Settings if the user is an Admin */}
              {localStorage.getItem("fs_role") === "admin" && (
                <>
                  <DropdownMenuItem
                    onClick={() => navigate("/settings")}
                    className="cursor-pointer focus:bg-muted focus:text-sidebar-accent-foreground"
                  >
                    <SettingsIcon className="size-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem 
                onClick={() => navigate("/documentation")} 
                className="cursor-pointer focus:bg-muted focus:text-sidebar-accent-foreground"
              >
                <BookOpenIcon className="size-4 mr-2" />
                Documentation
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={ () => setIsLogoutAlertDialogOpen(true) }
            className="text-destructive focus:bg-destructive focus:text-primary cursor-pointer"
            >
              <LogOutIcon className="size-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      <LogoutDialog 
                open={isLogoutAlertDialogOpen} 
                onOpenChange={setIsLogoutAlertDialogOpen} 
                onConfirm={() => {
                  setIsLogoutAlertDialogOpen(false);
                  onLogout();
                }} 
              />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}