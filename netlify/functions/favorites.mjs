import { getStore } from "@netlify/blobs";

const store = () =>
  getStore({
    name: "favorites",
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_TOKEN,
  });

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  const s = store();
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/favorites\/?/, "").split("/").filter(Boolean);
  const id = parts[0] || null;

  if (req.method === "GET" && !id) {
    try {
      const raw = await s.get("all", { type: "json" });
      return json({ favorites: raw || [] });
    } catch {
      return json({ favorites: [] });
    }
  }

  if (req.method === "POST" && !id) {
    const body = await req.json();
    if (!body.name?.trim()) return json({ error: "Name required" }, 400);
    const raw = (await s.get("all", { type: "json" }).catch(() => null)) || [];
    const newFav = {
      id: `fav_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: body.name.trim(),
      category: body.category || "Other",
      note: body.note || "",
      link: body.link || "",
      addedAt: new Date().toISOString(),
    };
    await s.setJSON("all", [...raw, newFav]);
    return json({ favorite: newFav });
  }

  if (req.method === "PUT" && id) {
    const body = await req.json();
    const raw = (await s.get("all", { type: "json" }).catch(() => null)) || [];
    const updated = raw.map((f) =>
      f.id === id
        ? { ...f, name: body.name?.trim() || f.name, category: body.category || f.category, note: body.note ?? f.note, link: body.link ?? f.link }
        : f
    );
    await s.setJSON("all", updated);
    return json({ ok: true });
  }

  if (req.method === "DELETE" && id) {
    const raw = (await s.get("all", { type: "json" }).catch(() => null)) || [];
    await s.setJSON("all", raw.filter((f) => f.id !== id));
    return json({ ok: true });
  }

  return json({ error: "Not found" }, 404);
};

export const config = { path: ["/api/favorites", "/api/favorites/:id"] };
