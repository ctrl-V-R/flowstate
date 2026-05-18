import React, { useRef, useState } from 'react';
import { 
  MessageSquare, 
  Book, 
  GitBranch,
  LifeBuoy, 
  Send,
  ShieldCheck,
  Loader2
} from 'lucide-react';

import emailjs from '@emailjs/browser';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export default function SupportPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate()

  const handleLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    setIsSending(true);

    try {
      await emailjs.sendForm(
        EMAILJS_SERVICE_ID, 
        EMAILJS_TEMPLATE_ID, 
        formRef.current, 
        EMAILJS_PUBLIC_KEY
      );
      setSubmitted(true);
      toast.success("Support ticket sent successfully!", {
        description: "We'll get back to you as soon as possible."
      });
    } catch (error) {
      console.error('FAILED...', error);
      toast.error("Failed to send ticket", {
        description: "Please try again or contact us via GitHub."
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-white tracking-tight">Support Center</h1>
        <p className="text-zinc-500 mt-2">Get help with your FlowState clusters and orchestrator configurations.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Resource Cards */}
        <div className="space-y-4">
          <ResourceCard 
            title="Documentation" 
            desc="Explore the FlowState API spec and routing guides."
            icon={<Book className="text-blue-400" />}
            onClick={() => navigate("/documentation")}
          />
          <ResourceCard 
            title="Fork or Suggest" 
            desc="Report a bug or request a feature for the core."
            icon={<GitBranch className="text-green-400" />}
            onClick={() => handleLink("https://github.com/ctrl-v-r/FlowState")}
          />
          <ResourceCard 
            title="Community Discord" 
            desc="Real-time troubleshooting with other engineers."
            icon={<MessageSquare className="text-yellow-400" />}
            onClick={() => navigate("#")}
          />
        </div>

        {/* Second left Column: Support Info */}
        <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-3 mb-2 text-primary font-semibold text-2xl">
              <ShieldCheck className="size-10" />
              Enterprise Support
            </div>
            <p className="text-2xl text-zinc-400 leading-relaxed mt-5">
              <span className='text-zinc-200'>Standard response time is 24-48 hours.</span>
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed mt-25">
               For <span className="text-destructive">Critical support</span>, if this time-frame is not met then expect an email with details on any developments.
            </p>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-2">
          <div className="p-8 rounded-[2.5rem] bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-sm">
            {!submitted ? (
              <form ref={formRef} onSubmit={sendEmail} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-zinc-500 uppercase">Category</label>
                    <select 
                      name="category"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-300"
                    >
                      <option value="Orchestrator Failure">Orchestrator Failure</option>
                      <option value="Endpoint Sync">Endpoint Sync</option>
                      <option value="Performance Issue">Performance Issue</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-zinc-500 uppercase">Priority</label>
                    <select 
                      name="priority"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-300"
                    >
                      <option value="P3">Low</option>
                      <option value="P2">Normal</option>
                      <option value="P1">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-500 uppercase">email</label>
                  <textarea 
                    name="email"
                    rows={1}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-zinc-300"
                    placeholder="Your Email ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-500 uppercase">Message</label>
                  <textarea 
                    name="message"
                    rows={5}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-zinc-300"
                    placeholder="What's happening in the cluster?"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSending}
                  className="w-full bg-primary hover:bg-primary/90 text-zinc-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="size-4" />
                      Submit Ticket
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                <div className="size-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                  <LifeBuoy className="size-8 text-emerald-500 animate-spin-slow" />
                </div>
                <h2 className="text-xl font-bold text-white">Ticket Created</h2>
                <p className="text-zinc-500 max-w-xs">
                  We've received your request. An engineer will be in touch via your registered dashboard email.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
                >
                  Open another request
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceCard({ 
  title, 
  desc, 
  icon, 
  onClick 
}: { 
  title: string, 
  desc: string, 
  icon: React.ReactNode, 
  onClick: () => void // Add this
}) {
  return (
    <button 
      onClick={onClick}
      type="button" // Good practice for buttons in forms
      className="w-full text-left block group"
    >
      <div className="p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-primary/40 hover:bg-zinc-800/40 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 group-hover:border-primary/20 transition-colors">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
          </div>
        </div>
      </div>
    </button>
  );
}