// netlify/functions/auth.js
import { getStore } from "@netlify/blobs";
import crypto from "crypto";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-netlify-env";

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString("base64url");
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  try {
    const [header, body, sig] = token.split(".");
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString());
  } catch { return null; }
}

function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHmac("sha256", s).update(password).digest("hex");
  return { hash, salt: s };
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const path = event.path.replace(/.*\/api\//, "");
  const store = getStore({ name: "beach-house-users", consistency: "strong" });

  try {
    const { name, password, familyPasskey } = JSON.parse(event.body || "{}");

    if (!name || !password) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Name and password required" }) };
    }

    const userKey = name.toLowerCase().replace(/\s+/g, "_");

    if (path === "register") {
      const familyPK = (process.env.FAMILY_PASSKEY || process.env.GUEST_PASSKEY || "keywest2025").toLowerCase();
      if (!familyPasskey || familyPasskey.toLowerCase() !== familyPK) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: "Invalid family passkey" }) };
      }

      let existing = null;
      try { existing = await store.get(userKey, { type: "json" }); } catch {}
      if (existing) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: "Name already taken. Try a different name or log in." }) };
      }

      const { hash, salt } = hashPassword(password);
      let allKeys = { blobs: [] };
      try { allKeys = await store.list(); } catch {}
      const isAdmin = allKeys.blobs.length === 0;

      const user = { name, userKey, hash, salt, isAdmin, createdAt: new Date().toISOString() };
      await store.setJSON(userKey, user);

      const token = signToken({ userKey, name, isAdmin });
      return { statusCode: 200, headers, body: JSON.stringify({ token, user: { name, isAdmin } }) };
    }

    if (path === "login") {
      let user = null;
      try { user = await store.get(userKey, { type: "json" }); } catch {}
      if (!user) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: "Name not found. Check spelling or register." }) };
      }
      const { hash } = hashPassword(password, user.salt);
      if (hash !== user.hash) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: "Wrong password." }) };
      }
      const token = signToken({ userKey, name: user.name, isAdmin: user.isAdmin });
      return { statusCode: 200, headers, body: JSON.stringify({ token, user: { name: user.name, isAdmin: user.isAdmin } }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };

  } catch (err) {
    console.error("Auth error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error: " + err.message }) };
  }
};
