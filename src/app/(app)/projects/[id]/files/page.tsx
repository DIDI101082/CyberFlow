'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, File, Trash2, Download, FileText, Image, Archive, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ProjectFile = {
  id: string
  name: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by: string
  created_at: string
  uploader?: { full_name: string }
}

const fileIcons: Record<string, typeof File> = {
  'image': Image,
  'application/pdf': FileText,
  'application/zip': Archive,
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image
  return fileIcons[mimeType] || FileText
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function FilesPage() {
  const params = useParams()
  const projectId = params.id as string
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [project, setProject] = useState<{ name: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [projectId])

  async function loadData() {
    const [{ data: proj }, { data: filesData }] = await Promise.all([
      supabase.from('projects').select('name').eq('id', projectId).single(),
      supabase.from('project_files')
        .select('*, uploader:profiles!project_files_uploaded_by_fkey(full_name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),
    ])
    setProject(proj)
    setFiles(filesData || [])
    setLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const filePath = `${projectId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      await supabase.from('project_files').insert({
        project_id: projectId,
        name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
      })

      await loadData()
    } catch (err: any) {
      setError(err.message || 'Error al subir archivo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(fileRecord: ProjectFile) {
    if (!confirm(`¿Eliminar ${fileRecord.name}?`)) return

    await supabase.storage.from('project-files').remove([fileRecord.file_path])
    await supabase.from('project_files').delete().eq('id', fileRecord.id)
    setFiles((prev) => prev.filter((f) => f.id !== fileRecord.id))
  }

  async function handleDownload(fileRecord: ProjectFile) {
    const { data } = await supabase.storage.from('project-files').download(fileRecord.file_path)
    if (data) {
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileRecord.name
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/projects/${projectId}`} className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-surface-900">Archivos</h1>
          <p className="text-surface-500">{project?.name}</p>
        </div>
        <label className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors',
          'bg-brand-600 text-white hover:bg-brand-700',
          uploading && 'opacity-50 cursor-not-allowed'
        )}>
          <Upload className="w-4 h-4" />
          {uploading ? 'Subiendo...' : 'Subir Archivo'}
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {files.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-surface-200">
          <File className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-500">No hay archivos en este proyecto</p>
          <p className="text-surface-400 text-sm mt-1">Subí archivos para compartirlos con el equipo</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 divide-y divide-surface-100">
          {files.map((file) => {
            const Icon = getFileIcon(file.mime_type)
            return (
              <div key={file.id} className="flex items-center gap-4 p-4 hover:bg-surface-50 transition-colors">
                <div className="p-2 bg-surface-100 rounded-lg">
                  <Icon className="w-5 h-5 text-surface-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-800 truncate">{file.name}</p>
                  <p className="text-xs text-surface-400">
                    {formatFileSize(file.file_size)} · {file.uploader?.full_name || 'Usuario'} · {new Date(file.created_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDownload(file)}
                    className="p-2 hover:bg-surface-100 rounded-lg transition-colors text-surface-500 hover:text-brand-600">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(file)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-surface-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
