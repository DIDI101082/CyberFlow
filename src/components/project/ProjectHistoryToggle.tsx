'use client'

import { useState } from 'react'
import { Archive, ChevronDown, ChevronRight } from 'lucide-react'

interface ProjectHistoryToggleProps {
  count: number
  children: React.ReactNode
}

export default function ProjectHistoryToggle({ count, children }: ProjectHistoryToggleProps) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 mb-4 text-surface-600 hover:text-surface-800 transition-colors group w-full"
      >
        <Archive className="w-5 h-5 text-surface-400 group-hover:text-surface-600" />
        <h2 className="text-lg font-semibold">
          Historial ({count})
        </h2>
        {open ? (
          <ChevronDown className="w-4 h-4 ml-1" />
        ) : (
          <ChevronRight className="w-4 h-4 ml-1" />
        )}
      </button>
      {open && (
        <div className="opacity-75 hover:opacity-100 transition-opacity">
          {children}
        </div>
      )}
    </div>
  )
}
