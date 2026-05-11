"use client"

import { useEffect, useState } from "react"
import { 
  MailIcon, 
  ShieldCheckIcon, 
  ShieldAlertIcon,
  CalendarIcon,
  Loader2Icon,
  Check,
  Copy,
  EyeOff,
  Eye
} from "lucide-react"
import { getUserProfile } from "@/connectionService"
import type { UserData } from "@/types"
import { toast } from "sonner"
import { Button } from "./ui/button"



export default function UserSettings() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const token = localStorage.getItem('fs_access_token') || "Default"
  const maskedToken = `${token.substring(0, 4)}${"•".repeat(16)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success("UID Copied", { description: "Identity token saved to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Copy Failed");
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile()
        setUser(data)
      } catch (err) {
        console.error("Failed to load user profile", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-zinc-700" />
      </div>
    )
  }

  if (!user) return <div className="text-zinc-500">Access Denied: Session Missing</div>

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <div className="flex items-end justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Admin Profile</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage your terminal access and credentials.</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
          user.role === 'admin' 
            ? 'bg-primary/10 border-primary/50 text-primary' 
            : 'bg-zinc-800 border-zinc-700 text-zinc-400'
        }`}>
          {user.role} Status
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT COLUMN: AVATAR & BASIC INFO */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center gap-3 text-zinc-400 mb-2">
              <CalendarIcon className="size-4" />
              <span className="text-xs font-medium">User Created</span>
            </div>
            <p className="text-sm text-white font-mono">
              {new Date(user.initializedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED CREDENTIALS */}
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-[0.2em]">Core Metadata</h3>
            
            <div className="grid grid-cols-1 gap-4">
              {/* USERID */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all group">
                {/* Left: Copy Action */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-9 w-9 rounded-lg bg-zinc-950/50 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
                >
                  {copied ? (
                    <Check className="size-4 text-emerald-500" />
                  ) : (
                    <Copy className="size-4 text-zinc-500 group-hover:text-emerald-300" />
                  )}
                </Button>

                {/* Center: Token Info */}
                <div className="flex items-center gap-4 flex-1 px-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Protocol UID</p>
                    <p className="text-white font-mono text-sm tracking-tight">
                      {showToken ? token : maskedToken}
                    </p>
                  </div>
                </div>

                {/* Right: Visibility Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowToken(!showToken)}
                  className="h-9 w-9 rounded-lg bg-zinc-950/50 border border-zinc-800 hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  {showToken ? (
                    <EyeOff className="size-4 text-red-400" />
                  ) : (
                    <Eye className="size-4 text-red-400" />
                  )}
                </Button>
              </div>

              {/* EMAIL */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-4">
                  <MailIcon className="size-5 text-zinc-500" />
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Primary Communication</p>
                    <p className="text-white text-sm">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* SECURITY ROLE */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-4">
                  {user.role === 'admin' ? (
                    <ShieldCheckIcon className="size-5 text-primary" />
                  ) : (
                    <ShieldAlertIcon className="size-5 text-zinc-500" />
                  )}
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Permission Layer</p>
                    <p className="text-white text-sm capitalize">{user.role} Access Enabled</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SYSTEM NOTICE */}
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-[11px] text-blue-400/80 leading-relaxed italic">
              Note: Credentials are locked to this hardware session. Changing your role requires a full system flush and re-initialization from the Admin Portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}