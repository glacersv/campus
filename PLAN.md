# Plan de Proyecto - Campus Colegio Salesiano San José

Este documento detalla la planificación, arquitectura, estado actual del sistema de control de asistencia y disciplina, y las instrucciones de despliegue para el **Campus Colegio Salesiano San José**.

---

## 1. Introducción y Enfoque del Proyecto

El sistema del **Campus Colegio Salesiano San José** es una aplicación web responsiva diseñada para simplificar el registro diario de asistencia y disciplina por parte del cuerpo docente. Permite seleccionar grados, registrar la presencia, llegadas tarde, ausencias, e incidencias de disciplina comunes (uniforme incorrecto, cabello largo, uñas pintadas) de forma rápida e intuitiva.

Además, el sistema está integrado con **Firebase Firestore** para almacenar todos los reportes de manera permanente y segura en la nube.

---

## 2. Arquitectura de Archivos del Proyecto

La estructura modular garantiza la escalabilidad del sistema y evita la saturación de archivos:

*   **`src/types.ts`**: Definición de tipos TypeScript compartidos (`Student`, `Teacher`, `Grade`, `AttendanceRecord`, etc.).
*   **`src/data.ts`**: Banco de datos iniciales estáticos (lista de alumnos por grado y profesores tutores).
*   **`src/firebase.ts`**: Módulo de inicialización de la base de datos de Firebase, controladores de errores tipados y función para guardar reportes en Firestore.
*   **`src/App.tsx`**: Componente de enrutamiento principal que controla el estado de autenticación de la sesión.
*   **`src/components/`**: Componentes visuales desacoplados:
    *   **`Login.tsx`**: Formulario de ingreso optimizado con la identidad institucional.
    *   **`Dashboard.tsx`**: Panel principal del tutor para registrar asistencia y disciplinea del día.
    *   **`InstitutionLogo.tsx`**: Cargador dinámico del escudo oficial con respaldo vectorial inteligente.
    *   **`SummaryModal.tsx`**: Modal de resumen del reporte diario que activa la sincronización en la nube y permite la exportación en formatos tradicionales (CSV, JSON).
*   **`firebase-blueprint.json`**: Esquema técnico de la estructura de colecciones de Firebase.
*   **`firebase-applet-config.json`**: Parámetros de conexión del proyecto Firebase (`campus-27248`).

---

## 3. Integración con Firebase Firestore

La aplicación está vinculada directamente con el proyecto en la nube **campus-27248**:

### Estructura del Documento (`attendance_reports`)
Cada reporte diario se registra en Firestore dentro de la colección `attendance_reports` con el siguiente esquema:

```json
{
  "colegio": "Colegio Salesiano San José",
  "fecha": "DD/MM/AAAA",
  "grado": "Nombre del Grado",
  "gradoId": "ID del Grado",
  "tutor": "Nombre del Docente",
  "tutorId": "ID del Docente",
  "modalidad": "Buenos Días o Acto Cívico",
  "estadisticas": {
    "totalEstudiantes": 12,
    "presentes": 10,
    "llegadasTarde": 1,
    "ausentes": 1,
    "disciplina": {
      "cabelloLargo": 0,
      "unasPintadas": 0,
      "uniformeIncorrecto": 1
    }
  },
  "detalles": [
    {
      "id": "1",
      "nombre": "Estudiante Ejemplo",
      "genero": "M" o "F",
      "asistencia": "Presente" o "Tarde" o "Ausente",
      "horaLlegada": "07:05 AM" o null,
      "disciplina": {
        "cabelloLargo": false,
        "unasPintadas": false,
        "uniformeIncorrecto": true
      }
    }
  ],
  "createdAt": "serverTimestamp()"
}
```

### Flujo de Sincronización en Vivo
En el **SummaryModal**, al completarse la jornada y presionar "Enviar Reporte", se activa un indicador visual en tiempo real:
*   **`Sincronizando...`**: Sube los datos estadísticos y la nómina completa a Firestore.
*   **`¡Sincronizado exitosamente!`**: Muestra un check de éxito verde, confirmando la persistencia y reflejando el ID del documento generado por la base de datos.
*   **`Error de Sincronización`**: Ofrece un botón de "Reintentar" y la descripción del error técnico por si falla la red.

---

## 4. Cambios Recientes Aplicados

### Escudo Oficial e Identidad Visual
*   Se configuró el logotipo institucional (`InstitutionLogo.tsx`) para cargar de forma prioritaria el **Escudo Oficial del Colegio Salesiano San José** desde la URL de origen de alta fidelidad.
*   Se programó un sistema de "fallback" (respaldo) mediante SVG personalizado. Si la imagen externa no carga por restricciones de conexión del cliente, se renderiza automáticamente una versión vectorial precisa del escudo con el mástil inclinado, las 4 estrellas doradas, la franja de El Salvador, el estudiante señalando hacia el cielo ("AD ASTRA") y la cinta dorada con la inscripción "SAN JOSÉ".

### Ajuste en Pantalla de Login
*   Se eliminó la línea de texto `"Control de Asistencia y Disciplina"`.
*   Se unificó y simplificó el título superior a un rotundo: **CAMPUS COLEGIO SALESIANO SAN JOSÉ**, manteniendo las tipografías de alto contraste y el estilo limpio para una experiencia premium.

---

## 5. Instrucciones de Descarga y Despliegue Local

### ¿Cómo descargar el proyecto de AI Studio?
Puedes exportar y descargar el código fuente completo del proyecto para usarlo en tu máquina local o subirlo a tu propio hosting mediante los siguientes pasos en la interfaz de AI Studio:
1.  Busca el menú de **Settings** (Configuración) o el botón de **Export/Download** en la esquina superior derecha o en la barra lateral del espacio de trabajo.
2.  Selecciona la opción **Download as ZIP** (Descargar como ZIP) para obtener todos los archivos de React, Vite y la configuración de Firebase en tu computadora.
3.  Alternativamente, puedes usar la opción **Export to GitHub** si deseas crear un repositorio en tu cuenta personal de GitHub de forma automática.

### Ejecución Local en tu computadora
Una vez descargado y descomprimido el archivo ZIP:
1.  Asegúrate de tener instalado **Node.js** (versión 18 o superior).
2.  Abre una terminal en la carpeta raíz del proyecto y ejecuta:
    ```bash
    npm install
    ```
3.  Para iniciar el servidor de desarrollo local, ejecuta:
    ```bash
    npm run dev
    ```
4.  Abre en tu navegador la dirección indicada (usualmente `http://localhost:3000` o `http://localhost:5173`).

---

## 6. Despliegue en un Hosting de Producción

### Opción A: Firebase Hosting (Recomendada)
Para hospedar la aplicación gratis en el hosting oficial de Google Firebase junto a tu base de datos:
1.  Instala las herramientas CLI de Firebase en tu computadora:
    ```bash
    npm install -g firebase-tools
    ```
2.  Inicia sesión en tu cuenta de Google:
    ```bash
    firebase login
    ```
3.  Inicializa el hosting en la carpeta de tu proyecto:
    ```bash
    firebase init hosting
    ```
    *   *¿Qué proyecto deseas usar?* Selecciona tu proyecto existente `campus-27248`.
    *   *¿Cuál es tu directorio público?* Escribe **`dist`** (que es donde Vite compila los archivos para producción).
    *   *¿Configurar como SPA (Single Page Application)?* Responde que **Sí (`y`)**.
    *   *¿Configurar builds automáticos con GitHub?* Responde que **No (`n`)** o Sí si deseas automatizarlo.
4.  Construye los archivos de producción del proyecto:
    ```bash
    npm run build
    ```
5.  Despliega la aplicación al hosting oficial de Google:
    ```bash
    firebase deploy --only hosting
    ```
6.  ¡Listo! El CLI te proporcionará una URL pública (ejemplo: `https://campus-27248.web.app`) para acceder desde cualquier parte del mundo.
