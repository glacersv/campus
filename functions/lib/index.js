"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserCreation = exports.geminiProxy = exports.assignUserRole = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
// Initialize Firebase Admin
(0, app_1.initializeApp)();
// ==================== ROLE MANAGEMENT ====================
// Only admins can create users with admin roles
exports.assignUserRole = (0, https_1.onCall)(async (request) => {
    // Check if caller is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated");
    }
    const callerUid = request.auth.uid;
    const { targetUid, newRole } = request.data;
    // Validate input
    if (!targetUid || !newRole) {
        throw new https_1.HttpsError("invalid-argument", "targetUid and newRole are required");
    }
    const validRoles = [
        "admin", "coordinacion", "registro_academico",
        "enfermeria", "psicopedagogio", "docente", "alumno"
    ];
    if (!validRoles.includes(newRole)) {
        throw new https_1.HttpsError("invalid-argument", `Invalid role. Must be one of: ${validRoles.join(", ")}`);
    }
    // Get caller's role
    const callerDoc = await (0, firestore_1.getFirestore)().collection("users").doc(callerUid).get();
    const callerData = callerDoc.data();
    if (!callerData) {
        throw new https_1.HttpsError("not-found", "Caller user profile not found");
    }
    // Only admins can assign admin/coordinacion/registro_academico roles
    const privilegedRoles = ["admin", "coordinacion", "registro_academico"];
    if (privilegedRoles.includes(newRole) && callerData.role !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Only admins can assign privileged roles");
    }
    // Staff can assign docente/alumno roles, admins can assign any
    const staffRoles = ["admin", "coordinacion", "registro_academico", "enfermeria", "psicopedagogio"];
    if (!staffRoles.includes(callerData.role) && !privilegedRoles.includes(newRole)) {
        throw new https_1.HttpsError("permission-denied", "Insufficient permissions to assign roles");
    }
    // Update the target user's role in Firestore
    await (0, firestore_1.getFirestore)().collection("users").doc(targetUid).update({
        role: newRole,
        updatedAt: new Date().toISOString()
    });
    // Set custom claims for the target user
    await (0, auth_1.getAuth)().setCustomUserClaims(targetUid, { role: newRole });
    return { success: true, message: `Role updated to ${newRole}` };
});
// ==================== GEMINI PROXY ====================
exports.geminiProxy = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e;
    // Check authentication
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated");
    }
    const { messages } = request.data;
    if (!messages || !Array.isArray(messages)) {
        throw new https_1.HttpsError("invalid-argument", "messages array is required");
    }
    // Get Gemini API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new https_1.HttpsError("failed-precondition", "Gemini API key not configured");
    }
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: messages.map((msg) => ({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: msg.text }]
                })),
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192
                }
            })
        });
        const data = await response.json();
        if (data.error) {
            throw new https_1.HttpsError("internal", data.error.message);
        }
        const text = ((_e = (_d = (_c = (_b = (_a = data.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || "";
        return { content: text };
    }
    catch (error) {
        console.error("Gemini proxy error:", error);
        throw new https_1.HttpsError("internal", "Error calling Gemini API");
    }
});
// ==================== USER CREATION VALIDATION ====================
exports.validateUserCreation = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated");
    }
    const callerUid = request.auth.uid;
    const { email, displayName, role } = request.data;
    // Validate input
    if (!email || !displayName || !role) {
        throw new https_1.HttpsError("invalid-argument", "email, displayName, and role are required");
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new https_1.HttpsError("invalid-argument", "Invalid email format");
    }
    // Display name validation
    if (displayName.length < 2 || displayName.length > 100) {
        throw new https_1.HttpsError("invalid-argument", "Display name must be 2-100 characters");
    }
    // Get caller's role
    const callerDoc = await (0, firestore_1.getFirestore)().collection("users").doc(callerUid).get();
    const callerData = callerDoc.data();
    if (!callerData) {
        throw new https_1.HttpsError("not-found", "Caller user profile not found");
    }
    // Only admins can create other admins
    const privilegedRoles = ["admin", "coordinacion", "registro_academico"];
    if (privilegedRoles.includes(role) && callerData.role !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Only admins can create users with privileged roles");
    }
    return {
        allowed: true,
        callerRole: callerData.role,
        targetRole: role
    };
});
//# sourceMappingURL=index.js.map