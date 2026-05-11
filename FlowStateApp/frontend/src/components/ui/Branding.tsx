"use client"

import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion" 
import { ZapIcon } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"

const containerVariants: Variants = {
  hover: {
    transition: {
      staggerChildren: 0.05,
    }
  }
}

const letterVariants: Variants = {
  initial: { y: 0 },
  hover: { 
    y: -5,
    transition: {
      duration: 0.3,
      repeat: 1,
      repeatType: "reverse",
      ease: "easeInOut"
    }
  }
}

export function Branding() {
  const word = "FlowState"

  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Link to="/" title="Go to Dashboard" className="block outline-none">
      <motion.div 
        className="flex items-center gap-3 cursor-pointer group px-0 py-2"
        initial="initial"
        whileHover="hover"
        variants={containerVariants}
      >
        {/* ICON */}
        <motion.div 
          className="flex aspect-square size-9 min-w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          variants={{
            hover: { rotate: 15, scale: 1.1 }
          }}
        >
          <ZapIcon className="size-5 fill-current" />
        </motion.div>
        
        {/* TEXT */}
        {!isCollapsed && (
          <motion.div 
            className="flex overflow-hidden"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {word.split("").map((char, i) => (
              <motion.span
                key={i}
                variants={letterVariants}
                className="text-2xl font-bold tracking-tight text-white inline-block"
              >
                {char}
              </motion.span>
            ))}
          </motion.div>
        )}
      </motion.div>
    </Link>
  )
}