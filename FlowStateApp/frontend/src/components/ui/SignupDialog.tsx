"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Loader2Icon, 
  UserIcon, 
  MailIcon, 
  ShieldCheckIcon,
  XIcon 
} from "lucide-react"
import type { SignupDialogProps } from "@/types"
import { API_URL } from "@/App"

export function SignupDialog({ isOpen, onClose, onSignupComplete }: SignupDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // The Master Key for the Admin
    const adminUUID = crypto.randomUUID()
    
    // The Shareable Key for Viewers (Shorter/Human-readable)
    const shareableSessionID = Math.random().toString(36).substring(2, 8).toUpperCase() 
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token: adminUUID,
          session_id: shareableSessionID,
          user_id: formData.username,
          email: formData.email 
        })
      })

      if (response.ok) {
        onSignupComplete(adminUUID, formData.username, shareableSessionID)
      }
    } catch (err) {
      console.error("Signup failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg animate-in fade-in duration-300">
      <div className="relative w-full max-w-md p-8 rounded-[2rem] border border-zinc-800 bg-zinc-900 shadow-4xl space-y-6">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
          <XIcon className="size-5" />
        </button>

        <div className="space-y-2 text-center">
          <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <ShieldCheckIcon className="size-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white">Initialize Admin Node</h2>
          <p className="text-zinc-500 text-sm">Set your credentials to generate a secure UUID.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
              <Input 
                required
                placeholder="ctrl-v-r"
                className="pl-10 bg-zinc-950 border-zinc-800 focus:ring-primary/40"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Email Address</label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
              <Input 
                required
                type="email"
                placeholder="admin@flowstate.dev"
                className="pl-10 bg-zinc-950 border-zinc-800 focus:ring-primary/40"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-zinc-100 hover:bg-primary/90 text-zinc-600 font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
          >
            {loading ? <Loader2Icon className="animate-spin mr-2" /> : "Generate Secure Passkey"}
          </Button>
        </form>

        <p className="text-[10px] text-center text-zinc-600 uppercase tracking-tighter">
          Encryption: AES-256-GCM Standard
        </p>
      </div>
    </div>
  )
}