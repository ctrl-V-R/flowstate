import { ShieldCheckIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function SiteFooter() {
  const navigate = useNavigate()

  return (
    <footer className="mt-auto border-t border-zinc-800/50 bg-zinc-950/30 py-4 px-6">
      <div className="flex items-center justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={() => navigate("/documentation")}
              className="flex items-center gap-2 text-[10px] text-zinc-600 px-2 font-mono cursor-pointer hover:text-zinc-400 transition-colors group"
            >
              <ShieldCheckIcon className="size-3 group-hover:text-primary transition-colors" />
              <span className="tracking-tighter uppercase">
                All connections are encrypted and cached locally
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-zinc-200 border-zinc-800 text-xs">
            Learn more
          </TooltipContent>
        </Tooltip>
      </div>
    </footer>
  )
}