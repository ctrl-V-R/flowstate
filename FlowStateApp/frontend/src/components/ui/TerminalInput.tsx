"use client"

import React, { useRef, useState } from "react"
import { cn } from "@/lib/utils"

export function TerminalInput({ onComplete, onChange }: { onComplete: (val: string) => void; onChange?: (val: string) => void }) {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
  const val = e.target.value.toUpperCase();
    // Get the last character typed (allows replacing existing char)
    const char = val.slice(-1);

    if (char && !/^[A-Z0-9]$/.test(char)) return;

    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);
    onChange?.(newCode.join(""));
    
    // Focus management
    if (char && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Notify parent if complete
    const fullString = newCode.join("");
    if (fullString.length === 6) {
      onComplete(fullString);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").toUpperCase().slice(0, 6)
    if (!/^[A-Z0-9]+$/.test(paste)) return

    const newCode = [...code]
    paste.split("").forEach((char, i) => {
      if (i < 6) newCode[i] = char
    })
    setCode(newCode)
    if (paste.length === 6) onComplete(paste)
  }

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {code.map((char, index) => (
        <input
          key={index}
          ref={(el) => { inputs.current[index] = el }}
          type="text"
          // Keep maxLength={1} but let's be safe and use a value check
          value={code[index]} 
          onFocus={(e) => e.target.select()}
          // Update this line to pass 'e'
          onChange={(e) => handleChange(e, index)} 
          onKeyDown={(e) => handleKeyDown(e, index)}
          // Add this to prevent mobile browsers from being "too helpful"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            "size-12 md:size-14 text-center text-2xl font-mono font-bold transition-all duration-300",
            "border-0 border-b-2 bg-transparent text-white focus:outline-none",
            char !== "" ? "border-primary text-primary" : "border-zinc-800",
            "focus:border-primary focus:shadow-[0_4px_12px_-6px_rgba(var(--primary),0.5)]"
          )}
        />
      ))}
    </div>
  )
}