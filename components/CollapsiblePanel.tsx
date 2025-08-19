"use client"

import type React from "react"
import { useState } from "react"
import Icon from "./Icon"

interface CollapsiblePanelProps {
  title: React.ReactNode
  children: React.ReactNode
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left focus:outline-none hover:bg-gray-700/50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex-grow text-lg font-semibold">{title}</div>
        <Icon
          path="M19.5 8.25l-7.5 7.5-7.5-7.5"
          className={`w-5 h-5 transition-transform duration-300 flex-shrink-0 ml-4 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-[500px]" : "max-h-0"}`}
      >
        <div className="p-4 pt-0">{children}</div>
      </div>
    </div>
  )
}

export default CollapsiblePanel
