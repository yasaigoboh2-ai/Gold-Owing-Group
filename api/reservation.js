// api/reservation.js

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

module.exports = async (req, res) => {
  // GETで叩かれた時（ブラウザ直アクセス）は405でOK
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { ok: false, message: "Method Not Allowed" });
  }

  try {
    const webhook = process.env.DISCORD_WEBHOOK_URL;
    if (!webhook) {
      console.error("DISCORD_WEBHOOK_URL is missing");
      return sendJson(res, 500, { ok: false, message: "Webhook not set" });
    }

    // body は object の時も string の時もあるので両対応
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const name = (body.name || "").toString().trim();
    const contact = (body.contact || "").toString().trim();
    const datetime = (body.datetime || "").toString().trim();
    const people = Number(body.people || 0);
    const note = (body.note || "").toString().trim();
    const page = (body.page || "Restaurant420").toString().trim();

    if (!name || !contact || !datetime || !people) {
      return sendJson(res, 400, { ok: false, message: "Bad Request" });
    }

    const content = [
      "🍽️ **予約フォーム通知**",
      `店舗: **${page}**`,
      `お名前: **${name}**`,
      `連絡先: **${contact}**`,
      `希望日時: **${datetime}**`,
      `人数: **${people}**`,
      `要望: ${note ? note : "（なし）"}`,
      `送信元: ${req.headers.referer || "unknown"}`,
    ].join("\n");

    const discordRes = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    const discordText = await discordRes.text(); // エラー時に内容確認できるよう読む

    if (!discordRes.ok) {
      console.error("Discord webhook failed:", discordRes.status, discordText);
      return sendJson(res, 502, {
        ok: false,
        message: "Discord webhook failed",
        status: discordRes.status,
      });
    }

    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error("Reservation API error:", err);
    return sendJson(res, 500, { ok: false, message: "Internal Server Error" });
  }
};
