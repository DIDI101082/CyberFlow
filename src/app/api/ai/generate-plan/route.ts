import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { WizardFormData, AIPlan } from '@/lib/types'

const SYSTEM_PROMPT = `Sos un Project Manager experto en Ciberseguridad y Tecnología. Tu tarea es generar un plan de proyecto estructurado basado en la información que te dan.

Respondé SOLO con un JSON válido (sin markdown, sin backticks) con esta estructura:
{
  "objective": "objetivo principal del proyecto en una oración",
  "scope": "alcance del proyecto en 2-3 oraciones",
  "milestones": [
    {
      "name": "nombre del hito",
      "description": "descripción breve",
      "estimated_days": número de días estimados,
      "tasks": [
        {
          "title": "título de la tarea",
          "description": "descripción de qué hacer",
          "estimated_hours": número de horas estimadas,
          "priority": "low" | "medium" | "high" | "critical"
        }
      ]
    }
  ],
  "risks": [
    {
      "title": "título del riesgo",
      "description": "descripción del riesgo",
      "level": "low" | "medium" | "high",
      "mitigation": "cómo mitigarlo"
    }
  ],
  "recommendations": ["recomendación 1", "recomendación 2"]
}

Reglas:
- Generá entre 3 y 6 hitos con 2 a 5 tareas cada uno
- Las tareas deben ser accionables y específicas
- Identificá al menos 2 riesgos relevantes
- Incluí 3-5 recomendaciones prácticas
- Adaptá el plan a la categoría y duración indicada
- Usá español argentino (voseo)
- Sé concreto y práctico, no genérico`

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const form: WizardFormData = await request.json()

    // Obtener nombre del área
    let areaName = 'No especificada'
    if (form.area_id) {
      const { data: area } = await supabase.from('areas').select('name').eq('id', form.area_id).single()
      if (area) areaName = area.name
    }

    const userPrompt = `Generá un plan de proyecto con estos datos:

- Nombre: ${form.name}
- Descripción: ${form.description || 'No especificada'}
- Área: ${areaName}
- Categoría: ${form.category}
- Prioridad: ${form.priority}
- Objetivos: ${form.objectives}
- Restricciones: ${form.constraints || 'Ninguna especificada'}
- Duración estimada: ${form.estimated_duration || 'No especificada'}
- Tamaño del equipo: ${form.team_size || 'No especificado'}`

    // Llamar a OpenAI
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      // Si no hay API key, generar un plan de ejemplo
      return NextResponse.json({ plan: generateFallbackPlan(form) })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    })

    if (!response.ok) {
      console.error('OpenAI error:', await response.text())
      return NextResponse.json({ plan: generateFallbackPlan(form) })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    try {
      const plan: AIPlan = JSON.parse(content)
      return NextResponse.json({ plan })
    } catch {
      // Si falla el parse, usar fallback
      return NextResponse.json({ plan: generateFallbackPlan(form) })
    }
  } catch (error) {
    console.error('Error en generate-plan:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Plan de fallback si no hay API key o falla la API
function generateFallbackPlan(form: WizardFormData): AIPlan {
  const isSecurityProject = ['Pentesting / Hacking Ético', 'Hardening', 'Auditoría'].includes(form.category)

  if (isSecurityProject) {
    return {
      objective: `Ejecutar ${form.category.toLowerCase()} para ${form.name}`,
      scope: `${form.description || 'Proyecto de ciberseguridad'} con foco en identificación de vulnerabilidades, análisis de riesgos y generación de reporte ejecutivo.`,
      milestones: [
        {
          name: 'Planificación y Alcance',
          description: 'Definir alcance, herramientas y cronograma',
          estimated_days: 3,
          tasks: [
            { title: 'Definir alcance y objetivos detallados', description: 'Documentar qué se va a evaluar y qué queda fuera', estimated_hours: 4, priority: 'high' },
            { title: 'Preparar entorno y herramientas', description: 'Configurar herramientas necesarias y validar accesos', estimated_hours: 6, priority: 'high' },
            { title: 'Reunión de kick-off con stakeholders', description: 'Alinear expectativas y validar ventana de ejecución', estimated_hours: 2, priority: 'medium' },
          ],
        },
        {
          name: 'Ejecución',
          description: 'Ejecutar las pruebas y recopilar hallazgos',
          estimated_days: 10,
          tasks: [
            { title: 'Reconocimiento y enumeración', description: 'Recopilar información del objetivo', estimated_hours: 8, priority: 'high' },
            { title: 'Análisis de vulnerabilidades', description: 'Identificar vulnerabilidades usando herramientas automatizadas y manuales', estimated_hours: 16, priority: 'critical' },
            { title: 'Explotación controlada', description: 'Validar vulnerabilidades identificadas de forma controlada', estimated_hours: 12, priority: 'high' },
            { title: 'Documentar hallazgos', description: 'Registrar cada hallazgo con evidencia y clasificación de riesgo', estimated_hours: 8, priority: 'high' },
          ],
        },
        {
          name: 'Reporte y Cierre',
          description: 'Generar reporte y presentar resultados',
          estimated_days: 5,
          tasks: [
            { title: 'Elaborar reporte técnico', description: 'Documentar hallazgos, evidencias y recomendaciones técnicas', estimated_hours: 8, priority: 'high' },
            { title: 'Elaborar reporte ejecutivo', description: 'Resumen ejecutivo para management con métricas clave', estimated_hours: 4, priority: 'high' },
            { title: 'Presentación de resultados', description: 'Presentar hallazgos y recomendaciones al equipo', estimated_hours: 2, priority: 'medium' },
            { title: 'Plan de remediación', description: 'Definir prioridades y plazos para remediar hallazgos', estimated_hours: 4, priority: 'high' },
          ],
        },
      ],
      risks: [
        { title: 'Impacto en producción', description: 'Las pruebas podrían afectar la disponibilidad de los sistemas', level: 'high', mitigation: 'Ejecutar en horario no productivo y tener plan de rollback' },
        { title: 'Alcance insuficiente', description: 'No cubrir todos los vectores de ataque relevantes', level: 'medium', mitigation: 'Usar un checklist basado en OWASP/NIST y validar el alcance con el equipo' },
        { title: 'Dependencia de accesos', description: 'Demoras en obtener accesos o credenciales necesarias', level: 'medium', mitigation: 'Solicitar accesos con anticipación y tener un contacto de escalación' },
      ],
      recommendations: [
        'Definir una ventana de ejecución clara y comunicarla a todos los involucrados',
        'Mantener un canal de comunicación directo con el equipo de infraestructura',
        'Documentar todo hallazgo en tiempo real para no perder evidencia',
        'Priorizar la remediación por nivel de riesgo (crítico primero)',
        'Programar un re-test para validar las remediaciones',
      ],
    }
  }

  // Plan genérico para otros tipos de proyecto
  return {
    objective: `Completar exitosamente ${form.name}`,
    scope: form.description || `Proyecto de ${form.category} con los objetivos definidos por el equipo.`,
    milestones: [
      {
        name: 'Inicio y Planificación',
        description: 'Definir alcance, recursos y cronograma detallado',
        estimated_days: 5,
        tasks: [
          { title: 'Definir alcance y entregables', description: 'Documentar qué incluye y qué no', estimated_hours: 4, priority: 'high' },
          { title: 'Asignar recursos y responsables', description: 'Definir quién hace qué', estimated_hours: 3, priority: 'high' },
          { title: 'Crear cronograma detallado', description: 'Definir fechas y dependencias', estimated_hours: 4, priority: 'medium' },
        ],
      },
      {
        name: 'Ejecución',
        description: 'Llevar a cabo las actividades principales del proyecto',
        estimated_days: 15,
        tasks: [
          { title: 'Preparar entorno de trabajo', description: 'Configurar herramientas y accesos necesarios', estimated_hours: 6, priority: 'high' },
          { title: 'Ejecutar actividades principales', description: 'Realizar el trabajo core del proyecto', estimated_hours: 40, priority: 'critical' },
          { title: 'Seguimiento semanal de avance', description: 'Reunión de status y actualización de tareas', estimated_hours: 4, priority: 'medium' },
        ],
      },
      {
        name: 'Cierre y Entrega',
        description: 'Validar entregables y cerrar el proyecto formalmente',
        estimated_days: 5,
        tasks: [
          { title: 'Validar entregables', description: 'Verificar que todo cumple con los criterios definidos', estimated_hours: 6, priority: 'high' },
          { title: 'Documentar lecciones aprendidas', description: 'Registrar qué salió bien y qué mejorar', estimated_hours: 3, priority: 'medium' },
          { title: 'Cierre formal del proyecto', description: 'Comunicar finalización y archivar documentación', estimated_hours: 2, priority: 'medium' },
        ],
      },
    ],
    risks: [
      { title: 'Cambios de alcance', description: 'El alcance podría crecer durante la ejecución', level: 'medium', mitigation: 'Documentar el alcance inicial y gestionar cambios formalmente' },
      { title: 'Disponibilidad del equipo', description: 'El equipo podría tener otras prioridades que compitan', level: 'medium', mitigation: 'Acordar dedicación desde el inicio y escalar temprano si hay conflictos' },
    ],
    recommendations: [
      'Hacer una reunión de kick-off para alinear a todo el equipo',
      'Revisar el avance semanalmente y ajustar el plan si es necesario',
      'Mantener la documentación actualizada durante todo el proyecto',
      'Escalar bloqueos rápidamente para evitar demoras',
    ],
  }
}
