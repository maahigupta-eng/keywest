import { getStore } from "@netlify/blobs";
import crypto from "crypto";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const JWT_SECRET = process.env.JWT_SECRET || "change-me";

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
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  const store = getStore({ name: "beach-house-requests", consistency: "strong" });
  const pathParts = event.path.replace(/.*\/api\/requests\/?/, "").split("/").filter(Boolean);
  const reqId = pathParts[0] || null;

  try {
    // GET all requests (admin only)
    if (event.httpMethod === "GET") {
      const user = getUser(event);
      if (!user?.isAdmin) return { statusCode: 403, headers, body: JSON.stringify({ error: "Admin only" }) };
      let list = { blobs: [] };
      try { list = await store.list(); } catch {}
      const requests = await Promise.all(list.blobs.map(async b => {
        try { return await store.get(b.key, { type: "json" }); } catch { return null; }
      }));
      const valid = requests.filter(Boolean).sort((a,b) => b.createdAt?.localeCompare(a.createdAt));
      return { statusCode: 200, headers, body: JSON.stringify({ requests: valid }) };
    }

    // POST new request (public)
    if (event.httpMethod === "POST" && !reqId) {
      const { name, email, checkin, checkout, message } = JSON.parse(event.body || "{}");
      if (!name || !email || !checkin || !checkout) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing required fields" }) };
      }

      const id = crypto.randomUUID();
      const request = { id, name, email, checkin, checkout, message: message||"", status: "pending", createdAt: new Date().toISOString() };
      await store.setJSON(id, request);

      // Send email via Resend
      const resendKey = process.env.RESEND_API_KEY;
      const notifyEmail = process.env.NOTIFY_EMAIL || "kallmanjt@gmail.com";
      if (resendKey) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${resendKey}` },
            body: JSON.stringify({
              from: "Casa Kallman <onboarding@resend.dev>",
              to: notifyEmail,
              subject: `New Stay Request from ${name}`,
              html: `
                <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1C2B2B;">
                  <h1 style="font-size:32px;font-weight:300;color:#1A6B6B;margin-bottom:8px;">New Stay Request</h1>
                  <p style="color:#4A6363;margin-bottom:32px;">Someone would like to stay at Casa Kallman.</p>
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:12px 0;border-bottom:1px solid #F2E4C8;color:#8AACAC;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Name</td><td style="padding:12px 0;border-bottom:1px solid #F2E4C8;font-size:16px;">${name}</td></tr>
                    <tr><td style="padding:12px 0;border-bottom:1px solid #F2E4C8;color:#8AACAC;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Email</td><td style="padding:12px 0;border-bottom:1px solid #F2E4C8;font-size:16px;">${email}</td></tr>
                    <tr><td style="padding:12px 0;border-bottom:1px solid #F2E4C8;color:#8AACAC;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Check In</td><td style="padding:12px 0;border-bottom:1px solid #F2E4C8;font-size:16px;">${checkin}</td></tr>
                    <tr><td style="padding:12px 0;border-bottom:1px solid #F2E4C8;color:#8AACAC;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Check Out</td><td style="padding:12px 0;border-bottom:1px solid #F2E4C8;font-size:16px;">${checkout}</td></tr>
                    ${message?`<tr><td style="padding:12px 0;color:#8AACAC;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Message</td><td style="padding:12px 0;font-size:16px;font-style:italic;">"${message}"</td></tr>`:""}
                  </table>
                  <p style="margin-top:32px;color:#4A6363;font-size:14px;">Log in to <a href="https://keywestkallman.netlify.app" style="color:#2E9B8F;">Casa Kallman</a> to approve or deny this request.</p>
                </div>
              `,
            }),
          });
        } catch(e) { console.error("Email send failed:", e); }
      }

      return { statusCode: 201, headers, body: JSON.stringify({ ok: true, request }) };
    }

    // PUT update request status (admin only)
    if (event.httpMethod === "PUT" && reqId) {
      const user = getUser(event);
      if (!user?.isAdmin) return { statusCode: 403, headers, body: JSON.stringify({ error: "Admin only" }) };
      let existing = null;
      try { existing = await store.get(reqId, { type: "json" }); } catch {}
      if (!existing) return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
      const { status } = JSON.parse(event.body || "{}");
      const updated = { ...existing, status, updatedAt: new Date().toISOString() };
      await store.setJSON(reqId, updated);
      return { statusCode: 200, headers, body: JSON.stringify({ request: updated }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };

  } catch(err) {
    console.error("Request error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error: " + err.message }) };
  }
};
