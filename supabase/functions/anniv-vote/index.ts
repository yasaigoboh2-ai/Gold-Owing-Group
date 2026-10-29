// GOG 1周年 人気投票（Supabase Edge Function: anniv-vote）
//   GET  /functions/v1/anniv-vote  … 集計 { ok, phase, tallies: [{ category, candidate_id, votes }] }
//   POST /functions/v1/anniv-vote  … { name, food, drink } で投票（1キャラ名につき各部門1票）
//
// HPから鍵なしで呼べる公開窓口なので verify_jwt=false でデプロイし、検証はこの中で行う。
// DBへの書き込みは Supabase が自動で渡す秘密キーで行う（ブラウザには出ない）。

// 日程を変えるときは js/anniv-data.js も合わせて変える
const VOTE_START = Date.parse("2026-11-01T00:00:00+09:00");
const VOTE_END = Date.parse("2026-11-08T00:00:00+09:00"); // 11/7 23:59 まで
const FORCE_OPEN = false; // 動作テストのときだけ true にしてデプロイ
const CATEGORIES = ["food", "drink"];
const ID_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;
const MAX_PER_IP = 3; // 同じ回線から投票できるキャラ数
const SALT = "gog-anniv-2026";

const ALLOWED_ORIGINS = [
  "https://gold-owing-group.vercel.app",
  "https://yasaigoboh2-ai.github.io",
];
const isAllowedOrigin = (o: string) =>
  ALLOWED_ORIGINS.includes(o) ||
  /^https:\/\/gold-owing-group-[a-z0-9-]+\.vercel\.app$/.test(o) ||
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);

const cleanName = (s: unknown) =>
  String(s ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const sha256 = async (text: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

const secretKey = () => {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    if (keys.default) return keys.default as string;
  } catch { /* 旧形式へ */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
};

export async function handle(req: Request): Promise<Response> {
  const origin = req.headers.get("origin") || "";
  const cors: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (isAllowedOrigin(origin)) cors["Access-Control-Allow-Origin"] = origin;

  const json = (status: number, body: unknown, extra: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8", ...cors, ...extra },
    });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const url = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
  const key = secretKey();
  if (!url || !key) return json(503, { ok: false, message: "投票の準備中です。時間をおいてお試しください。" });

  const rest = `${url}/rest/v1`;
  const db: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (!key.startsWith("sb_")) db.Authorization = `Bearer ${key}`; // 旧形式（JWT）のキーのときだけ

  const now = Date.now();
  const phase = FORCE_OPEN ? "open" : now < VOTE_START ? "before" : now < VOTE_END ? "open" : "closed";

  try {
    // ----- 集計 -----
    if (req.method === "GET") {
      if (phase === "before") return json(200, { ok: true, phase, tallies: [] });
      const r = await fetch(`${rest}/anniv_vote_tally?select=category,candidate_id,votes`, { headers: db });
      if (!r.ok) throw new Error(`tally ${r.status} ${await r.text()}`);
      return json(200, { ok: true, phase, tallies: await r.json() }, { "Cache-Control": "public, max-age=20" });
    }

    if (req.method !== "POST") return json(405, { ok: false, message: "Method Not Allowed" }, { Allow: "GET, POST" });

    // ----- 投票 -----
    if (phase !== "open") {
      return json(403, {
        ok: false,
        message: phase === "before" ? "投票は11月1日から始まります。" : "投票は締め切りました。",
      });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json(400, { ok: false, message: "送信内容を読み取れませんでした。" });
    }

    const name = cleanName(body.name);
    if (!name || name.length > 32) {
      return json(400, { ok: false, message: "キャラクター名は1〜32文字で入力してください。" });
    }
    const picks = CATEGORIES.map((c) => [c, String(body[c] ?? "")] as const);
    if (picks.some(([, id]) => !ID_RE.test(id))) {
      return json(400, { ok: false, message: "各部門の商品を1つずつ選んでください。" });
    }

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    const ipHash = (await sha256(`${SALT}:${ip}`)).slice(0, 32);

    const c = await fetch(
      `${rest}/anniv_votes?select=id&category=eq.food&ip_hash=eq.${ipHash}&limit=${MAX_PER_IP}`,
      { headers: db },
    );
    if (!c.ok) throw new Error(`count ${c.status} ${await c.text()}`);
    if ((await c.json()).length >= MAX_PER_IP) {
      return json(429, { ok: false, message: "この回線からの投票数が上限に達しました。" });
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
      headers: { ...db, Prefer: "return=minimal" },
      body: JSON.stringify(rows),
    });
    if (r.status === 409) return json(409, { ok: false, message: "このキャラクター名はすでに投票済みです。" });
    if (!r.ok) throw new Error(`insert ${r.status} ${await r.text()}`);

    return json(200, { ok: true });
  } catch (err) {
    console.error("anniv-vote:", err);
    return json(500, { ok: false, message: "投票を受け付けられませんでした。時間をおいてもう一度お試しください。" });
  }
}

Deno.serve(handle);
