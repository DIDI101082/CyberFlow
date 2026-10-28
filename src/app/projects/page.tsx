'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/layout/Sidebar'
import { FolderKanban, Plus, Search, Filter } from 'lucide-react'
import { Project } from '@/types'
import Link from 'next/link'

const estadoColor: Record<string, string> = {
  planificado: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  en_curso: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  pausado: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  completado: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelado: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const prioridadColor: Record<string, string> = {
  baja: 'bg-gray-500/20 text-gray-400',
  media: 'bg-blue-500/20 text-blue-400',
  alta: 'bg-orange-500/20 text-orange-400',
  critica: 'bg-red-500/20 text-red-400',
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*, area:areas(*), tags:project_tags(tag:tags(*))')
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  const filtered = projects.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase())
    const matchEstado = filtroEstado ? p.estado === filtroEstado : true
    return matchSearch && matchEstado
  })

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-6 h-6 text-blue-400" />
                Proyectos
              </h1>
              <p className="text-gray-400 text-sm mt-1">{projects.length} proyectos en total</p>
            </div>
            <Link
              href="/projects/new"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo proyecto
            </Link>
          </div>

          {/* Filtros */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar proyectos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#1a1f2e] border border-[#2d3748] text-white placeholder-gray-500 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="bg-[#1a1f2e] border border-[#2d3748] text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="planificado">Planificado</option>
              <option value="en_curso">En curso</option>
              <option value="pausado">Pausado</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-[#1a1f2e] border border-[#2d3748] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <FolderKanban className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No se encontraron proyectos</p>
              <Link href="/projects/new" className="text-blue-400 text-sm hover:text-blue-300 mt-2 inline-block">
                Crear el primero →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(p => (
                <Link key={p.id} href={`/projects/${p.id}`}>
                  <div className="bg-[#1a1f2e] border border-[#2d3748] hover:border-blue-500/50 rounded-xl p-4 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-white">{p.nombre}</h3>
                          {p.es_transversal && (
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30">
                              Transversal
                            </span>
                          )}
                        </div>
                        {p.descripcion && (
                          <p className="text-sm text-gray-400 truncate">{p.descripcion}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          {p.area && (
                            <span className="flex items-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: p.area.color }}
                              />
                              {p.area.nombre}
                            </span>
                          )}
                          {p.fecha_fin_estimada && (
                            <span>Vence: {new Date(p.fecha_fin_estimada).toLocaleDateString('es-AR')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full border ${estadoColor[p.estado]}`}>
                          {p.estado.replace('_', ' ')}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${prioridadColor[p.prioridad]}`}>
                          {p.prioridad}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
