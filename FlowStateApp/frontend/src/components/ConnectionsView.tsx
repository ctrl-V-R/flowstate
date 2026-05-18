"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Settings2Icon, 
  GlobeIcon, 
  Loader2Icon,
  CheckCircle2Icon,
  SparklesIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2,
  ActivityIcon,
  XCircleIcon,
  PlugZapIcon
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { toast } from "sonner"
import type { ConnectionsViewProps } from "@/types"


export function ConnectionsView({ onSuccess, initialData, fetchEndpoints }: ConnectionsViewProps) {
  {/* STATE MANAGEMENT */}
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [quota, _setQuota] = useState(0) // Logic test: 0 triggers auto-open
  const isEditMode = !!initialData

  {/* FORM FIELDS */}
  {/* URL */}
  const [EndpointURL, setEndpointURL] = useState(initialData?.url || "")
  {/* NAME */}
  const [name, setName] = useState(initialData?.name || "")
  {/* LLM KEY */}
  const [customKey, setCustomKey] = useState(initialData?.customKey || "")
  const [showCustomKey, setShowCustomKey] = useState(false)
  {/* SECRET */}
  const [endpointSecret, setEndpointSecret] = useState(initialData?.endpointSecret || "")
  const [showSecret, setShowSecret] = useState(false)
  {/* LLM TOGGLE */}
  const [useLLM, setUseLLM] = useState(false) 
  {/* TIMEOUT */}
  const [timeout, setTimeoutVal] = useState(initialData?.settings?.timeout)
  {/* RETRIES */}
  const [retries, setRetries] = useState(initialData?.settings?.retries)
  {/* HEADERS */}
  const [headers, setHeaders] = useState(
  initialData?.settings?.headers ? JSON.stringify(initialData.settings.headers, null, 2) : ""
  )
  {/* ENABLED - DISABLED */}
  const [enabledState, setEnabled] = useState(initialData?.enabledState ?? false);
  {/* PINGING STATE */}
  const [pingState, setPingState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const isKeyRequired = useLLM && Number(quota) === 0 && (!customKey || customKey.trim() === "");
  const otherAdvancedFieldsFilled = endpointSecret || headers.trim() !== "{}" || timeout !== 30000 || retries !== 3

  const token = localStorage.getItem("fs_access_token");

  // System-forced open logic
  useEffect(() => {
    if (isKeyRequired) {
      setIsAdvancedOpen(true);
      setShowCustomKey(true);
    } else if (!isKeyRequired && showCustomKey && !otherAdvancedFieldsFilled) {
      setShowCustomKey(false);
      setIsAdvancedOpen(false);
    } 
  }, [isKeyRequired])

  const [isSaving, setIsSaving] = useState(false)
  
  const handlePing = async () => {
    if (!EndpointURL) return;

    setPingState('testing');
    
    try {
      const isNew = !initialData?.id;
      const url = isNew 
        ? `/api/v1/connections/test-connection` 
        : `/api/v1/connections/${initialData.id}/ping`;

      const response = await fetch(url, { 
        method: 'POST',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        // Note: If NOT isNew, you might still need to send the body 
        // if your backend requires the URL for existing ID pings.
        body: isNew ? JSON.stringify({ url: EndpointURL, headers: headers }) : null
      });

      // Handle Auth Errors
      if (response.status === 401 || response.status === 403) {
        setPingState('error'); // Set to error, not success
        toast.error("Security Barrier", { 
          description: "Clearance required for network diagnostics." 
        });
        return 'unauthorized';
      }

      if (!response.ok) {
          setPingState('error');
          return 'error';
      }

      const data = await response.json();
      
      // FIX: Match 'online' to 'success'
      const isOnline = data.status === 'online' || data.status === 'success';
      const finalStatus = isOnline ? 'success' : 'error';
      
      setPingState(finalStatus);
      
      // Optional: Reset to idle after 3 seconds so the icon doesn't stay green forever
      if (isOnline) {
          setTimeout(() => setPingState('idle'), 3000);
      }

      return data.status; 
      
    } catch (err) {
      console.error("Ping Error:", err);
      setPingState('error');
      return 'error';
    }
  };

  // 2. Updated handleSave
  const handleSave = async () => {
    const isKeyRequired = useLLM && Number(quota) === 0 && (!customKey || customKey.trim() === "");
    
    // Validation
    if (!name || !EndpointURL) {
      toast.error("Protocol Error", { description: "Missing required identifier or URL." });
      return;
    }

    if (isKeyRequired) {
      toast.error("Auth Required", { description: "LLM module requires a valid API Key." });
      setIsAdvancedOpen(true);
      setShowCustomKey(true);
      return;
    }

    setIsSaving(true);

    // --- AUTOMATIC PING ON SAVE ---
    if (enabledState) {
      toast.loading("Running validation sequence...", { id: "ping-check" });
      const currentStatus = await handlePing(); 
      toast.dismiss("ping-check");

      if (currentStatus !== 'online') {
        toast.error("Validation Failed", {
          description: "Endpoint is unreachable. Resolve host issues before enabling.",
        });
        setIsSaving(false);
        return;
      }
    }

    let finalStatus = 'offline';
    if (enabledState) {
      finalStatus = 'online';
    }
    // --- PREPARE PAYLOAD ---
    let parsedHeaders = {};
    try {
      if (headers.trim()) parsedHeaders = JSON.parse(headers);
    } catch (e) {
      toast.error("JSON Error", { description: "Malformed header configuration." });
      setIsSaving(false);
      return;
    }

    const payload = {
      name,
      url: EndpointURL,
      customKey,
      endpointSecret,
      useLLM,
      timeout,
      retries,
      headers: parsedHeaders,
      enabledState,
      status: finalStatus
    };

    // --- EXECUTE DB WRITE ---
    try {
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode ? `/api/v1/connections/${initialData.id}` : "/api/v1/connections";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 403) {
        toast.error("Access Revoked", { description: "Viewer role cannot modify connection registry." });
        setIsSaving(false); // Ensure we stop loading state
        return;
      }

      if (!response.ok) throw new Error("Registry rejected configuration update.");

      const savedData = await response.json(); // Get the actual saved item from DB

      if(savedData) {toast.success("Protocol Updated", { description: `${name} has been synced to cloud.` });}
      
      //Refresh the list from the server
      if (fetchEndpoints) await fetchEndpoints(); 

      //force a local UI refresh
      setTimeout(() => {
        onSuccess?.(); 
      }, 1000);

    } catch (error) {
      console.error("Save failure:", error);
      toast.error("System Error", { description: "Could not persist changes to DynamoDB." });
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Toggle Logic
  useEffect(() => {
    if (pingState === 'testing') {
      setEnabled(false) 
    } else if (pingState === 'success') {
      setEnabled(true)
    }
  }, [pingState])

  return (
    <div className="max-h-[80vh] overflow-y-auto custom-scrollbar p-6 space-y-6">
      {/* ENDPOINT NAME */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-zinc-200 text-xs font-medium uppercase tracking-wider">Endpoint Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My API Endpoint" className="bg-zinc-900 border-zinc-800" />
      </div>

      {/* BASIC SETTINGS SECTION */}
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="url" className="text-zinc-200 text-xs font-medium uppercase tracking-wider">Endpoint URL</Label>
          <Input id="url" value={EndpointURL} onChange={(e) => setEndpointURL(e.target.value)} placeholder="https://api.example.com" className="bg-zinc-900 border-zinc-800" />
        </div>

        {/* LLM TOGGLE - MOVED TO MAIN FLOW */}
        <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
          quota === 0 && !customKey && useLLM ? 'bg-red-500/5 border-red-500/20' : 'bg-zinc-900 border-zinc-800'
        }`}>
          <div className="flex gap-3">
            <SparklesIcon className={`size-5 ${useLLM ? 'text-primary' : 'text-zinc-600'}`} />
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">LLM Intelligence</Label>
              <p className="text-[10px] text-zinc-500 uppercase tracking-tight font-mono">
                {customKey ? "Unlimited" : `Quota: ${quota}/50`}
              </p>
            </div>
          </div>
          <Switch 
            checked={!!customKey || useLLM} 
              onCheckedChange={(val: boolean) => setUseLLM(val)} 
            disabled={!!customKey} 
          />
        </div>
      </div>

      {/* CONNECTION TOGGLE */}
      <div className="flex items-center justify-between p-4 rounded-xl border transition-all bg-zinc-900 border-zinc-800">
        <div className="flex gap-3">
          <PlugZapIcon className={`size-6 ${enabledState ? 'text-primary' : 'text-zinc-600'}`} />
          <div className="space-y-0.5">
            <Label className="text-sm font-medium text-white">Connection State</Label>
            <p className="text-xs text-zinc-500">Enable or Disable this instance</p>
          </div>
        </div>
        <Switch
          disabled={status === 'error'}
          checked={enabledState}
          onCheckedChange={setEnabled}
          className="data-[state=checked]:bg-emerald-500"
        />
      </div>

      {/* ADVANCED COLLAPSIBLE */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white px-0">
            <Settings2Icon className="size-4 mr-2" />
            Advanced & Key Management
            <ChevronDownIcon className={`size-3 ml-1 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 pt-4 border-t border-zinc-800/50 mt-2">

        {/* KEY MANAGEMENT */}
        {useLLM && (
          <div className="space-y-2">
            <Label htmlFor="key" className="text-[11px] uppercase font-bold text-zinc-500 flex items-center justify-between">
              <span>Personal API Key</span>
              {quota === 0 && !customKey && useLLM && (
                <span className="text-red-500 text-[9px] font-bold uppercase animate-pulse tracking-tighter">
                  Required
                </span>
              )}
            </Label>
            
            <div className="relative">
              <Input 
                id="key" 
                type={showCustomKey ? "text" : "password"} 
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Add your API key for unlimited access" 
                className={`bg-zinc-900 h-9 text-xs focus:ring-primary transition-all duration-300 ${
                  isKeyRequired
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-zinc-800 focus:ring-primary'
                }`} 
              />
              <button
                type="button"
                onClick={() => setShowCustomKey(!showCustomKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showCustomKey ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
              </button>
            </div>
          </div>
        )}
        {/* SECRET SETTINGS */}
        <div className="space-y-2">
          <Label htmlFor="secret" className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
            Endpoint Secret
          </Label>
          <div className="relative">
            <Input 
              id="secret" 
              type={showSecret ? "text" : "password"}
              value={endpointSecret}
              onChange={(e) => setEndpointSecret(e.target.value)}
              placeholder="Your Endpoints Secret" 
              className="bg-zinc-900 border-zinc-800 h-9 text-xs focus:ring-primary pr-10" 
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showSecret ? (
                <EyeIcon className="size-4" />
              ) : (
                <EyeOffIcon className="size-4" />
              )}
            </button>
          </div>
        </div>

        {/* NETWORK TUNING */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="timeout" className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Timeout (ms)</Label>
            <Input 
              id="timeout" 
              type="number"
              value={timeout}
              onChange={(e) => setTimeoutVal(Number(e.target.value))}
              placeholder="Default: 30000" 
              className="bg-zinc-900 border-zinc-800 h-9 text-xs" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retries" className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Retries</Label>
            <Input 
              id="retries" 
              type="number"
              value={retries}
              onChange={(e) => setRetries(Number(e.target.value))}
              placeholder="Default: 3" 
              className="bg-zinc-900 border-zinc-800 h-9 text-xs" 
            />
          </div>
        </div>

        {/* CUSTOM HEADERS */}
        <div className="space-y-2">
          <Label htmlFor="headers" className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Custom Headers (JSON)</Label>
          <textarea 
            id="headers"
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            placeholder='{ "X-Environment": "production" }'
            className="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 ring-offset-background placeholder:text-zinc-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </CollapsibleContent>
      </Collapsible>

      {/* MODAL ACTIONS */}
      <div className="flex items-center gap-3 pt-6 border-t border-zinc-800">
        <Button onClick={handleSave} disabled={isSaving || !name || !EndpointURL}>
          {isSaving ? (
            <Loader2Icon className="size-4 animate-spin mr-2" />
          ) : null}
          {isEditMode ? "Save Changes" : "Add Connection"}
        </Button>
        
        {/* REFINED SPLIT TEST BUTTON */}
        <Button
        type="button"
        onClick={handlePing}
        disabled={pingState === 'testing' || !EndpointURL}
        className={`
          flex items-center p-0 h-10 rounded-md border transition-all group overflow-hidden
          ${pingState === 'success' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900'}
          ${pingState === 'error' ? 'border-red-500/50 bg-red-500/5' : ''}
        `}
      > 
        {/* Main Label Section */}
        <div className="flex items-center px-4 h-full border-r border-zinc-800 group-hover:bg-zinc-800/50 transition-colors">
          {pingState === 'testing' ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin text-primary" />
              <span className="text-xs font-medium uppercase tracking-wider">Analyzing...</span>
            </>
          ) : pingState === 'success' ? (
            <>
              <CheckCircle2Icon className="mr-2 h-3 w-3 text-emerald-500" />
              <span className="text-xs font-medium uppercase tracking-wider text-emerald-500">Connected</span>
            </>
          ) : (
            <>
              <ActivityIcon className="mr-2 h-3 w-3 text-zinc-400 group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium uppercase tracking-wider">Test Connection</span>
            </>
          )}
        </div>

        {/* Status Icon Section */}
        <div className="px-3 flex items-center justify-center h-full bg-zinc-950/50 min-w-[40px]">
          {pingState === 'idle' && <GlobeIcon className="size-3.5 text-zinc-500" />}
          {pingState === 'success' && <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          {pingState === 'error' && <XCircleIcon className="size-3.5 text-red-500" />}
          {pingState === 'testing' && <Loader2 className="size-3 text-zinc-500 animate-spin" />}
        </div>
      </Button>
      </div>
    </div>
  )
}