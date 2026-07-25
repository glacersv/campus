// functions/src/index.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import Anthropic from '@anthropic-ai/sdk'

admin.initializeApp()

// ── Secret: la API key se guarda de forma segura en Firebase ──
// (se configura una sola vez por terminal, ver paso a paso del README)
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY')

interface SugerenciaRequest {
  proyectoId: string
}

interface SugerenciaOpcion {
  tipo:        'presentacion' | 'dashboard' | 'app'
  titulo:      string
  descripcion: string
  alcance:     string
  herramientas_sugeridas: string[]
}

interface SugerenciaResponse {
  opciones: SugerenciaOpcion[]
}

export const sugerirComplementoInformatica = onCall(
  { secrets: [ANTHROPIC_API_KEY], region: 'us-central1', cors: true },
  async (request): Promise<SugerenciaResponse> => {

    // ── 1. Verificar autenticación ──────────────────────────
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
    }

    // ── 2. Verificar rol: solo docentes/coordinación/admin ─
    const perfilSnap = await admin.firestore()
      .collection('perfiles').doc(request.auth.uid).get()
    const perfil = perfilSnap.data()

    if (!perfil || !['docente', 'coordinacion', 'admin'].includes(perfil.rol)) {
      throw new HttpsError('permission-denied', 'Solo docentes o coordinación pueden generar sugerencias.')
    }

    // ── 3. Obtener el proyecto ───────────────────────────────
    const { proyectoId } = request.data as SugerenciaRequest
    if (!proyectoId) {
      throw new HttpsError('invalid-argument', 'Falta el ID del proyecto.')
    }

    const proyectoSnap = await admin.firestore()
      .collection('proyectos').doc(proyectoId).get()

    if (!proyectoSnap.exists) {
      throw new HttpsError('not-found', 'Proyecto no encontrado.')
    }

    const proyecto = proyectoSnap.data()!

    if (proyecto.estado !== 'aprobado_oficial') {
      throw new HttpsError('failed-precondition',
        'Solo se pueden generar sugerencias para proyectos aprobados oficialmente.')
    }

    // ── 4. Llamar a Claude API ───────────────────────────────
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() })

    const prompt = `Eres un docente de Informática en un colegio de secundaria en El Salvador. Un grupo de estudiantes de ${proyecto.grado} ${proyecto.seccion} tiene este proyecto científico ya aprobado para la feria escolar:

TÍTULO: ${proyecto.titulo}
MATERIA BASE: ${proyecto.materia_nombre}
DESCRIPCIÓN: ${proyecto.descripcion}

El proyecto científico en sí no se va a implementar como software real. Tu tarea es sugerir un COMPLEMENTO de la clase de Informática que el grupo pueda desarrollar y que esté temáticamente conectado con su proyecto, para evaluarlo como parte integral del trabajo.

Genera exactamente 3 opciones, una de cada tipo:
1. PRESENTACIÓN: una presentación digital (PowerPoint/Google Slides) que explique o complemente el proyecto
2. DASHBOARD: un tablero/dashboard simple (puede ser en Excel, Google Sheets, o una herramienta visual) que muestre datos relacionados al tema
3. APP: una aplicación sencilla en App Inventor o Visual Basic (VB 2013) relacionada al tema

Para cada opción da: un título corto, una descripción de 2-3 líneas de qué debe construir el grupo, el alcance recomendado para ser evaluable en un periodo de clase razonable, y qué herramientas específicas usar.

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, con este formato exacto:
{
  "opciones": [
    {
      "tipo": "presentacion",
      "titulo": "...",
      "descripcion": "...",
      "alcance": "...",
      "herramientas_sugeridas": ["...", "..."]
    },
    {
      "tipo": "dashboard",
      "titulo": "...",
      "descripcion": "...",
      "alcance": "...",
      "herramientas_sugeridas": ["...", "..."]
    },
    {
      "tipo": "app",
      "titulo": "...",
      "descripcion": "...",
      "alcance": "...",
      "herramientas_sugeridas": ["...", "..."]
    }
  ]
}`

    let respuesta: SugerenciaResponse

    try {
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      })

      const textBlock = msg.content.find(b => b.type === 'text')
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('Respuesta sin contenido de texto.')
      }

      const cleaned = textBlock.text.replace(/```json|```/g, '').trim()
      respuesta = JSON.parse(cleaned) as SugerenciaResponse

      if (!respuesta.opciones || respuesta.opciones.length === 0) {
        throw new Error('Formato de respuesta inválido.')
      }
    } catch (e) {
      console.error('Error llamando a Claude API:', e)
      throw new HttpsError('internal', 'No se pudo generar la sugerencia. Intenta de nuevo.')
    }

    // ── 5. Guardar la sugerencia generada en el proyecto ────
    await admin.firestore().collection('proyectos').doc(proyectoId).update({
      sugerencias_informatica: respuesta.opciones,
      sugerencias_generadas_en: new Date().toISOString(),
      sugerencias_generadas_por: request.auth.uid,
    })

    return respuesta
  }
)

// ── Función para guardar la elección final del docente ──────
interface AsignarComplementoRequest {
  proyectoId: string
  complemento: {
    tipo:        string
    titulo:      string
    descripcion: string
    alcance:     string
    herramientas_sugeridas?: string[]
    es_personalizado: boolean   // true si el docente escribió uno propio
  }
}

export const asignarComplementoInformatica = onCall(
  { region: 'us-central1', cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
    }

    const perfilSnap = await admin.firestore()
      .collection('perfiles').doc(request.auth.uid).get()
    const perfil = perfilSnap.data()

    if (!perfil || !['docente', 'coordinacion', 'admin'].includes(perfil.rol)) {
      throw new HttpsError('permission-denied', 'No tienes permiso para esta acción.')
    }

    const { proyectoId, complemento } = request.data as AsignarComplementoRequest
    if (!proyectoId || !complemento) {
      throw new HttpsError('invalid-argument', 'Faltan datos.')
    }

    await admin.firestore().collection('proyectos').doc(proyectoId).update({
      complemento_informatica: {
        ...complemento,
        asignado_por:    request.auth.uid,
        asignado_por_nombre: perfil.nombre,
        fecha_asignacion: new Date().toISOString(),
      }
    })

    // Registrar en historial
    await admin.firestore().collection('historial').add({
      proyecto_id:    proyectoId,
      actor_id:       request.auth.uid,
      actor_nombre:   perfil.nombre,
      rol_actor:      perfil.rol,
      accion:         'asignacion_complemento_informatica',
      valor_nuevo:    { tipo: complemento.tipo, titulo: complemento.titulo },
      comentario:     complemento.es_personalizado ? 'Complemento personalizado por el docente' : 'Complemento elegido de sugerencias IA',
      fecha:          new Date().toISOString(),
    })

    return { ok: true }
  }
)
