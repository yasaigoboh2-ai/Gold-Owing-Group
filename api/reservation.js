module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      return res.status(500).json({ ok: false, message: "DISCORD_WEBHOOK_URL is not set" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const name = String(body.name || "").trim();
    const contact = String(body.contact || "").trim();
    const datetime = String(body.datetime || "").trim();
    const people = Number(body.people || 0);
    const note = String(body.note || "").trim();
    const page = String(body.page || "Restaurant420").trim();

    if (!name || !contact || !datetime || !people || people < 1) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    const safe = (s) => String(s).replace(/@/g, "＠").slice(0, 500);

    const payload = {
      username: "Reservation Bot",
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: "🍽️ 新しい予約が入りました",
          color: 0xd9b46a,
          fields: [
            { name: "店舗", value: safe(page), inline: true },
            { name: "人数", value: String(people), inline: true },
            { name: "希望日時", value: safe(datetime), inline: false },
            { name: "お名前", value: safe(name), inline: true },
            { name: "連絡先", value: safe(contact), inline: true },
            { name: "要望", value: note ? safe(note) : "（なし）", inline: false },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const r = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return res.status(502).json({ ok: false, message: "Discord webhook failed", detail: txt });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
