import { useNavigate } from "react-router-dom"
import { MoveLeft, Terminal, AlertCircle } from "lucide-react"

export default function PNF() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="relative inline-block">
          <Terminal className="size-16 text-emerald-500/20 absolute -top-4 -left-4 animate-pulse" />
          <h1 className="text-9xl font-black text-zinc-900 tracking-tighter select-none">
            404
          </h1>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-emerald-500 font-mono text-sm">
            <AlertCircle className="size-4" />
            <span>ERROR: PROTOCOL_NOT_FOUND</span>
          </div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-widest">
            Node Out of Reach
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            The requested address does not exist in the registry or your 
            authorization level has restricted access to this sequence.
            If you think otherwise please raise a support ticket so our team can check.
          </p>
        </div>

        <div className="pt-8">
          <button
            onClick={() => navigate("/")}
            className="group relative inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-300 hover:text-white hover:border-emerald-500/50 transition-all duration-300"
          >
            <MoveLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Return to Base</span>
          </button>
        </div>
      </div>
    </div>
  )
}