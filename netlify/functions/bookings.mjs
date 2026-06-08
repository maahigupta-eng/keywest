import { getStore } from "@netlify/blobs";
import crypto from "crypto";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  const store = getStore({
    name: "beach-house-bookings",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_TOKEN,
  });

  const pathParts = event.path.replace(/.*\/api\/bookings\/?/, "").split("/").filter(Boolean);
  const bookingId = pathParts[0] || null;

  try {
    // GET all bookings — no auth needed
    if (event.httpMethod === "GET" && !bookingId) {
      let list = { blobs: [] };
      try { list = await store.list(); } catch {}
      const bookings = await Promise.all(list.blobs.map(async b => {
        try { return await store.get(b.key, { type: "json" }); } catch { return null; }
      }));
      const valid = bookings.filter(Boolean).sort((a, b) => (a.startDate||a.start||"").localeCompare(b.startDate||b.start||""));
      return { statusCode: 200, headers, body: JSON.stringify({ bookings: valid }) };
    }

    // POST create — no auth needed (passkey gates the app)
    if (event.httpMethod === "POST" && !bookingId) {
      const { name, startDate, endDate, note, color, visibility } = JSON.parse(event.body || "{}");
      if (!name || !startDate || !endDate) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing fields" }) };
      const id = crypto.randomUUID();
      const booking = { id, name, startDate, endDate, note: note || "", color: color || "#2E9B7F", visibility: visibility || "family", createdAt: new Date().toISOString() };
      await store.setJSON(id, booking);
      return { statusCode: 201, headers, body: JSON.stringify({ booking }) };
    }

    // PUT update — no auth needed
    if (event.httpMethod === "PUT" && bookingId) {
      let existing = null;
      try { existing = await store.get(bookingId, { type: "json" }); } catch {}
      if (!existing) return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
      const { name, startDate, endDate, note, color, visibility } = JSON.parse(event.body || "{}");
      const updated = { ...existing, name, startDate, endDate, note, color, visibility, updatedAt: new Date().toISOString() };
      await store.setJSON(bookingId, updated);
      return { statusCode: 200, headers, body: JSON.stringify({ booking: updated }) };
    }

    // DELETE — no auth needed
    if (event.httpMethod === "DELETE" && bookingId) {
      try { await store.delete(bookingId); } catch {}
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error: " + err.message }) };
  }
};
