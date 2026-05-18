import React, { useState } from 'react';
import { Terminal, Cpu, Shield, Network, FileText } from 'lucide-react';

export const Docs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections = [
    { id: 'overview', title: 'System Overview', icon: <FileText className="w-4 h-4" /> },
    { id: 'network', title: 'Hybrid Network Core', icon: <Network className="w-4 h-4" /> },
    { id: 'security', title: 'Security & Auth Schema', icon: <Shield className="w-4 h-4" /> },
    { id: 'environment', title: 'Environment Config', icon: <Terminal className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 antialiased">
      {/* Header conforming to shadcn Card design tokens */}
      <div className="max-w-6xl mx-auto mb-8 border bg-card text-card-foreground p-6 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
          <span className="text-xs font-mono text-muted-foreground">ENGINEERING_MANUAL // v3.4_LIVE</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          System Documentation
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Technical specifications, topology layout, and architectural runbooks for the Sentinel monitoring cluster.
        </p>
      </div>

      {/* Main Documentation Layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* Left Sticky Navigation Sidebar */}
        <div className="space-y-1 bg-card border rounded-lg p-2 shadow-sm sticky top-6">
          <p className="text-[10px] font-mono font-bold text-muted-foreground px-3 py-2 uppercase tracking-wider">
            Architecture Nodes
          </p>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                activeSection === section.id
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {section.icon}
              <span>{section.title}</span>
            </button>
          ))}
        </div>

        {/* Right Dynamic Content Pane */}
        <div className="md:col-span-3 border bg-card rounded-lg p-6 shadow-sm min-h-[500px]">
          
          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-muted-foreground" /> System Overview
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sentinel is an infrastructure telemetry orchestrator designed to collect, parse, and stream physical machine analytics into an interactive visual cockpit. The system ensures constant uptime tracking and rapid fault identification across decentralized server environments.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="border rounded-md p-4 bg-muted/40">
                  <h3 className="text-sm font-semibold mb-1">Telemetry Gathering</h3>
                  <p className="text-xs text-muted-foreground">Uses hardware bindings via <code className="font-mono text-amber-500">psutil</code> to pipeline authentic physical core behavior data directly down the streaming sockets.</p>
                </div>
                <div className="border rounded-md p-4 bg-muted/40">
                  <h3 className="text-sm font-semibold mb-1">Fault Aggregation</h3>
                  <p className="text-xs text-muted-foreground">The Node Watcher engine monitors individual processing nodes, auto-dispatching high-pressure alert objects when standard thresholds fail.</p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: HYBRID NETWORK */}
          {activeSection === 'network' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
                <Network className="w-5 h-5 text-muted-foreground" /> Hybrid Network Core
              </h2>
              <p className="text-sm text-muted-foreground">
                To maximize systemic resources, the application decouples data dissemination using a mixed-protocol runtime architecture:
              </p>
              
              <div className="space-y-3 font-sans text-sm">
                <div className="p-3 border rounded-md bg-muted/20">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    WebSocket Stream (Broadcaster)
                  </div>
                  <p className="text-xs text-muted-foreground pl-4">
                    Establishes a persistent, stateful TCP pipe for high-frequency updates. The system initiates an instant handshake matrix via <code className="font-mono bg-muted px-1 py-0.5 rounded text-xs">get_system_metrics()</code> upon connection acceptance to eliminate interface lag.
                  </p>
                </div>

                <div className="p-3 border rounded-md bg-muted/20">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    Asynchronous REST Polling (Node Watcher)
                  </div>
                  <p className="text-xs text-muted-foreground pl-4">
                    Executes dynamic <code className="font-mono bg-muted px-1 py-0.5 rounded text-xs">fetchNodeTelemetry</code> loops every 10 seconds. This isolated polling process handles failure parameters gracefully inside specialized closures, ensuring individual server errors cannot cascade or affect primary tracking threads.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: SECURITY & AUTH */}
          {activeSection === 'security' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-muted-foreground" /> Security & Auth Schema
              </h2>
              <p className="text-sm text-muted-foreground">
                Authentication protocols interface directly with Amazon DynamoDB database schemas using non-blocking transactional checks.
              </p>
              <div className="p-4 bg-muted rounded-md border font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-muted-foreground">// Fallback Hierarchical Verification Circuit</p>
                <p className="text-foreground">1. Client submits security verification request to <code className="text-emerald-500">/auth/verify</code></p>
                <p className="text-foreground">2. Evaluate Admin database presence via <code className="text-cyan-500">ConditionExpression="attribute_exists(#tk)"</code></p>
                <p className="text-foreground">3. Catch exception - Initiate secondary global <code className="text-cyan-500">scan()</code> for Viewer allocation</p>
                <p className="text-foreground">4. Recalculate and commit current Unix Epoch timestamp to refresh item <code className="text-amber-500">ttl</code></p>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Note: All explicit calls utilizing reserved system attributes (such as token, status, or name) must be mapped to alternate key string definitions via ExpressionAttributeNames to circumvent validation exception throws.
              </p>
            </div>
          )}

          {/* SECTION 4: ENVIRONMENT CONFIG */}
          {activeSection === 'environment' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-muted-foreground" /> Environment Config
              </h2>
              <p className="text-sm text-muted-foreground">
                Ensure variables match environment allocation scopes. Local runtimes use independent isolated instances.
              </p>
              
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Backend Matrix (.env)</p>
                <pre className="bg-muted p-3 rounded-md border font-mono text-xs text-foreground overflow-x-auto">
{`AWS_REGION=ap-south-1
DYNAMO_TABLE_NAME=sentinel_auth_table
SECRET_KEY=dev_protocol_secret_key`}
                </pre>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frontend Vite Binding (.env)</p>
                <pre className="bg-muted p-3 rounded-md border font-mono text-xs text-foreground overflow-x-auto">
{`# Development example:
VITE_WS_URL=ws://localhost:8000/ws/stats
VITE_API_URL=http://localhost:8000/api/v1

# Production example:
# VITE_WS_URL=wss://your-backend.amplifyapp.com/ws/stats
# VITE_API_URL=https://your-backend.amplifyapp.com/api/v1`}
                </pre>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};