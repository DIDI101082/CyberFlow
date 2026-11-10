'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Send, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Comment = {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { full_name: string; avatar_url: string | null }
}

type Member = {
  id: string
  full_name: string
}

export default function TaskComments({ taskId, projectId }: { taskId: string; projectId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [input, setInput] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadComments()
    loadMembers()
  }, [taskId])

  async function loadComments() {
    const { data } = await supabase
      .from('task_comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
    if (data) setComments(data as unknown as Comment[])
  }

  async function loadMembers() {
    const { data } = await supabase
      .from('project_members')
      .select('user_id, profiles(id, full_name)')
      .eq('project_id', projectId)
    if (data) {
      setMembers(data.map((m: Record<string, unknown>) => {
        const profile = m.profiles as Record<string, unknown>
        return { id: profile.id as string, full_name: profile.full_name as string }
      }))
    }
  }

  async function postComment() {
    if (!input.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('task_comments').insert({
      task_id: taskId,
      user_id: user.id,
      content: input.trim(),
    })

    if (!error) {
      setInput('')
      loadComments()

      // Extract @mentions and create notifications
      const mentions = input.match(/@(\w+\s?\w*)/g)
      if (mentions) {
        for (const mention of mentions) {
          const name = mention.replace('@', '').trim()
          const member = members.find((m) => m.full_name.toLowerCase().includes(name.toLowerCase()))
          if (member && member.id !== user.id) {
            await supabase.from('notifications').insert({
              user_id: member.id,
              type: 'mention',
              title: 'Te mencionaron en un comentario',
              message: `${user.user_metadata?.full_name || 'Alguien'} te mencionó en una tarea`,
              link: `/projects/${projectId}`,
            })
          }
        }
      }
    }
  }

  function handleInput(value: string) {
    setInput(value)
    const lastAt = value.lastIndexOf('@')
    if (lastAt !== -1 && (lastAt === 0 || value[lastAt - 1] === ' ')) {
      const afterAt = value.slice(lastAt + 1)
      if (!afterAt.includes(' ') || afterAt.split(' ').length <= 2) {
        setMentionFilter(afterAt.toLowerCase())
        setShowMentions(true)
        return
      }
    }
    setShowMentions(false)
  }

  function insertMention(member: Member) {
    const lastAt = input.lastIndexOf('@')
    setInput(input.slice(0, lastAt) + `@${member.full_name} `)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  function renderContent(content: string) {
    return content.replace(/@(\w+(?:\s\w+)?)/g, '<span class="text-brand-600 font-medium">@$1</span>')
  }

  const filteredMembers = members.filter((m) => m.full_name.toLowerCase().includes(mentionFilter))

  return (
    <div className="border border-surface-200 rounded-xl bg-white">
      <div className="px-4 py-3 border-b border-surface-100 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-surface-400" />
        <span className="text-sm font-medium text-surface-700">Comentarios ({comments.length})</span>
      </div>

      <div className="max-h-64 overflow-y-auto p-4 space-y-3">
        {comments.length === 0 && (
          <p className="text-sm text-surface-400 text-center py-4">Sin comentarios aún</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-700 flex-shrink-0">
              {c.profiles?.full_name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-surface-800">{c.profiles?.full_name}</span>
                <span className="text-xs text-surface-400">
                  {new Date(c.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-surface-600 mt-0.5" dangerouslySetInnerHTML={{ __html: renderContent(c.content) }} />
            </div>
          </div>
        ))}
      </div>

      <div className="relative p-3 border-t border-surface-100">
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 bg-white border border-surface-200 rounded-lg shadow-lg py-1 mb-1 max-h-32 overflow-y-auto z-10">
            {filteredMembers.map((m) => (
              <button key={m.id} onClick={() => insertMention(m)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-surface-50 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-700">
                  {m.full_name.charAt(0)}
                </div>
                {m.full_name}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment() } }}
            placeholder="Escribí un comentario... Usá @ para mencionar"
            rows={1}
            className="flex-1 px-3 py-2 text-sm border border-surface-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button onClick={postComment} disabled={!input.trim()}
            className={cn('px-3 py-2 rounded-lg transition-colors', input.trim() ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-surface-100 text-surface-400')}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
