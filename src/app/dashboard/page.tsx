'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/layout/Sidebar'
import { FolderKanban, CheckSquare, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import { Project, Task } from '@/types'
import Link from 'next/link'

const estadoColor: Record<string, string> = {
  planificado: 'bg-gray-500/20 text-gray-400',
  en_curso: 'bg-blue-500/20 text-blue-400',
  pausado: 'bg-yellow-500/20 text-yellow-400',
  completado: 'bg-green-500/20 text-green-400',
  cancelado: 'bg-red-500/20 text-red-400',
}

const prioridadColor: Record<string, string> = {
  baja: 'bg-gray-500/20 text-gray-400',
  media: 'bg-blue-500/20 text-blue-400',
  alta: 'bg-orange-500/20 text-orange-400',
  critica: 'bg-red-500/20 text-red-400',
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [{ data: proj }, { data: task }] = await Promise.all([
      supabase.from('projects').select('*, area:areas(*)').order('created_at', { ascending: false }).limit(5),
      supabase.from('tasks').select('*, project:projects(nombre)').eq('estado', 'en_curso').limit(5),
    ])
    setProjects(proj || [])
    setTasks(task || [])
    setLoading(false)
  }

  const stats = [
    { label: 'Proyectos activos', value: projects.filter(p => p.estado === 'en_curso').length, icon: FolderKanban, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Tareas en curso', value: tasks.length, icon: CheckSquare, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Proyectos planificados', value: projects.filter(p => p.estado === 'planificado').length, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Prioridad crítica', value: projects.filter(p => p.prioridad === 'critica').length, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ]

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">Resumen general de proyectos y tareas</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-400">{label}</p>
                  <div className={`p-2 rounded-lg ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${color}`}>{loading ? '–' : value}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Proyectos recientes */}
            <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Proyectos recientes</h2>
                <Link href="/projects" className="text-xs text-blue-400 hover:text-blue-300">Ver todos →</Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No hay proyectos aún</p>
              ) : (
                <div className="space-y-2">
                  {projects.map(p => (
                    <Link key={p.id} href={`/projects/${p.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{p.nombre}</p>
                          <p className="text-xs text-gray-500">{p.area?.nombre || 'Sin área'}</p>
                        </div>
                        <div className="flex gap-2 ml-3 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${estadoColor[p.estado]}`}>
                            {p.estado.replace('_', ' ')}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${prioridadColor[p.prioridad]}`}>
                            {p.prioridad}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Tareas en curso */}
            <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Tareas en curso</h2>
                <Link href="/tasks" className="text-xs text-blue-400 hover:text-blue-300">Ver todas →</Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No hay tareas en curso</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{t.titulo}</p>
                        <p className="text-xs text-gray-500">{(t as any).project?.nombre}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ml-3 flex-shrink-0 ${prioridadColor[t.prioridad]}`}>
                        {t.prioridad}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
