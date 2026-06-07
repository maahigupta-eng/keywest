import crypto from "crypto";

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

  try {
    const { name, password, familyPasskey } = JSON.parse(event.body || "{}");
    if (!name || !password) return { statusCode: 400, headers, body: JSON.stringify({ error: "Name and password required" }) };

    const familyPK = (process.env.FAMILY_PASSKEY || "keywest2025").trim().toLowerCase();
    if (!familyPasskey || familyPasskey.trim().toLowerCase() !== familyPK) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Incorrect family passkey." }) };
    }

    const { getStore } = await import("@netlify/blobs");
    const store = getStore("beach-house-users");
    const userKey = name.trim().toLowerCase().replace(/\s+/g, "_");

    let existing = null;
    try { existing = await store.get(userKey, { type: "json" }); } catch {}
    if (existing) return { statusCode: 409, headers, body: JSON.stringify({ error: "Name already taken. Try logging in." }) };

    const { hash, salt } = hashPassword(password);
    let allKeys = { blobs: [] };
    try { allKeys = await store.list(); } catch {}
    const isAdmin = allKeys.blobs.length === 0;
    const user = { name: name.trim(), userKey, hash, salt, isAdmin, createdAt: new Date().toISOString() };
    await store.setJSON(userKey, user);
    const token = signToken({ userKey, name: u
