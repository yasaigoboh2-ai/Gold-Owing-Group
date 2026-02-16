export default async function handler(req, res) {
  // POST以外は弾く
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    // ✅ body を確実に読む（req.body が無い環境でもOK）
    let body = req.body;

    if (!body) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf8");
      body = raw ? JSON.parse(raw) : {};
    } else if (typeof body === "string") {
      body = body ? JSON.parse(body) : {};
    }

    const name = (body.name || "").toString().trim();
    const contact = (body.contact || "").toString().trim();
    const datetime = (body.datetime || "").toString().trim();
    const people = Number(body.people || 0);
    const note = (body.note || "").toString().trim();
    const page = (body.page || "").toString().trim(); // "Restaurant420" / "WEDDING525" 想定

    // 最低限バリデーション
    if (!name || !contact || !datetime || !people) {
      return res.status(400).json({ ok: false, message: "必須項目が不足しています" });
    }

    // ✅ 店舗ごとにWebhookを分ける
    const webhookMap = {
      Restaurant420: process.env.DISCORD_WEBHOOK_URL_RESTAURANT,
      WEDDING525: process.env.DISCORD_WEBHOOK_URL_WEDDING,
    };

    const webhook =
      webhookMap[page] ||
      process.env.DISCORD_WEBHOOK_URL; // 予備（共通）を残すなら

    if (!webhook) {
      console.error("Discord webhook env is missing");
      return res.status(500).json({ ok: false, message: "Discord webhook env is missing" });
    }

    const payload = {
      username: "Reservation Bot",
      embeds: [
        {
          title: "📝 新規予約",
          fields: [
            { name: "店舗", value: page || "Unknown", inline: true },
            { name: "お名前", value: name, inline: true },
            { name: "連絡先", value: contact, inline: false },
            { name: "希望日時", value: datetime, inline: true },
            { name: "人数", value: String(people), inline: true },
            { name: "要望", value: note ? note : "なし", inline: false },
          ],
        },
      ],
    };

    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Discordは204で空のこと多い
    const text = await r.text().catch(() => "");

    if (!r.ok) {
      console.error("Discord webhook failed:", r.status, text);
      return res.status(502).json({
        ok: false,
        message: "Discord webhook failed",
        status: r.status,
        detail: text,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Reservation API error:", e);
    return res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
}
