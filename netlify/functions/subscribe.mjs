import { getStore } from "@netlify/blobs";

const subStore = () =>
  getStore({
    name: "subscribers",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_TOKEN,
  });

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = await req.json();
  const { contact, contactType, stayAlerts, flightReminders } = body;

  if (!contact?.trim()) return json({ error: "Contact required" }, 400);

  const s = subStore();
  const existing = (await s.get("all", { type: "json" }).catch(() => null)) || [];
  const key = contact.trim().toLowerCase();
  const already = existing.find((e) => e.contact.toLowerCase() === key);

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

    // Send welcome email via Resend fetch API
    if (contactType === "email" && process.env.RESEND_API_KEY) {
      const alertsList = [
        stayAlerts ? "Stay alerts — when someone books at the house" : null,
        flightReminders ? "Trip reminders — a nudge a few days before your stay" : null,
      ]
        .filter(Boolean)
        .map((item) => `<li style="margin-bottom:6px;">${item}</li>`)
        .join("");

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Casa Kallman <onboarding@resend.dev>",
          to: [contact.trim()],
          subject: "You're on the list 🌴",
          html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F5EFE3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1A6B5A;border-radius:16px 16px 0 0;padding:36px 40px 28px;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.45);">Key West · Sunset Key</p>
            <p style="margin:0;font-family:Georgia,serif;font-size:38px;font-weight:300;font-style:italic;color:#FDFAF6;line-height:1.1;">Casa Kallman</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#FDFAF6;padding:32px 40px 28px;border-left:1px solid #E8DCC8;border-right:1px solid #E8DCC8;">
            <p style="margin:0 0 18px;font-size:22px;font-family:Georgia,serif;font-style:italic;font-weight:300;color:#1A6B5A;">Hello — you're in.</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#5A7068;font-weight:300;">Thanks for signing up. We'll keep you in the loop about what's happening at the house.</p>
            ${alertsList ? `
            <p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#96B0A8;">You're signed up for</p>
            <ul style="margin:0 0 20px;padding-left:18px;font-size:14px;line-height:1.8;color:#0E1A16;font-weight:300;">
              ${alertsList}
            </ul>` : ""}
            <p style="margin:0;font-size:13px;color:#96B0A8;font-weight:300;font-style:italic;">See you in Key West. 🌴</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#EEF8F5;border-radius:0 0 16px 16px;padding:16px 40px;border:1px solid #E8DCC8;border-top:none;">
            <p style="margin:0;font-size:11px;color:#96B0A8;font-weight:300;">16 Sunset Key Dr · Key West, FL · Casa Kallman family calendar</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
        }),
      });

      const emailData = await emailRes.json();
      console.log("Resend response:", JSON.stringify(emailData));
    }
  }

  return json({ ok: true });
};

export const config = { path: "/api/subscribe" };
