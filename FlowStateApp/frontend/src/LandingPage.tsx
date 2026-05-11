"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircleIcon, PlusIcon, ZapIcon, KeyIcon, UserIcon } from "lucide-react"
import { TerminalInput } from "./components/ui/TerminalInput"
import { SignupDialog } from "./components/ui/SignupDialog"
import { toast } from "sonner"
import type { LandingPageProps } from "./types"


export default function LandingPage({ onAuthSuccess }: LandingPageProps) {
  const [value, setValue] = useState("")
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'not_found'>('idle')
  const [error, setError] = useState<string | null>(null);

  const [isSignupOpen, setIsSignupOpen] = useState(false)
  const handleSignupFinished = (token: string, userId: string) => {
    setIsSignupOpen(false)
      toast.success(`Welcome, ${userId}!`, {
      description: "Your Admin Passkey has been generated and activated.",
      duration: 5000,
    })
    console.log(`%c [SECURITY] Passkey Generated for ${userId} `, "background: #222; color: #bada55");
    handleAuth(token) // This logs them in immediately after signup
  }

  const navigate = useNavigate()

  // AUTH LOGIC
  const handleAuth = async (tokenToVerify: string) => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token: tokenToVerify })
      });

      if (response.status === 401 || response.status === 404) {
        setStatus('not_found');
        setError("Invalid Protocol Key. Access Denied.");
        return;
      }

      if (!response.ok) throw new Error("Registry Handshake Failed");

      const data = await response.json();

      // 1. PERSIST SESSION DATA
      localStorage.setItem("fs_access_token", tokenToVerify);
      localStorage.setItem("fs_role", data.role);
      localStorage.setItem("fs_user_id", data.user_id);
      
      // If Admin, they have a linked SessionID. If Viewer, the tokenToVerify WAS the SessionID.
      const activeSession = data.role === 'admin' ? data.session_id : tokenToVerify;
      localStorage.setItem("fs_session_id", activeSession);

      // 2. TRIGGER SUCCESS CALLBACK
      onAuthSuccess(tokenToVerify, data.role);
      
      navigate("/", { 
        replace: true 
      });

    } catch (err) {
      setStatus('error');
      setError("Connection failed. Check your Credentials.");
      console.error("Auth Error:", err);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4 overflow-hidden">
      {/* BACKGROUND VISUALS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      {/* CENTRAL PORTAL CARD */}
      <div className="relative w-full max-w-md p-8 rounded-[2.5rem] border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-xl shadow-2xl space-y-8 text-center">
        
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <ZapIcon className="size-6 fill-current" />
            </div>
            <span className="text-3xl font-bold tracking-tighter text-white">FlowState</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {isAdminMode ? "Admin Portal" : "Access Terminal"}
          </h1>
          <p className="text-zinc-500 text-sm">
            {isAdminMode ? "Enter your UUID passkey to manage protocols." : "Enter a 6-character code to join as viewer."}
          </p>
        </div>

        {/* INPUT SECTION */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative group w-full flex justify-center">
            <div className="pointer-events-none absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
            
            {isAdminMode ? (
              <div className="flex w-full gap-2">
                <Input 
                  type="password"
                  placeholder="Paste UUID Passkey..."
                  className="bg-zinc-950/50 border-zinc-800 text-center font-mono text-sm h-12 rounded-xl focus-visible:ring-primary/50"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth(value)}
                />
                <Button onClick={() => handleAuth(value)} className="h-12 w-12 rounded-xl">
                  <KeyIcon className="size-4" />
                </Button>
              </div>
            ) : (
              <TerminalInput 
                onComplete={handleAuth}
                onChange={(val) => setValue(val)} 
              />
            )}
          </div>
          
          <p className="text-[10px] text-zinc-500 font-medium tracking-widest animate-pulse uppercase">
            {status === 'loading' ? "Authenticating..." : (value.length > 0 ? "" : "Awaiting Input")}
          </p>
        </div>

        {/* ACTIONS SECTION */}
        <div className="flex flex-col gap-3 pt-2">
          {/* Toggle between Admin/Viewer input */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setIsAdminMode(!isAdminMode);
              setValue("");
            }}
            className="text-zinc-500 hover:text-white hover:bg-white/5 gap-2"
          >
            {isAdminMode ? <UserIcon className="size-3" /> : <KeyIcon className="size-3" />}
            {isAdminMode ? "Use Viewer Code" : "Login as Admin Instead"}
          </Button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-zinc-800/50" />
            <span className="text-[10px] text-zinc-700 font-bold uppercase">Or</span>
            <div className="h-[1px] flex-1 bg-zinc-800/50" />
          </div>

          {/* Create New Admin Dashboard */}
          <Button 
            onClick={() => setIsSignupOpen(true)} // Trigger the Dialog
            variant="outline" 
            className="..."
          >
            <PlusIcon className="size-4" />
            Create Dashboard as Admin
          </Button>
        </div>
        <SignupDialog 
          isOpen={isSignupOpen} 
          onClose={() => setIsSignupOpen(false)}
          onSignupComplete={handleSignupFinished}
        />

        {/* STATUS MESSAGES */}
        <div className="min-h-[24px] w-full">
          {error && (
            <div className="flex items-center justify-center gap-2 text-red-400 text-sm animate-in fade-in zoom-in-95">
              <AlertCircleIcon className="size-4" />
              {error}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="pt-6 border-t border-zinc-800/50">
          <code className="text-[10px] text-zinc-600 uppercase tracking-widest">
            System Status: Online // Protocol: {isAdminMode ? "Encrypted" : "Shared"}
          </code>
        </div>
      </div>
    </div>
  )
}