'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const suggestedQuestions = [
  '¿Cuál es el estado general del proyecto?',
  '¿Qué tareas están vencidas o bloqueadas?',
  '¿Cuáles son los principales riesgos?',
  '¿Qué recomendaciones tenés para avanzar?',
]

export default function ChatPage() {
  const params = useParams()
  const projectId = params.id as string
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<{ name: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.from('projects').select('name').eq('id', projectId).single().then(({ data }) => setProject(data))
  }, [projectId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return

    const userMessage: Message = { role: 'user', content, timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message: content, history: messages }),
      })

      const data = await res.json()
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'No pude generar una respuesta.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error al comunicarse con el asistente.', timestamp: new Date().toISOString() },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link href={`/projects/${projectId}`} className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Bot className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-surface-900">Asistente IA</h1>
            <p className="text-xs text-surface-500">{project?.name}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-purple-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-surface-800 mb-2">Asistente del Proyecto</h2>
            <p className="text-surface-500 text-sm mb-6 max-w-md mx-auto">
              Preguntame sobre el estado del proyecto, tareas, riesgos o pedime recomendaciones.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {suggestedQuestions.map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-2 rounded-full border border-surface-200 hover:border-brand-300 hover:bg-brand-50 text-surface-600 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="p-2 bg-purple-100 rounded-lg h-fit">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
            )}
            <div className={cn(
              'max-w-[70%] rounded-xl px-4 py-3',
              msg.role === 'user' ? 'bg-brand-600 text-white' : 'bg-white border border-surface-200 text-surface-800'
            )}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="p-2 bg-brand-100 rounded-lg h-fit">
                <User className="w-4 h-4 text-brand-600" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="p-2 bg-purple-100 rounded-lg h-fit">
              <Bot className="w-4 h-4 text-purple-600" />
            </div>
            <div className="bg-white border border-surface-200 rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-surface-200 pt-4">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
          className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Preguntá sobre el proyecto..."
            className="flex-1 px-4 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}
            className="px-4 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
