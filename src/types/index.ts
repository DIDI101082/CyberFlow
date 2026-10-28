export type Rol = 'admin' | 'area_lead' | 'member'
export type EstadoProyecto = 'planificado' | 'en_curso' | 'pausado' | 'completado' | 'cancelado'
export type EstadoTarea = 'pendiente' | 'en_curso' | 'bloqueada' | 'completada'
export type Prioridad = 'baja' | 'media' | 'alta' | 'critica'

export interface Area {
  id: string
  nombre: string
  descripcion?: string
  color: string
  created_at: string
}

export interface User {
  id: string
  entra_id: string
  nombre: string
  email: string
  area_id?: string
  area?: Area
  rol: Rol
  avatar_url?: string
  activo: boolean
  created_at: string
}

export interface Tag {
  id: string
  nombre: string
  color: string
}

export interface Project {
  id: string
  nombre: string
  descripcion?: string
  area_id?: string
  area?: Area
  estado: EstadoProyecto
  prioridad: Prioridad
  fecha_inicio?: string
  fecha_fin_estimada?: string
  fecha_fin_real?: string
  creado_por?: string
  es_transversal: boolean
  tags?: Tag[]
  members?: User[]
  tasks?: Task[]
  _count?: { tasks: number; completadas: number }
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  project?: Project
  titulo: string
  descripcion?: string
  estado: EstadoTarea
  prioridad: Prioridad
  asignado_a?: string
  asignado?: User
  fecha_vencimiento?: string
  orden: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Attachment {
  id: string
  project_id: string
  task_id?: string
  nombre: string
  url: string
  tipo?: string
  tamanio?: number
  subido_por?: string
  created_at: string
}
