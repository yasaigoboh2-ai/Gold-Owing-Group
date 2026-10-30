// GOG 1周年 人気投票（Supabase Edge Function: anniv-vote）
//   GET  /functions/v1/anniv-vote  … 集計 { ok, phase, tallies: [{ category, candidate_id, votes }] }
//   POST /functions/v1/anniv-vote  … { code, redirect_uri, food, drink, gift } で投票
//   ?test=1（GET）/ test:true（POST）… テスト投票。11/1 0:00 より前だけ受け付け、本番の票とは別に保存・集計する
//
// 1人1回：Discordで本人確認し、Discordアカウント1つにつき各部門1票。
//   HP → Discordの認可画面 → HPに code が戻る → この窓口が code を Discord に渡して本人を確認 → 記録
//   Discordの秘密キー（DISCORD_CLIENT_SECRET）は Edge Function の Secrets に保存し、ブラウザには出さない。
//
// HPから鍵なしで呼べる公開窓口なので verify_jwt=false でデプロイし、検証はこの中で行う。

// 日程を変えるときは js/anniv-data.js も合わせて変える
const VOTE_START = Date.parse("2026-11-01T00:00:00+09:00");
const VOTE_END = Date.parse("2026-11-08T00:00:00+09:00"); // 11/7 23:59 まで
const FORCE_OPEN = false; // 動作テストのときだけ true にしてデプロイ
// テスト投票：本番開始までの間だけ受け付ける（本番の集計・1人1回には影響しない）
const TEST_UNTIL = VOTE_START;

// Discord アプリの Client ID（公開してよい値）。js/anniv-data.js と同じにする
const DISCORD_CLIENT_ID = "1565500993578336306";
// 投票直前に作った捨てアカウントを防ぐ：この日時より後に作られたDiscordアカウントは投票不可
const ACCOUNT_CREATED_BEFORE = Date.parse("2026-10-25T00:00:00+09:00");
// Discordの認可画面から戻ってくるHPのURL（Discord側にも同じものを登録する）
const REDIRECT_URIS = [
  "https://gold-owing-group.vercel.app/",
  "https://yasaigoboh2-ai.github.io/Gold-Owing-Group/",
];

const CATEGORIES = ["food", "drink", "gift"]; // 食べ物・飲み物・Dear.630（3部門とも必須）
const ID_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;
const MAX_PER_IP = 3; // 同じ回線から投票できるDiscordアカウント数（同居・家族向けの余裕）
const DISCORD_API = "https://discord.com/api/v10";

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
    .trim()
    .slice(0, 32);

const sha256 = async (text: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

// Discord のIDから、アカウントが作られた日時を取り出す
const discordCreatedAt = (id: string) => Number((BigInt(id) >> 22n) + 1420070400000n);

const secretKey = () => {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    if (keys.default) return keys.default as string;
  } catch { /* 旧形式へ */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
};

type DiscordUser = { id: string; username?: string; global_name?: string | null };

// code を Discord に渡して、投票した本人の Discord アカウントを確かめる
async function verifyDiscord(code: string, redirectUri: string): Promise<DiscordUser | null> {
  const secret = Deno.env.get("DISCORD_CLIENT_SECRET") || "";
  const tok = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: DISCORD_CLIENT_ID,
      client_secret: secret,
    }),
  });
  if (!tok.ok) {
    console.warn("discord token:", tok.status, await tok.text());
    return null;
  }
  const { access_token } = await tok.json();
  if (!access_token) return null;

  const me = await fetch(`${DISCORD_API}/users/@me`, { headers: { Authorization: `Bearer ${access_token}` } });
  const user = me.ok ? ((await me.json()) as DiscordUser) : null;

  // 使い終わったトークンはすぐ無効にする（失敗しても投票には影響させない）
  fetch(`${DISCORD_API}/oauth2/token/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: access_token, token_type_hint: "access_token", client_id: DISCORD_CLIENT_ID, client_secret: secret }),
  }).catch(() => {});

  return user && /^\d{5,25}$/.test(String(user.id)) ? user : null;
}

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
  const testOpen = now < TEST_UNTIL;

  try {
    // ----- 集計 -----
    if (req.method === "GET") {
      const isTest = new URL(req.url).searchParams.has("test");
      if (isTest ? !testOpen : phase === "before") return json(200, { ok: true, phase: isTest ? "test-closed" : phase, tallies: [] });
      const r = await fetch(`${rest}/anniv_vote_tally?select=category,candidate_id,votes&is_test=eq.${isTest}`, { headers: db });
      if (!r.ok) throw new Error(`tally ${r.status} ${await r.text()}`);
      return json(200, { ok: true, phase: isTest ? "test" : phase, tallies: await r.json() }, { "Cache-Control": "public, max-age=20" });
    }

    if (req.method !== "POST") return json(405, { ok: false, message: "Method Not Allowed" }, { Allow: "GET, POST" });

    // ----- 投票 -----
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json(400, { ok: false, message: "送信内容を読み取れませんでした。" });
    }
    const isTest = body.test === true;
    if (isTest && !testOpen) {
      return json(403, { ok: false, message: "テスト投票は終了しました。本番の投票ページから投票してください。" });
    }
    if (!isTest && phase !== "open") {
      return json(403, {
        ok: false,
        message: phase === "before" ? "投票は11月1日から始まります。" : "投票は締め切りました。",
      });
    }
    if (!DISCORD_CLIENT_ID || !Deno.env.get("DISCORD_CLIENT_SECRET")) {
      return json(503, { ok: false, message: "投票の準備中です。時間をおいてお試しください。" });
    }

    const picks = CATEGORIES.map((c) => [c, String(body[c] ?? "")] as const);
    if (picks.some(([, id]) => !ID_RE.test(id))) {
      return json(400, { ok: false, message: "各部門の商品を1つずつ選んでください。" });
    }
    const code = String(body.code ?? "");
    const redirectUri = String(body.redirect_uri ?? "");
    if (!/^[A-Za-z0-9._~-]{10,200}$/.test(code) || !REDIRECT_URIS.includes(redirectUri)) {
      return json(400, { ok: false, message: "Discordでの確認をやり直してください。" });
    }

    const user = await verifyDiscord(code, redirectUri);
    if (!user) {
      return json(401, { ok: false, message: "Discordでの確認ができませんでした。もう一度お試しください。" });
    }
    if (discordCreatedAt(user.id) >= ACCOUNT_CREATED_BEFORE) {
      return json(403, { ok: false, message: "作られて間もないDiscordアカウントでは投票できません。" });
    }

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    // 合言葉は公開されていない秘密キーから作る（IPを元に戻せないように）
    const ipHash = (await sha256(`${await sha256(`anniv-ip:${key}`)}:${ip}`)).slice(0, 32);
    const voterKey = `discord:${user.id}`;

    // 同じ回線から、別のDiscordアカウントでの投票が多すぎないか
    const c = await fetch(
      `${rest}/anniv_votes?select=voter_key&category=eq.food&is_test=eq.${isTest}&ip_hash=eq.${ipHash}&voter_key=neq.${encodeURIComponent(voterKey)}&limit=${MAX_PER_IP}`,
      { headers: db },
    );
    if (!c.ok) throw new Error(`count ${c.status} ${await c.text()}`);
    if ((await c.json()).length >= MAX_PER_IP) {
      return json(429, { ok: false, message: "この回線からの投票数が上限に達しました。" });
    }

    const rows = picks.map(([category, candidate_id]) => ({
      voter_name: cleanName(user.global_name || user.username) || user.id,
      voter_key: voterKey,
      category,
      candidate_id,
      ip_hash: ipHash,
      is_test: isTest,
    }));
    const r = await fetch(`${rest}/anniv_votes`, {
      method: "POST",
      headers: { ...db, Prefer: "return=minimal" },
      body: JSON.stringify(rows),
    });
    if (r.status === 409) {
      return json(409, { ok: false, message: isTest ? "このDiscordアカウントはすでにテスト投票済みです。" : "このDiscordアカウントはすでに投票済みです。" });
    }
    if (!r.ok) throw new Error(`insert ${r.status} ${await r.text()}`);

    return json(200, { ok: true, test: isTest, name: rows[0].voter_name });
  } catch (err) {
    console.error("anniv-vote:", err);
    return json(500, { ok: false, message: "投票を受け付けられませんでした。時間をおいてもう一度お試しください。" });
  }
}

Deno.serve(handle);
