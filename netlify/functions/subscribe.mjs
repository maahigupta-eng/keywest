import { getStore } from "@netlify/blobs";

const subStore = () =>
  getStore({
    name: "subscribers",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_TOKEN,
  });

const json = (body, status = 200) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = await req.json();
  const { contact, contactType, stayAlerts, flightReminders } = body;

  if (!contact?.trim()) return json({ error: "Contact required" }, 400);

  // Save to Blobs
  const s = subStore();
  const existing = (await s.get("all", { type: "json" }).catch(() => null)) || [];
  const key = contact.trim().toLowerCase();
  const already = existing.find(e => e.contact.toLowerCase() === key);

  if (!already) {
    const sub = {
      id: `sub_${Date.now()}`,
      contact: contact.trim(),
      contactType: contactType || "email",
      stayAlerts: !!stayAlerts,
      flightReminders: !!flightReminders,
      createdAt: new Date().toISOString(),
    };
    await s.setJSON("all", [...existing, sub]);

    // Send welcome email if email signup + Resend key available
    if (contactType === "email" && process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Casa Kallman <noreply@keywestkallman.netlify.app>",
          to: contact.trim(),
          subject: "You're on the Casa Kallman list 🌴",
          html: `
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;color:#0E1A16;">
              <div style="background:#1A6B5A;padding:32px 32px 24px;border-radius:12px 12px 0 0;">
                <p style="font-family:Georgia,serif;font-size:32px;color:#FDFAF6;margin:0;font-weight:300;font-style:italic;">Casa Kallman</p>
                <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin:6px 0 0;">Key West · Sunset Key</p>
              </div>
              <div style="background:#FDFAF6;padding:28px 32px 32px;border-radius:0 0 12px 12px;border:1px solid #E8DCC8;border-top:none;">
                <p style="font-size:15px;line-height:1.6;color:#5A7068;font-weight:300;">You're signed up for:</p>
                <ul style="font-size:14px;line-height:2;color:#0E1A16;font-weight:300;padding-left:18px;">
                  ${stayAlerts ? "<li>Stay alerts — when someone books at the house</li>" : ""}
                  ${flightReminders ? "<li>Trip reminders — a nudge before your stay</li>" : ""}
                </ul>
                <p style="font-size:13px;color:#96B0A8;margin-top:24px;font-weight:300;">See you in Key West. 🌴</p>
              </div>
            </div>
          `,
        }),
      }).catch(() => {});
    }
  }

  return json({ ok: true });
};

export const config = { path: "/api/subscribe" };
