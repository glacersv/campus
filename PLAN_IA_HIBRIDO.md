# Plan Híbrido de IA — Campus Salesiano San José

> **Fecha:** 25 julio 2026
> **Estado:** Propuesta / En discusión
> **Modelos:** DeepSeek R1 7B | Qwen 2.5 Coder 7B | Gemini 2.0 Flash

---

## 1. Arquitectura Híbrida

### 1.1 Filosofía
- **Modelos Locales (Ollama):** Rápidos, sin costo, offline, ideales para interacciones diarias
- **Gemini (Cloud):** Más potente, para tareas complejas que requieren razonamiento avanzado
- **Selección automática:** El sistema elige el modelo según la tarea y complejidad

### 1.2 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIO (App Colegio)                │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              ROUTER DE IA (智能路由)                     │
│  Analiza: complejidad + tipo de tarea + disponibilidad  │
└──────────────────────────┬──────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  DeepSeek   │ │    Qwen     │ │   Gemini    │
    │  R1 7B      │ │  2.5 Coder  │ │  2.0 Flash  │
    │  (Local)    │ │  (Local)    │ │  (Cloud)    │
    └─────────────┘ └─────────────┘ └─────────────┘
           │               │               │
           ▼               ▼               ▼
    ┌─────────────────────────────────────────────────────┐
    │           RESPUESTA AL USUARIO                      │
    └─────────────────────────────────────────────────────┘
```

---

## 2. Modelos y Uso Asignado

| Modelo | Tipo | Uso Principal | Cuándo se usa |
|--------|------|---------------|---------------|
| **DeepSeek R1 7B** | Local | Razonamiento lógico, matemáticas, análisis | Tareas que requieren "pensar" paso a paso |
| **Qwen 2.5 Coder 7B** | Local | Código, SQL, estructuras de datos | Programación, queries Firestore, debugging |
| **Gemini 2.0 Flash** | Cloud | Tareas complejas, generación de contenido | Cuando falla local o se necesita más potencia |

### 2.1 Selección Automática

```
COMPLEJIDAD BAJA ──────────────────────► USAR LOCAL (DeepSeek/Qwen)
  │                                      • Respuestas rápidas
  │                                      • Sin costo de API
  │                                      • Funciona offline
  │
COMPLEJIDAD ALTA ──────────────────────► USAR GEMINI
  • Análisis profundo                    • Razonamiento avanzado
  • Generación extensa                   • Contexto muy largo
  • Fallback si local falla              • Tareas críticas
```

---

## 3. Áreas de Implementación (Para Definir)

### 3.1 Chatbot Educativo para Alumnos
**Pregunta:** ¿Qué tipo de preguntas respondería?
- [ ] Solo materias del colegio (matemáticas, ciencias, etc.)
- [ ] Tareas y deberes
- [ ] Consultas administrativas (horarios, eventos)
- [ ] Orientación vocacional
- [ ] Todas las anteriores

**Modelo sugerido:** DeepSeek R1 (local) → fallback Gemini

### 3.2 Asistente para Docentes
**Pregunta:** ¿Qué funciones necesitarían?
- [ ] Generar planes de clase
- [ ] Crear evaluaciones/exámenes
- [ ] Redactar informes de progreso
- [ ] Analizar resultados de asistencia
- [ ] Sugerir estrategias pedagógicas

**Modelo sugerido:** Gemini (por complejidad) o Qwen para código/estructuras

### 3.3 Análisis de Datos y Reportes
**Pregunta:** ¿Qué tipo de análisis?
- [ ] Predicción de ausentismo
- [ ] Identificación de patrones de asistencia
- [ ] Reportes automáticos para dirección
- [ ] Estadísticas por grado/sección/docente

**Modelo sugerido:** DeepSeek R1 (análisis) + Gemini (reportes complejos)

### 3.4 Generación de Contenido
**Pregunta:** ¿Qué contenido generar?
- [ ] Resúmenes de materias
- [ ] Ejercicios y problemas
- [ ] Material didáctico
- [ ] Comunicados para padres
- [ ] Certificados/diplomas

**Modelo sugerido:** Gemini (calidad de escritura)

### 3.5 Integración con Sistema Actual
**Pregunta:** ¿Dónde aparecería la IA en la app?
- [ ] Chat flotante en todas las pantallas
- [ ] Sección dedicada "Asistente IA"
- [ ] Integrada en cada módulo (notas, asistencia, etc.)
- [ ] Botón contextual (ej: "Explicar este dato")

---

## 4. Configuración Técnica (Pendiente)

### 4.1 API Keys Necesarias
```env
# Ya tienes placeholder en .env.example
GEMINI_API_KEY=tu_api_key_aquí

# Ollama ya está configurado en opencode.json
OLLAMA_BASE_URL=http://localhost:11434/v1
```

### 4.2 Dependencias a Instalar
```bash
# Ya tienes instalado
npm install @google/genai          # ✅ Ya instalado (v2.4.0)
npm install @ai-sdk/openai-compatible  # ✅ Ya instalado (para Ollama)

# Pendiente
npm install ai                     # AI SDK de Vercel (para routing)
```

### 4.3 Estructura de Archivos Propuesta
```
src/
├── ai/
│   ├── config.ts              # Configuración de modelos
│   ├── router.ts              # Lógica de selección automática
│   ├── providers/
│   │   ├── ollama.ts          # Cliente Ollama (DeepSeek/Qwen)
│   │   └── gemini.ts          # Cliente Gemini
│   ├── prompts/
│   │   ├── chatbot-alumno.ts  # Prompts para alumnos
│   │   ├── asistente-docente.ts
│   │   └── analisis.ts
│   └── utils/
│       ├── token-counter.ts   # Conteo de tokens
│       └── fallback.ts        # Lógica de fallback
├── components/
│   └── ai/
│       ├── ChatBot.tsx        # Componente chat
│       ├── AIButton.tsx       # Botón contextual
│       └── AIAssistant.tsx    # Panel asistente
```

---

## 5. Plan de Implementación (Propuesta)

### Fase 1: Configuración Base (1-2 días)
- [ ] Obtener API Key de Gemini
- [ ] Configurar variables de entorno
- [ ] Instalar dependencias faltantes (`ai` SDK)
- [ ] Crear estructura `src/ai/`
- [ ] Implementar clientes: Ollama + Gemini

### Fase 2: Router Inteligente (2-3 días)
- [ ] Definir reglas de complejidad
- [ ] Implementar selección automática
- [ ] Sistema de fallback (local → cloud)
- [ ] Logging y métricas de uso

### Fase 3: Primer Caso de Uso (3-4 días)
- [ ] **¿Cuál es la prioridad?** (elegir 1)
  - Chatbot para alumnos
  - Asistente para docentes
  - Análisis de asistencia

### Fase 4: Integración UI (2-3 días)
- [ ] Componentes React para IA
- [ ] Estados de carga y error
- [ ] Historial de conversaciones
- [ ] Feedback del usuario

### Fase 5: Optimización (Continua)
- [ ] Ajustar selección de modelos
- [ ] Mejorar prompts
- [ ] Cache de respuestas frecuentes
- [ ] Monitoreo de costos (Gemini)

---

## 6. Costos Estimados

### Ollama (Local)
- **Costo:** $0 (solo electricidad de tu PC/Mac)
- **Requisito:** 8GB+ RAM para modelos de 7B
- **Velocidad:** ~10-30 tokens/segundo

### Gemini API
- **Modelo:** 2.0 Flash (económico)
- **Precio:** $0.075 / 1M tokens de entrada
- **Ejemplo:** 1000 consultas/día × 500 tokens = ~$0.15/día
- **Límite free tier:** 15 RPM, 1M tokens/día

---

## 7. Preguntas Pendientes

Para avanzar necesito que definas:

### Prioridad de Implementación
¿Qué área implementamos primero?
1. Chatbot para alumnos
2. Asistente para docentes
3. Análisis de datos
4. Generación de contenido
5. **Otra:** _______________

### Presupuesto/API Key
- ¿Ya tienes API key de Google Cloud/Gemini?
- ¿Cuenta con tier free o ya tienes facturación habilitada?

### Infraestructura
- ¿Ollama ya está corriendo en tu máquina?
- ¿Qué spec tiene tu PC/Mac? (RAM, CPU)

### Integración Visual
- ¿Cómo quieres que se vea la IA en la app?
  - Chat flotante
  - Sección dedicada
  - Botones contextuales
  - Todo junto

---

**Nota:** Este plan es borrador. Vamos ajustando según tus respuestas.
