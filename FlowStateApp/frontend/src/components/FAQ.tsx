import React, { useState } from 'react';
// If you are using Lucide React icons (standard in shadcn), we can pull a clean chevron/plus icon.
import { Plus } from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'architecture' | 'database' | 'telemetry';
  question: string;
  answer: React.ReactNode;
}

export const FAQ: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const faqData: FAQItem[] = [
    {
      id: 'arch-1',
      category: 'architecture',
      question: 'What is FlowState // Sentinel?',
      answer: 'Sentinel is a high-density, full-screen Infrastructure Monitoring Console designed to provide real-time situational awareness of platform health, node metrics, database throughput, and security events.'
    },
    {
      id: 'arch-2',
      category: 'architecture',
      question: 'Why does the dashboard use both WebSockets and REST API calls?',
      answer: (
        <div className="space-y-2">
          <p>Sentinel uses a hybrid communication architecture to maximize network efficiency:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li><strong className="text-foreground font-semibold">WebSockets (VITE_WS_URL):</strong> Handles high-frequency global data streams (aggregate CPU/Memory, uptime, log ticks) via a persistent, zero-lag push pipe.</li>
            <li><strong className="text-foreground font-semibold">REST API (VITE_API_URL):</strong> Manages granular, on-demand node telemetry. Isolating node health into asynchronous REST loops ensures that a laggy or unresponsive sub-node never blocks the main WebSocket thread.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'arch-3',
      category: 'architecture',
      question: 'How do I resolve a "command not recognized" error for Uvicorn during local setup?',
      answer: (
        <div className="space-y-2">
          <p>This occurs when the system execution path cannot locate the global Uvicorn bin. Bypass the system Path environment entirely by calling the module directly through your active virtual environment instance:</p>
          <pre className="bg-muted p-3 rounded-md border font-mono text-xs text-amber-500 dark:text-amber-400 overflow-x-auto">
            python -m uvicorn main:app --reload
          </pre>
        </div>
      )
    },
    {
      id: 'db-1',
      category: 'database',
      question: 'What causes the "ValidationException: Attribute name is a reserved keyword" error during login?',
      answer: (
        <div className="space-y-2">
          <p>DynamoDB reserves specific systemic keywords, including <code className="text-destructive font-mono bg-muted px-1 py-0.5 rounded">token</code>, <code className="text-destructive font-mono bg-muted px-1 py-0.5 rounded">status</code>, and <code className="text-destructive font-mono bg-muted px-1 py-0.5 rounded">name</code>. To prevent transaction crashes, the authentication layer must utilize placeholder alias mappings:</p>
          <pre className="bg-muted p-3 rounded-md border font-mono text-xs text-foreground overflow-x-auto">
{`ExpressionAttributeNames={
    '#t': 'ttl',
    '#tk': 'token' // Maps placeholder to reserved keyword
}`}
          </pre>
        </div>
      )
    },
    {
      id: 'db-2',
      category: 'database',
      question: 'How does session expiration work within the authentication gateway?',
      answer: 'The /auth/verify endpoint leverages a dual-role verification fallback schema (Admin vs Viewer). Upon every successful credential validation handshake, the backend touches the record, automatically recalculating and advancing a new Unix Epoch Time-to-Live (TTL) integer.'
    },
    {
      id: 'tel-1',
      category: 'telemetry',
      question: 'Where does the global metrics telemetry come from?',
      answer: 'When executed locally, the FastAPI backend uses the hardware utility library "psutil" to run real-time hardware lookups. It intercepts the actual core operating system processor load, physical memory buffer allocations, and running thread performance to populate the dashboard.'
    },
    {
      id: 'tel-2',
      category: 'telemetry',
      question: 'How are the "High CPU Pressure" alerts generated in the terminal log?',
      answer: 'The frontend coordinates an asynchronous effect loop (the Node Watcher) that dispatches queries to node endpoints every 10 seconds. If a node telemetry evaluation returns a value breaking >85%, the UI intercept engine formats an explicit warning structure and appends it to the terminal state engine.'
    }
  ];

  const toggleAccordion = (id: string) => {
    setActiveId(activeId === id ? null : id);
  };

  const filteredFaqs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (typeof item.answer === 'string' && item.answer.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = activeFilter === 'ALL' || item.category === activeFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-6 antialiased">
      {/* Dynamic Header Box conforming to shadcn Card design tokens */}
      <div className="max-w-4xl mx-auto mb-8 border bg-card text-card-foreground p-6 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
          <span className="text-xs font-mono text-muted-foreground ml-2">CORE_PROTOCOLS // SENTINEL_DOCS_v1.0</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          System documentation, network architecture manuals, and database operation runbooks.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Controls Layout using shadcn Form/Input boundaries */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border bg-card rounded-lg shadow-sm">
          {/* Custom Tabs matching shadcn styling */}
          <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-md font-mono text-xs">
            {['ALL', 'ARCHITECTURE', 'DATABASE', 'TELEMETRY'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 font-medium rounded-sm transition-all ${
                  activeFilter === filter 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* shadcn Input replication */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search protocols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 h-9 bg-transparent text-sm px-3 py-1 border border-input rounded-md font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all"
            />
          </div>
        </div>

        {/* Accordion Component mimicking shadcn/ui Accordion primitives */}
        <div className="divide-y border rounded-lg bg-card shadow-sm overflow-hidden">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <div 
                key={faq.id} 
                className="border-b last:border-b-0 border-border transition-colors duration-200"
              >
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left font-medium text-sm sm:text-base hover:underline focus:outline-none group"
                >
                  <span className="flex items-center space-x-3">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-muted text-muted-foreground">
                      {faq.category.toUpperCase()}
                    </span>
                    <span className="text-foreground group-hover:text-foreground/80 transition">{faq.question}</span>
                  </span>
                  <Plus className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ml-4 shrink-0 ${
                    activeId === faq.id ? 'rotate-45 text-foreground' : ''
                  }`} />
                </button>
                
                {activeId === faq.id && (
                  <div className="p-4 pt-0 text-sm text-muted-foreground leading-relaxed">
                    <div className="mt-2 border-t pt-3 border-border/50 animate-in fade-in slide-in-from-top-1 duration-200">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground font-mono text-xs">
              NO COMPATIBLE ARCHIVE ENTRIES FOUND FOR SEARCH PARAMETERS.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};