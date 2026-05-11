"use client"

import { useEffect, useState } from "react"
import { 
  PlusIcon, 
  HardDriveIcon, 
  ActivityIcon,
  Trash2Icon,
  SearchIcon,
  Settings2Icon,
  Loader2Icon
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DeleteDialog } from "./DeleteDialog"
import { toast } from "sonner"
import { GlobalSyncFAB } from "@/components/ui/GlobalSyncFAB"
import { ConnectionsView } from "./ConnectionsView"
import type { Endpoint } from "@/types"

export default function EndpointsPage() { 
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeEndpoint, setActiveEndpoint] = useState<Endpoint | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [isPingingAll, setIsPingingAll] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const token = localStorage.getItem("fs_access_token");

  const handlePingAll = async () => {
  setIsPingingAll(true);
  setLastSyncStatus('idle');
  
  try {
    // 1. Pointing to the global broadcast route we created in main.py
    const response = await fetch("/api/v1/connections/ping-all", { 
      method: 'POST',
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (response.status === 403) {
      toast.error("Access Denied", { description: "Broadcast signal requires Admin level clearance." });
      setLastSyncStatus('error');
      return;
    }

    if (response.ok) {
      setLastSyncStatus('success');
      toast.success("Global Sync Complete", { description: "All active cache nodes refreshed." });
      fetchEndpoints();
      setTimeout(() => setLastSyncStatus('idle'), 5000);
    } else {
      setLastSyncStatus('error');
    }
  } catch (error) {
    console.error("Broadcast failed:", error);
    setLastSyncStatus('error');
  } finally {
    setIsPingingAll(false);
  }
};

// --- Secure Fetch Sequence ---
const fetchEndpoints = async () => {
  setIsLoading(true);
  try {
    const response = await fetch("/api/v1/connections", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("Failed to authenticate session");

    const rawData = await response.json();
    setEndpoints(rawData);

  } catch (error) {
    console.error("Registry fetch failed:", error);
    toast.error("Connection Lost", { description: "Could not retrieve endpoint registry." });
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  if (token) fetchEndpoints();
}, [token]);

// --- Registry Purge Sequence ---
const handleDelete = async (id: string) => {
  setDeletingId(id);
  
  try {
    const response = await fetch(`/api/v1/connections/${id}`, {
      method: 'DELETE',
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.status === 403) {
      toast.error("Unauthorized", { description: "Viewers cannot de-provision system nodes." });
      setIsDeleteAlertOpen(false);
      return;
    }

    if (!response.ok) throw new Error("Backend rejected deletion request");

    toast.success("Node Purged", { description: "Connection removed from DynamoDB registry." });
    setIsDeleteAlertOpen(false);
    fetchEndpoints(); // Refresh list immediately

  } catch (error) {
    console.error("Purge failed:", error);
    toast.error("Operation Failed", { description: "Check backend logs for resource constraints." });
  } finally {
    setDeletingId(null);
  }
};

// --- Live Filtering ---
const filteredEndpoints = endpoints.filter(ep => 
  ep.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
  ep.url.toLowerCase().includes(searchQuery.toLowerCase())
);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">Endpoints</h1>
          <p className="text-zinc-500 text-sm">Manage and monitor your FlowState backend instances.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600" />
            <Input 
              placeholder="Search connections..." 
              className="bg-zinc-900/50 border-zinc-800 pl-9 h-10 text-xs focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 gap-2 shadow-lg shadow-primary/10">
              <PlusIcon className="size-4" />
                Connect New
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden bg-zinc-950 border-zinc-800">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle className="text-lg">Add New Connection</DialogTitle>
                <DialogDescription>
                  Enter your backend credentials to link a new instance to your dashboard.
                </DialogDescription>
              </DialogHeader>
              <ConnectionsView onSuccess={() => {
              setIsModalOpen(false)
              fetchEndpoints()
            }} fetchEndpoints={fetchEndpoints} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <hr className="border-zinc-800/50" />

      {/* CONTENT AREA */}
      { 
      isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2Icon className="animate-spin text-zinc-700 size-8" />
        </div>
      ) : 
      /* EMPTY STATE */
      filteredEndpoints.length === 0  ? (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-zinc-800/50 rounded-[2rem] bg-zinc-900/10">
          <div className="size-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-inner">
            <HardDriveIcon className="size-8 text-zinc-700" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-300">No active connections</h2>
          <p className="text-zinc-500 text-sm mt-2 mb-8 text-center max-w-sm">
            You haven't configured any backend instances yet. Add one to start analyzing your data streams.
          </p>
          <Button variant="outline" className="border-zinc-800 hover:bg-zinc-800" onClick={() => setIsModalOpen(true)}>
            Get Started
          </Button>
        </div>
      ) : (
        /* LIST STATE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEndpoints.map((ep) => (
            <div 
              key={ep.id}
              onClick={() => {
                      setActiveEndpoint(ep);
                      setIsEditModalOpen(true);
                    }}
              className="group relative p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-primary/30 hover:bg-zinc-900/60 transition-all duration-300 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg bg-zinc-950 border border-zinc-800 ${ep.status === 'online' ? 'text-green-500 '  : ep.status === 'offline' ? 'text-yellow-500' : 'text-red-500 animate-pulse'}`}>
                  <ActivityIcon className="size-5" />
                </div>
                <div className="flex items-center gap-1">
                  {/* EDIT BUTTON */}
                  <Button 
                    variant="ghost"
                    size="icon" 
                    className="size-8 text-zinc-500 hover:text-white"
                    onClick={() => {
                      setActiveEndpoint(ep);
                      setIsEditModalOpen(true);
                    }}
                  >
                    {/* Using a Pencil/Edit icon or ExternalLink as you had it */}
                    <Settings2Icon className="size-4" /> 
                  </Button>
                  
                  {/* DELETE TRIGGER */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 text-zinc-500 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveEndpoint(ep);
                      setIsDeleteAlertOpen(true);
                    }}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-white group-hover:text-primary transition-colors">{ep.name}</h3>
                <p className="text-[10px] text-zinc-500 font-mono truncate">{ep.url}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`size-1.5 rounded-full ${ep.status === 'online' ? 'bg-green-500' : ep.status === 'offline' ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">{ep.status}</span>
                </div>
                <span className="text-[10px] text-zinc-600 italic">Updated {ep.lastSync}</span>
              </div>
            </div>
          ))}
          <GlobalSyncFAB 
            connectionCount={endpoints.length}
            isPingingAll={isPingingAll}
            onPingAll={handlePingAll}
            lastSyncStatus={lastSyncStatus}
          />  
        </div>
      )
    } 
    { /* EDIT MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden bg-zinc-950 border-zinc-800">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Edit Connection</DialogTitle>
            <DialogDescription>Modify the credentials for {activeEndpoint?.name}.</DialogDescription>
          </DialogHeader>
          <ConnectionsView 
            initialData={activeEndpoint} 
            onSuccess={() => setIsEditModalOpen(false)}
            fetchEndpoints={fetchEndpoints}
          />
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <DeleteDialog
        open={isDeleteAlertOpen} 
        onOpenChange={(open) => {
          setIsDeleteAlertOpen(open);
          if (!open) setActiveEndpoint(null); // Clear state when closing delete
        }}
        endpointName={activeEndpoint?.name || "this instance"}
        isLoading={deletingId === activeEndpoint?.id} 
        onConfirm={() => {
          if (activeEndpoint) {
            handleDelete(activeEndpoint.id);
            // Close and clear
            setIsDeleteAlertOpen(false);
            setActiveEndpoint(null);
          }
        }}
      />
    </div>
  )
}