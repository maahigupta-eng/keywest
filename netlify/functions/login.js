import crypto from "crypto";
import { getStore } from "@netlify/blobs";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const JWT_SECRET = process.env.JWT_SECRET || "change-me";

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString("base64url");
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHmac("sha256", s).update(password).digest("hex");
  return { hash, salt: s };
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  const store = getStore({ name: "beach-house-users", consistency: "strong" });
  const path = event.path.replace(/.*\/api\//, "");

  try {
    const { name, password, familyPasskey } = JSON.parse(event.body || "{}");
    if (!name || !password) return { statusCode: 400, headers, body: JSON.stringify({ error: "Name and password required" }) };

    const userKey = name.trim().toLowerCase().replace(/\s+/g, "_");

    if (path === "register") {
      const familyPK = (process.env.FAMILY_PASSKEY || "keywest2025").trim().toLowerCase();
      if (!familyPasskey || familyPasskey.trim().toLowerCase() !== familyPK) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: "Incorrect family passkey." }) };
      }
      let existing = null;
      try { existing = await store.get(userKey, { type: "json" }); } catch {}
      if (existing) return { statusCode: 409, headers, body: JSON.stringify({ error: "Name already taken. Try logging in instead." }) };

      const { hash, salt } = hashPassword(password);
      let allKeys = { blobs: [] };
      try { allKeys = await store.list(); } catch {}
      const isAdmin = allKeys.blobs.length === 0;
      const user = { name: name.trim(), userKey, hash, salt, isAdmin, createdAt: new Date().toISOString() };
      await store.setJSON(userKey, user);
      const token = signToken({ userKey, name: user.name, isAdmin });
      return { statusCode: 200, headers, body: JSON.stringify({ token, user: { name: user.name, isAdmin } }) };
    }

    if (path === "login") {
      let user = null;
      try { user = await store.get(userKey, { type: "json" }); } catch {}
      if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: "No account found. Register first." }) };
      const { hash } = hashPassword(password, user.salt);
      if (hash !== user.hash) return { statusCode: 401, headers, body: JSON.stringify({ error: "Wrong password." }) };
      const token = signToken({ userKey, name: user.name, isAdmin: user.isAdmin });
      return { statusCode: 200, headers, body: JSON.stringify({ token, user: { name: user.name, isAdmin: user.isAdmin } }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error: " + err.message }) };
  }
};
