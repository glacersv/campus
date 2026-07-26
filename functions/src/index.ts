import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

// Initialize Firebase Admin
initializeApp();

// ==================== ROLE MANAGEMENT ====================

// ==================== ADMIN USER CREATION ====================

export const createUserByAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión");
  }

  const callerUid = request.auth.uid;
  const { email, password, displayName, role } = request.data;

  if (!email || !password || !displayName || !role) {
    throw new HttpsError("invalid-argument", "email, password, displayName y role son requeridos");
  }

  if (password.length < 6) {
    throw new HttpsError("invalid-argument", "La contraseña debe tener al menos 6 caracteres");
  }

  const validRoles = [
    "admin", "coordinacion", "coordinacion_academica", "coordinacion_convivencia",
    "coordinacion_primaria", "coordinacion_parvularia", "registro_academico",
    "enfermeria", "psicopedagogico", "docente", "alumno"
  ];

  if (!validRoles.includes(role)) {
    throw new HttpsError("invalid-argument", `Rol inválido. Debe ser uno de: ${validRoles.join(", ")}`);
  }

  const callerDoc = await getFirestore().collection("users").doc(callerUid).get();
  const callerData = callerDoc.data();

  if (!callerData) {
    throw new HttpsError("not-found", "Perfil de usuario no encontrado");
  }

  if (callerData.role !== "admin") {
    throw new HttpsError("permission-denied", "Solo administradores pueden crear usuarios");
  }

  try {
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });

    await getAuth().setCustomUserClaims(userRecord.uid, { role });

    await getFirestore().collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      role,
      createdAt: new Date().toISOString(),
    });

    return { success: true, uid: userRecord.uid, message: `Usuario ${displayName} creado con rol ${role}` };
  } catch (err: any) {
    if (err.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "El correo electrónico ya está registrado");
    }
    throw new HttpsError("internal", err.message || "Error al crear usuario");
  }
});

// Only admins can create users with admin roles
export const assignUserRole = onCall(async (request) => {
  // Check if caller is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const callerUid = request.auth.uid;
  const { targetUid, newRole } = request.data;

  // Validate input
  if (!targetUid || !newRole) {
    throw new HttpsError("invalid-argument", "targetUid and newRole are required");
  }

  const validRoles = [
    "admin", "coordinacion", "registro_academico", 
    "enfermeria", "psicopedagogio", "docente", "alumno"
  ];

  if (!validRoles.includes(newRole)) {
    throw new HttpsError("invalid-argument", `Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  // Get caller's role
  const callerDoc = await getFirestore().collection("users").doc(callerUid).get();
  const callerData = callerDoc.data();

  if (!callerData) {
    throw new HttpsError("not-found", "Caller user profile not found");
  }

  // Only admins can assign admin/coordinacion/registro_academico roles
  const privilegedRoles = ["admin", "coordinacion", "registro_academico"];
  if (privilegedRoles.includes(newRole) && callerData.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can assign privileged roles");
  }

  // Staff can assign docente/alumno roles, admins can assign any
  const staffRoles = ["admin", "coordinacion", "registro_academico", "enfermeria", "psicopedagogio"];
  if (!staffRoles.includes(callerData.role) && !privilegedRoles.includes(newRole)) {
    throw new HttpsError("permission-denied", "Insufficient permissions to assign roles");
  }

  // Update the target user's role in Firestore
  await getFirestore().collection("users").doc(targetUid).update({
    role: newRole,
    updatedAt: new Date().toISOString()
  });

  // Set custom claims for the target user
  await getAuth().setCustomUserClaims(targetUid, { role: newRole });

  return { success: true, message: `Role updated to ${newRole}` };
});

// ==================== GEMINI PROXY ====================

export const geminiProxy = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { messages } = request.data;

  if (!messages || !Array.isArray(messages)) {
    throw new HttpsError("invalid-argument", "messages array is required");
  }

  // Get Gemini API key from environment
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "Gemini API key not configured");
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: messages.map((msg: { role: string; text: string }) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text }]
          })),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
          }
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new HttpsError("internal", data.error.message);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { content: text };

  } catch (error) {
    console.error("Gemini proxy error:", error);
    throw new HttpsError("internal", "Error calling Gemini API");
  }
});

// ==================== USER CREATION VALIDATION ====================

export const validateUserCreation = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const callerUid = request.auth.uid;
  const { email, displayName, role } = request.data;

  // Validate input
  if (!email || !displayName || !role) {
    throw new HttpsError("invalid-argument", "email, displayName, and role are required");
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new HttpsError("invalid-argument", "Invalid email format");
  }

  // Display name validation
  if (displayName.length < 2 || displayName.length > 100) {
    throw new HttpsError("invalid-argument", "Display name must be 2-100 characters");
  }

  // Get caller's role
  const callerDoc = await getFirestore().collection("users").doc(callerUid).get();
  const callerData = callerDoc.data();

  if (!callerData) {
    throw new HttpsError("not-found", "Caller user profile not found");
  }

  // Only admins can create other admins
  const privilegedRoles = ["admin", "coordinacion", "registro_academico"];
  if (privilegedRoles.includes(role) && callerData.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can create users with privileged roles");
  }

  return { 
    allowed: true, 
    callerRole: callerData.role,
    targetRole: role
  };
});