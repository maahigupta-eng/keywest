import { getStore } from "@netlify/blobs";
import crypto from "crypto";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-netlify-env";

function verifyToken(token) {
  try {
    const [header, body, sig] = token.split(".");
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString());
  } catch { return null; }
}

function getUser(event) {
  const auth = event.headers.authorization || event.headers.Authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const store = getStore({ name: "beach-house-bookings", consistency: "strong" });
  const pathParts = event.path.replace(/.*\/api\/bookings\/?/, "").split("/").filter(Boolean);
  const bookingId = pathParts[0] || null;

  try {
    if (event.httpMethod === "GET" && !bookingId) {
      const user = getUser(event);
      let list = { blobs: [] };
      try { list = await store.list(); } catch {}
      const bookings = await Promise.all(
        list.blobs.map(async b => {
          try { return await store.get(b.key, { type: "json" }); } catch { return null; }
        })
      );
      const valid = bookings.filter(Boolean).sort((a, b) => a.startDate.localeCompare(b.startDate));
      const filtered = user ? valid : valid.filter(b => b.visibility === "open");
      return { statusCode: 200, headers, body: JSON.stringify({ bookings: filtered }) };
    }

    if (event.httpMethod === "POST" && !bookingId) {
      const user = getUser(event);
      if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: "Login required" }) };
      const { name, startDate, endDate, note, visibility } = JSON.parse(event.body || "{}");
      if (!name || !startDate || !endDate) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "name, startDate, endDate required" }) };
      }
      const id = crypto.randomUUID();
      const booking = { id, name, startDate, endDate, note: note || "", visibility: visibility || "family", createdBy: user.userKey, createdAt: new Date().toISOString() };
      await store.setJSON(id, booking);
      return { statusCode: 201, headers, body: JSON.stringify({ booking }) };
    }

    if (event.httpMethod === "PUT" && bookingId) {
      const user = getUser(event);
      if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: "Login required" }) };
      let existing = null;
      try { existing = await store.get(bookingId, { type: "json" }); } catch {}
      if (!existing) return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
      if (!user.isAdmin && existing.createdBy !== user.userKey) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: "Not your booking" }) };
      }
      const { name, startDate, endDate, note, visibility } = JSON.parse(event.body || "{}");
      const updated = { ...existing, name, startDate, endDate, note, visibility, updatedAt: new Date().toISOString() };
      await store.setJSON(bookingId, updated);
      return { statusCode: 200, headers, body: JSON.stringify({ booking: updated }) };
    }

    if (event.httpMethod === "DELETE" && bookingId) {
      const user = getUser(event);
      if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: "Login required" }) };
      let existing = null;
      try { existing = await store.get(bookingId, { type: "json" }); } catch {}
      if (!existing) return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
      if (!user.isAdmin && existing.createdBy !== user.userKey) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: "Not your booking" }) };
      }
      await store.delete(bookingId);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };

  } catch (err) {
    console.error("Bookings error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error: " + err.message }) };
  }
};
