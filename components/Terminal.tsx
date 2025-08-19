"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import type { LogEntry } from "../types"

interface TerminalProps {
  logs: LogEntry[]
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const terminalEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  return (
    <div className="bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm border border-gray-700">
      {logs.map((log, index) => (
        <div key={index} className="flex">
          <span className="text-gray-500 mr-2">[{log.timestamp}]</span>
          <p className={`${log.color} whitespace-pre-wrap break-words flex-1`}>{log.message}</p>
        </div>
      ))}
      <div ref={terminalEndRef} />
    </div>
  )
}

export default Terminal
