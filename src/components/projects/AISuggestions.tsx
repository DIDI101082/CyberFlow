'use client'

import { useState, useEffect } from 'react'
import { Sparkles, AlertTriangle, Info, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type Suggestion = {
  type: string; icon: string; title: string; description: string; priority: string
}

const typeStyles: Record<string, string> = {
  warning: 'border-yellow-200 bg-yellow-50',
  danger: 'border-red-200 bg-red-50',
  info: 'border-blue-200 bg-blue-50',
  success: 'border-green-200 bg-green-50',
}

const typeIcons: Record<string, React.ReactNode> = {
  warning: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
  danger: <XCircle className="w-4 h-4 text-red-600" />,
  info: <Info className="w-4 h-4 text-blue-600" />,
  success: <CheckCircle className="w-4 h-4 text-green-600" />,
}

export default function AISuggestions({ projectId }: { projectId: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [expanded, setExpanded] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/ai/suggestions?projectId=${projectId}`)
      .then((r) => r.json())
      .then((d) => setSuggestions(d.suggestions || []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return (
      <div className="border border-purple-200 bg-purple-50 rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <div className="h-4 bg-purple-200 rounded w-40" />
        </div>
      </div>
    )
  }

  if (suggestions.length === 0) return null

  return (
    <div className="border border-purple-200 bg-purple-50/50 rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-50 transition-colors">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-purple-800">Sugerencias IA</span>
          <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">{suggestions.length}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-purple-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {suggestions.map((s, i) => (
            <div key={i} className={cn('border rounded-lg p-3 flex gap-3', typeStyles[s.type] || 'border-surface-200 bg-white')}>
              <div className="mt-0.5">{typeIcons[s.type] || <Info className="w-4 h-4" />}</div>
              <div>
                <p className="text-sm font-medium text-surface-800">{s.title}</p>
                <p className="text-xs text-surface-600 mt-0.5">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
