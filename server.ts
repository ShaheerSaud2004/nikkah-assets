const ASSET = "https://d2ol7oe51mr4n9.cloudfront.net/user_3GESRZptHIlq6gCjrHPZwL9zm7I/";
const FILES = {
  page: Bun.env.PAGE_FILE || "aecf14e5-77a6-430b-a6e5-2fb93eca3b21.html",
  card: Bun.env.CARD_FILE || "b6a0329b-f393-4f55-b270-aa735bf5972d.webp",
  apex: Bun.env.APEX_FILE || "a4b1799f-1706-46d1-8f06-b1a85becf991.webp",
  og: Bun.env.OG_FILE || "54992541-257f-40a7-b384-f327692533d1.jpg",
};
const ADMIN_KEY = Bun.env.ADMIN_KEY || "";
const NOTIFY_EMAIL = Bun.env.NOTIFY_EMAIL || "";
const sql = new Bun.SQL(Bun.env.DATABASE_URL!);

await sql`CREATE TABLE IF NOT EXISTS rsvps (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, attending BOOLEAN NOT NULL, guests INT NOT NULL DEFAULT 0,
  contact TEXT, message TEXT, ip TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
await sql`CREATE TABLE IF NOT EXISTS assets (name TEXT PRIMARY KEY, data BYTEA NOT NULL)`;

// Assets are copied into the database on first use, so the site keeps working even if the original host disappears.
async function load(f: string): Promise<Buffer> {
  const rows: any[] = await sql`SELECT data FROM assets WHERE name = ${f}`;
  if (rows.length) return Buffer.from(rows[0].data);
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(f.startsWith("http") ? f : ASSET + f);
      if (r.ok) { const b = Buffer.from(await r.arrayBuffer()); await sql`INSERT INTO assets (name, data) VALUES (${f}, ${b}) ON CONFLICT (name) DO NOTHING`; return b; }
    } catch {}
    await Bun.sleep(1500);
  }
  throw new Error("asset unavailable: " + f);
}
const PATCHES: [string, string][] = [["var CLOSES=Date.UTC(2026,9,5,3,59,59); // Oct 4 11:59:59 PM ET (UTC-4)", "var CLOSES=Date.UTC(2026,10,2,4,59,59); // Nov 1 11:59:59 PM ET (UTC-5)"], ["Kindly RSVP by October 4", "Kindly RSVP by November 1"], ["RSVP by October 4", "RSVP by November 1"], ["Sunday, October 4", "Sunday, November 1"], ["The reply deadline was October 4", "The reply deadline was November 1"], ["881%20US-206%2C%20Bridgewater%20NJ%2008807", "675%20US-1%2C%20Iselin%20NJ%2008830"], ["881%20US-206%20Bridgewater%20NJ%2008807", "675%20US-1%20Iselin%20NJ%2008830"], ["881%20US-206%2C%20Bridgewater%2C%20NJ%2008807", "675%20US-1%2C%20Iselin%2C%20NJ%2008830"], ["Al%20Falah%20Center", "Canopy%20Lounge"], ["Al Falah Center, Bridgewater NJ", "Canopy Lounge, Iselin NJ"], ["at Al Falah Center in Bridgewater", "at Canopy Lounge in Iselin"], ["881 US-206, Bridgewater NJ 08807", "675 US-1, Iselin NJ 08830"], ["Al Falah Center", "Canopy Lounge"], ["Bridgewater, New Jersey", "Iselin, New Jersey"],["<h1>Shaheer Saud<em>&amp;</em>Nuralhuda Nasir</h1>", "<h1>Nuralhuda Nasir<em>&amp;</em>Shaheer Saud</h1>"],["Bismillah \u00b7 You are invited to the Nikkah of", "Bismillah \u00b7 Mr. Nasir L. Kambo &amp; Ms. Shaheena Kausar, together with Mr. Saud Asif &amp; Mrs. Fouzia Saud, invite you to the Nikkah of"],["Nikkah%20of%20Shaheer%20Saud%20%26%20Nuralhuda%20Nasir", "Nikkah%20of%20Nuralhuda%20Nasir%20%26%20Shaheer%20Saud"],["Nikkah%20of%20Shaheer%20%26%20Nuralhuda", "Nikkah%20of%20Nuralhuda%20%26%20Shaheer"],["Nikkah of Shaheer Saud & Nuralhuda Nasir", "Nikkah of Nuralhuda Nasir & Shaheer Saud"],["for Shaheer Saud and Nuralhuda Nasir", "for Nuralhuda Nasir and Shaheer Saud"],["Shaheer &amp; Nuralhuda", "Nuralhuda &amp; Shaheer"],["The Nikkah of Shaheer & Nuralhuda", "The Nikkah of Nuralhuda & Shaheer"],["2026 \u00b7 1:00 PM", "2026 \u00b7 1\u20135 PM"],["at 1:00 PM, Canopy", "at 1\u20135 PM, Canopy"],["1:00 in the afternoon", "1:00 \u2013 5:00 in the afternoon"],["<div class=\"eyebrow\">You are invited to the Nikkah of</div>", "<div class=\"eyebrow\">Mr. Nasir L. Kambo &amp; Ms. Shaheena Kausar \u00b7 Mr. Saud Asif &amp; Mrs. Fouzia Saud invite you to the Nikkah of</div>"],["<div class=\"gate-names\">Shaheer Saud <span class=\"amp\">&amp;</span> Nuralhuda Nasir</div>", "<div class=\"gate-names\">Nuralhuda Nasir <span class=\"amp\">&amp;</span> Shaheer Saud</div>"],["2026 \u00b7 1\u20135 PM", "2026 \u00b7 7 PM"],["at 1\u20135 PM, Canopy", "at 7 PM, Canopy"],["1:00 \u2013 5:00 in the afternoon", "7:00 in the evening"],["var target=Date.UTC(2026,10,21,18,0,0)", "var target=Date.UTC(2026,10,22,0,0,0)"],["dates=20261121T180000Z/20261121T220000Z", "dates=20261122T000000Z/20261122T040000Z"],["<div class=\"note key\"><svg viewBox=\"0 0 40 40\"><rect x=\"6\" y=\"8\" width=\"28\" height=\"26\" rx=\"2\"/><path d=\"M6 15h28M13 5v6M27 5v6M14 24l4 4 8-8\"/></svg><p>Kindly RSVP by November 1</p></div>", ""]];
const PAGE = PATCHES.reduce((h, [a, b]) => h.replaceAll(a, b), (await load(FILES.page)).toString("utf8"));
const CARD = await load(FILES.card);
const APEX = await load(FILES.apex);
const OG = await load(FILES.og);

const ICS = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SN Nikkah//EN", "BEGIN:VEVENT", "UID:nikkah-sn-20261121@rsvp",
  "DTSTAMP:20260924T000000Z", "DTSTART:20261122T000000Z", "DTEND:20261122T040000Z",
  "SUMMARY:Nikkah of Nuralhuda & Shaheer", "LOCATION:Canopy Lounge\\, 675 US-1\\, Iselin NJ 08830",
  "DESCRIPTION:Nikkah of Nuralhuda Nasir & Shaheer Saud", "END:VEVENT", "END:VCALENDAR"].join("\r\n");

const CLOSES = Date.UTC(2026, 10, 2, 4, 59, 59); // Nov 1 11:59:59 PM ET
const hits = new Map<string, number[]>();
const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
const json = (o: any, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
const img = (buf: Buffer, type: string) => new Response(buf, { headers: { "content-type": type, "cache-control": "public, max-age=3600" } });

async function notify(r: { name: string; attending: boolean; guests: number; contact: string; message: string }, origin: string) {
  if (!NOTIFY_EMAIL) return;
  try {
    const totals: any[] = await sql`SELECT COALESCE(SUM(guests) FILTER (WHERE attending), 0) AS g, COUNT(*) FILTER (WHERE attending) AS y, COUNT(*) FILTER (WHERE NOT attending) AS n FROM rsvps`;
    const t = totals[0];
    const res = await fetch("https://formsubmit.co/ajax/" + NOTIFY_EMAIL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", origin, referer: origin + "/" },
      body: JSON.stringify({
        _subject: `New RSVP: ${r.name} (${r.attending ? "Yes, " + r.guests : "No"})`,
        _template: "table", _captcha: "false",
        Name: r.name, Attending: r.attending ? "Yes" : "No", Guests: r.attending ? r.guests : 0,
        Contact: r.contact || "-", Note: r.message || "-",
        "Running total": `${t.g} guests attending (${t.y} yes, ${t.n} no)`,
        "All replies": origin + "/admin?key=" + ADMIN_KEY,
      }),
    });
    console.log("notify", res.status, (await res.text()).slice(0, 200));
  } catch (e) { console.log("notify failed", String(e)); }
}

async function adminHtml(): Promise<string> {
  const rows: any[] = await sql`SELECT * FROM rsvps ORDER BY created_at DESC`;
  const yes = rows.filter((r) => r.attending), no = rows.filter((r) => !r.attending);
  const head = yes.reduce((a, r) => a + Number(r.guests), 0);
  const tr = rows.map((r) => `<tr class="${r.attending ? "y" : "n"}"><td>${esc(r.name)}</td><td>${r.attending ? "Yes" : "No"}</td><td>${r.attending ? r.guests : ""}</td><td>${esc(r.contact)}</td><td>${esc(r.message)}</td><td>${new Date(r.created_at).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td><td><form method="post" action="/admin/delete?key=${encodeURIComponent(ADMIN_KEY)}&id=${r.id}" onsubmit="return this.querySelector('input').checked"><label style="font-size:12px"><input type="checkbox"> confirm</label> <button>Remove</button></form></td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>RSVP responses</title>
<style>body{font-family:Georgia,serif;background:#fbf5ea;color:#4a111b;margin:0;padding:24px 16px}h1{font-weight:400;margin:0 0 16px}
.s{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}.s div{background:#5a1520;color:#fff4e3;padding:12px 18px;border-radius:6px}.s b{display:block;font-size:28px}
.t{overflow-x:auto}table{border-collapse:collapse;width:100%;background:#fff;font-size:15px}th,td{padding:9px 10px;border-bottom:1px solid #eadbbd;text-align:left;vertical-align:top}
th{background:#f3e8d4}tr.n td:nth-child(2){color:#a3222f}tr.y td:nth-child(2){color:#2f6b3a;font-weight:600}a{color:#5a1520}</style></head><body>
<h1>Nikkah RSVPs</h1><div class="s"><div><b>${head}</b>Guests attending</div><div><b>${yes.length}</b>Yes replies</div><div><b>${no.length}</b>No replies</div><div><b>${rows.length}</b>Total replies</div></div>
<p><a href="/admin.csv?key=${encodeURIComponent(ADMIN_KEY)}">Download CSV</a> · If someone replied twice, the newest reply is at the top.</p>
<div class="t"><table><thead><tr><th>Name</th><th>Attending</th><th>Guests</th><th>Contact</th><th>Note</th><th>Replied</th><th></th></tr></thead><tbody>${tr || '<tr><td colspan="7">No replies yet.</td></tr>'}</tbody></table></div></body></html>`;
}

Bun.serve({
  port: Number(Bun.env.PORT || 3000),
  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname;
    const origin = "https://" + (req.headers.get("x-forwarded-host") || url.host);
    if (req.method === "GET" || req.method === "HEAD") {
      if (p === "/" || p === "/index.html") return new Response(PAGE.replaceAll("__ORIGIN__", origin), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" } });
      if (p === "/card.webp") return img(CARD, "image/webp");
      if (p === "/apex.webp") return img(APEX, "image/webp");
      if (p === "/og.jpg") return img(OG, "image/jpeg");
      if (p === "/nikkah.ics") return new Response(ICS, { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": "attachment; filename=nikkah.ics" } });
      if (p === "/health") return new Response("ok");
      if (p === "/admin" || p === "/admin.csv") {
        if (!ADMIN_KEY || url.searchParams.get("key") !== ADMIN_KEY) return new Response("Not found", { status: 404 });
        if (p === "/admin") return new Response(await adminHtml(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
        const rows: any[] = await sql`SELECT name, attending, guests, contact, message, created_at FROM rsvps ORDER BY created_at`;
        const q = (v: any) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
        const csv = "Name,Attending,Guests,Contact,Note,Replied\n" + rows.map((r) => [r.name, r.attending ? "Yes" : "No", r.guests, r.contact, r.message, new Date(r.created_at).toISOString()].map(q).join(",")).join("\n");
        return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=nikkah-rsvps.csv" } });
      }
      return new Response("Not found", { status: 404 });
    }
    if (req.method === "POST" && p === "/admin/delete") {
      if (!ADMIN_KEY || url.searchParams.get("key") !== ADMIN_KEY) return new Response("Not found", { status: 404 });
      const id = parseInt(url.searchParams.get("id") || "");
      if (id > 0) await sql`DELETE FROM rsvps WHERE id = ${id}`;
      return new Response(null, { status: 303, headers: { location: "/admin?key=" + encodeURIComponent(ADMIN_KEY) } });
    }
    if (req.method === "POST" && p === "/api/rsvp") {
      if (Date.now() > CLOSES) return json({ error: "RSVPs closed on November 1." }, 403);
      const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
      const now = Date.now();
      const list = (hits.get(ip) || []).filter((t) => now - t < 3600000);
      if (list.length >= 15) return json({ error: "Too many submissions from this connection." }, 429);
      list.push(now); hits.set(ip, list);
      let b: any;
      try { const t = await req.text(); if (t.length > 5000) throw 0; b = JSON.parse(t); } catch { return json({ error: "Invalid request." }, 400); }
      if (b.website) return json({ ok: true });
      const name = String(b.name || "").trim().slice(0, 100);
      if (!name) return json({ error: "Please enter your name." }, 400);
      if (typeof b.attending !== "boolean") return json({ error: "Please choose whether you will attend." }, 400);
      const guests = b.attending ? Math.min(10, Math.max(1, parseInt(b.guests) || 1)) : 0;
      const contact = String(b.contact || "").trim().slice(0, 120);
      const message = String(b.message || "").trim().slice(0, 500);
      await sql`INSERT INTO rsvps (name, attending, guests, contact, message, ip) VALUES (${name}, ${b.attending}, ${guests}, ${contact}, ${message}, ${ip})`;
      notify({ name, attending: b.attending, guests, contact, message }, origin);
      return json({ ok: true });
    }
    return new Response("Method not allowed", { status: 405 });
  },
});
console.log("nikkah site up");
