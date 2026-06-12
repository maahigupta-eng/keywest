import { getStore } from "@netlify/blobs";

const subStore = () =>
  getStore({
    name: "subscribers",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_TOKEN,
  });

export default async (req) => {
  if (req.method !== "POST") return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:{"Content-Type":"application/json"}});

  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({error:"Bad JSON"}),{status:400,headers:{"Content-Type":"application/json"}}); }

  const { contact, contactType, stayAlerts, flightReminders } = body;
  if (!contact?.trim()) return new Response(JSON.stringify({error:"Contact required"}),{status:400,headers:{"Content-Type":"application/json"}});

  // Save subscriber
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
    console.log("New subscriber saved:", sub.contact);
  }

  // Send welcome email
  if ((contactType === "email" || !contactType) && process.env.RESEND_API_KEY) {
    const alertLines = [
      stayAlerts ? "<li style='margin-bottom:6px;'>Stay alerts — when someone books at the house</li>" : "",
      flightReminders ? "<li style='margin-bottom:6px;'>Trip reminders — a nudge a few days before your stay</li>" : "",
    ].filter(Boolean).join("");

    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Casa Kallman <onboarding@resend.dev>",
          to: [contact.trim()],
          subject: "You're on the list 🌴",
          html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5EFE3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;"><tr><td align="center">
  <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
    <tr><td style="background:#1A6B5A;border-radius:16px 16px 0 0;padding:32px 36px 24px;">
      <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.4);">Key West · Sunset Key</p>
      <p style="margin:0;font-family:Georgia,serif;font-size:36px;font-weight:300;font-style:italic;color:#FDFAF6;line-height:1.1;">Casa Kallman</p>
    </td></tr>
    <tr><td style="background:#FDFAF6;padding:28px 36px 24px;border-left:1px solid #E8DCC8;border-right:1px solid #E8DCC8;">
      <p style="margin:0 0 14px;font-size:20px;font-family:Georgia,serif;font-style:italic;font-weight:300;color:#1A6B5A;">Hello — you're in.</p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#5A7068;font-weight:300;">Thanks for signing up. We'll keep you in the loop about what's happening at the house.</p>
      ${alertLines ? `<p style="margin:0 0 8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#96B0A8;">You're signed up for</p>
      <ul style="margin:0 0 20px;padding-left:16px;font-size:14px;line-height:1.8;color:#0E1A16;font-weight:300;">${alertLines}</ul>` : ""}
      <p style="margin:0;font-size:13px;color:#96B0A8;font-weight:300;font-style:italic;">See you in Key West. 🌴</p>
    </td></tr>
    <tr><td style="background:#EEF8F5;border-radius:0 0 16px 16px;padding:14px 36px;border:1px solid #E8DCC8;border-top:none;">
      <p style="margin:0;font-size:11px;color:#96B0A8;font-weight:300;">16 Sunset Key Dr · Key West, FL · Casa Kallman family calendar</p>
    </td></tr>
  </table></td></tr></table>
</body></html>`,
        }),
      });
      const emailJson = await emailRes.json();
      console.log("Resend status:", emailRes.status, JSON.stringify(emailJson));
      if (!emailRes.ok) console.error("Resend error:", emailJson);
    } catch (err) {
      console.error("Email send failed:", err.message);
    }
  }

  return new Response(JSON.stringify({ok:true}),{status:200,headers:{"Content-Type":"application/json"}});
};

export const config = { path: "/api/subscribe" };
