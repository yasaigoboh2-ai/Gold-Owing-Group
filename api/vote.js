// 1周年 人気投票 API（Vercel）
//   GET  /api/vote  … 集計を返す { ok, phase, tallies: [{ category, candidate_id, votes }] }
//   POST /api/vote  … { name, food, drink } で投票（1キャラ名につき各部門1票）
//
// 必要な環境変数（Vercel → Settings → Environment Variables）
//   SUPABASE_URL               例: https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  Supabase → Project Settings → API Keys の secret キー（sb_secret_…）
//                              または Legacy API Keys の service_role キー。どちらでも可（公開しないこと）
//   VOTE_SALT                  任意の長い文字列（IPをそのまま保存しないためのもの）
//   VOTE_FORCE_OPEN            "1" にすると期間外でも投票できる（動作テスト用。終わったら消す）
import crypto from "node:crypto";

// 日程を変えるときは js/anniv-data.js も合わせて変える
const VOTE_START = Date.parse("2026-11-01T00:00:00+09:00");
const VOTE_END = Date.parse("2026-11-08T00:00:00+09:00"); // 11/7 23:59 まで
const CATEGORIES = ["food", "drink"];
const ID_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;
const MAX_PER_IP = 3; // 同じ回線から投票できるキャラ数（家族・同居を考えて少し余裕を持たせる）

const readBody = async (req) => {
  let body = req.body;
  if (!body) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8");
    body = raw ? JSON.parse(raw) : {};
  } else if (typeof body === "string") {
    body = body ? JSON.parse(body) : {};
  }
  return body || {};
};

const cleanName = (s) =>
  String(s || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export default async function handler(req, res) {
  const url = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) {
    return res.status(503).json({ ok: false, message: "投票の準備中です。時間をおいてお試しください。" });
  }

  const rest = `${url}/rest/v1`;
  // 新形式の秘密キー（sb_secret_…）は apikey ヘッダーだけ、旧形式（JWT）は Authorization にも入れる
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (!key.startsWith("sb_")) headers.Authorization = `Bearer ${key}`;
  const now = Date.now();
  const phase =
    process.env.VOTE_FORCE_OPEN === "1" ? "open" : now < VOTE_START ? "before" : now < VOTE_END ? "open" : "closed";

  try {
    // ----- 集計 -----
    if (req.method === "GET") {
      if (phase === "before") return res.status(200).json({ ok: true, phase, tallies: [] });
      const r = await fetch(`${rest}/anniv_vote_tally?select=category,candidate_id,votes`, { headers });
      if (!r.ok) throw new Error(`tally ${r.status}`);
      const tallies = await r.json();
      res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
      return res.status(200).json({ ok: true, phase, tallies });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, message: "Method Not Allowed" });
    }

    // ----- 投票 -----
    if (phase !== "open") {
      return res.status(403).json({
        ok: false,
        message: phase === "before" ? "投票は11月1日から始まります。" : "投票は締め切りました。",
      });
    }

    let body;
    try {
      body = await readBody(req);
    } catch {
      return res.status(400).json({ ok: false, message: "送信内容を読み取れませんでした。" });
    }

    const name = cleanName(body.name);
    if (!name || name.length > 32) {
      return res.status(400).json({ ok: false, message: "キャラクター名は1〜32文字で入力してください。" });
    }
    const picks = CATEGORIES.map((c) => [c, String(body[c] || "")]);
    if (picks.some(([, id]) => !ID_RE.test(id))) {
      return res.status(400).json({ ok: false, message: "各部門の商品を1つずつ選んでください。" });
    }

    const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
    const ipHash = crypto
      .createHash("sha256")
      .update(`${process.env.VOTE_SALT || "gog-anniv"}:${ip}`)
      .digest("hex")
      .slice(0, 32);

    // 同じ回線からの投票数（food の行数＝投票したキャラ数）
    const c = await fetch(
      `${rest}/anniv_votes?select=id&category=eq.food&ip_hash=eq.${ipHash}&limit=${MAX_PER_IP}`,
      { headers }
    );
    if (!c.ok) throw new Error(`count ${c.status}`);
    if ((await c.json()).length >= MAX_PER_IP) {
      return res.status(429).json({ ok: false, message: "この回線からの投票数が上限に達しました。" });
    }

    const voterKey = name.toLowerCase();
    const rows = picks.map(([category, candidate_id]) => ({
      voter_name: name,
      voter_key: voterKey,
      category,
      candidate_id,
      ip_hash: ipHash,
    }));
    const r = await fetch(`${rest}/anniv_votes`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(rows),
    });
    if (r.status === 409) {
      return res.status(409).json({ ok: false, message: "このキャラクター名はすでに投票済みです。" });
    }
    if (!r.ok) throw new Error(`insert ${r.status} ${await r.text()}`);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("vote api:", err);
    return res.status(500).json({ ok: false, message: "投票を受け付けられませんでした。時間をおいてもう一度お試しください。" });
  }
}
