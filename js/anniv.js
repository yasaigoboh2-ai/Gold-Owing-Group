// ===== 1周年 人気投票 =====
(() => {
  const root = document.querySelector("[data-vote-form]");
  const cfg = window.GOG_ANNIV?.vote;
  if (!root || !cfg) return;

  const params = new URLSearchParams(location.search);
  const sample = params.has("sample");
  const PENDING_KEY = "gog_anniv_vote_pending";
  // ?test=1：見本の候補で、本物のDiscord確認〜送信まで試す（受け付けるかはサーバーが決める）
  let pendingTest = false;
  try { pendingTest = params.has("code") && !!JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null")?.test; } catch {}
  const test = params.has("test") || pendingTest;
  const candidates = sample || test ? window.GOG_ANNIV_SAMPLE || [] : cfg.candidates || [];
  const logos = window.GOG_ANNIV.storeLogos || {};
  const VOTED_KEY = test ? "gog_anniv_vote_test" : "gog_anniv_vote_2026";
  const API = cfg.api || "/api/vote";
  // Discordから戻ってくるURL（Discordのアプリ設定にも同じものを登録する）
  const REDIRECT_URI = location.origin + location.pathname.replace(/index\.html$/, "");

  const start = Date.parse(cfg.start);
  const end = Date.parse(cfg.end);
  const phaseNow = () => {
    const forced = params.get("phase");
    if (sample && ["before", "open", "closed"].includes(forced)) return forced;
    if (test) return "open";
    const now = Date.now();
    return now < start ? "before" : now < end ? "open" : "closed";
  };

  const fmt = (ms, withTime) => {
    const d = new Date(ms + 9 * 3600e3);
    const md = `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
    return withTime ? `${md} ${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, "0")}` : md;
  };

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const storage = {
    get() { try { return localStorage.getItem(VOTED_KEY); } catch { return null; } },
    set() { try { localStorage.setItem(VOTED_KEY, "1"); } catch {} },
  };
  const pending = {
    get() { try { return JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null"); } catch { return null; } },
    set(v) { try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(v)); } catch {} },
    clear() { try { sessionStorage.removeItem(PENDING_KEY); } catch {} },
  };
  const randomState = () => {
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const state = $("[data-vote-state]");
  const cats = $("[data-vote-cats]");
  const submit = $("[data-vote-submit]");
  const msg = $("[data-vote-msg]");
  const results = $("[data-results]");

  // ----- 候補を描画 -----
  cfg.categories.forEach((cat) => {
    const fs = el("fieldset", "vote-cat");
    const lg = el("legend");
    lg.append(el("b", null, cat.label), el("small", null, cat.en));
    fs.append(lg);

    const list = candidates.filter((c) => c.category === cat.id);
    if (!list.length) {
      fs.append(el("p", "cands-empty", "候補の商品は近日公開します。"));
    } else {
      // 店舗ごとにまとめる（店の並びは storeLogos の順）
      const order = Object.keys(logos);
      const stores = [...new Set(list.map((c) => c.store))].sort((a, b) => order.indexOf(a) - order.indexOf(b));
      stores.forEach((store) => {
        const group = el("div", "cand-group");
        const head = el("p", "cand-group-head");
        const logo = el("img");
        logo.src = logos[store] || "assets/logo-gog.webp";
        logo.alt = "";
        logo.loading = "lazy";
        if (store === "Silent735") logo.style.filter = "invert(1)";
        head.append(logo, el("span", null, store));
        group.append(head);

        const wrap = el("div", "cands");
        list.filter((c) => c.store === store).forEach((c) => {
          const label = el("label", "cand");
          const input = el("input");
          input.type = "radio";
          input.name = cat.id;
          input.value = c.id;
          const body = el("span", "cand-body" + (c.image ? " has-img" : ""));
          if (c.image) {
            const img = el("img", "cand-img");
            img.src = c.image;
            img.alt = "";
            img.loading = "lazy";
            body.append(img);
          }
          const txt = el("span", "cand-text");
          txt.append(el("span", "cand-name", c.name));
          if (c.period) txt.append(el("span", "cand-store", c.period));
          body.append(txt, el("span", "cand-check"));
          label.append(input, body);
          wrap.append(label);
        });
        group.append(wrap);
        fs.append(group);
      });
    }
    cats.append(fs);
  });

  // ----- 選んだ商品をボタンの上に表示（候補が多くて離れているため） -----
  const picked = $("[data-vote-picked]");
  const showPicked = () => {
    if (!picked) return;
    const fd = new FormData(root);
    picked.textContent = "";
    cfg.categories.forEach((cat, i) => {
      const c = candidates.find((x) => x.id === fd.get(cat.id));
      if (i) picked.append("　");
      picked.append(`${cat.label.replace("部門", "")}：`);
      picked.append(el("b", null, c ? c.name : "未選択"));
    });
  };
  root.addEventListener("change", showPicked);

  // ----- 受付状態 -----
  const applyPhase = () => {
    const phase = phaseNow();
    const voted = !!storage.get();
    const open = phase === "open" && !voted && candidates.length > 0 && (!!cfg.discordClientId || sample);

    root.querySelectorAll("input").forEach((i) => (i.disabled = !open));
    submit.disabled = !open;

    showPicked();
    if (phase === "before") state.textContent = `投票は${fmt(start, true)}から始まります`;
    else if (phase === "open" && voted) state.textContent = "投票ありがとうございました。結果発表をお待ちください";
    else if (phase === "open") state.textContent = `投票受付中です（${fmt(end - 60e3, true)}まで）`;
    else state.textContent = "投票は締め切りました。結果は下のとおりです";

    return phase;
  };

  // ----- 集計の表示 -----
  const sampleTallies = () =>
    candidates.map((c, i) => ({ category: c.category, candidate_id: c.id, votes: [38, 24, 17, 9, 31, 27, 12, 6][i % 8] }));

  const renderResults = (tallies, phase) => {
    const grid = $("[data-results-grid]");
    grid.textContent = "";
    $("[data-results-title]").textContent = phase === "closed" ? "投票結果" : "途中経過";
    $("[data-results-sub]").textContent =
      phase === "closed" ? `1位の商品を${cfg.resale}に再販売します` : "1分ごとに更新されます";

    cfg.categories.forEach((cat) => {
      const rows = candidates
        .filter((c) => c.category === cat.id)
        .map((c) => ({
          ...c,
          votes: tallies.find((t) => t.category === cat.id && t.candidate_id === c.id)?.votes || 0,
        }))
        .sort((a, b) => b.votes - a.votes);
      if (!rows.length) return;

      const max = rows[0].votes;
      const LIMIT = 10; // 各部門、上位10位まで表示
      let pos = 0;
      rows.forEach((r, i) => {
        if (i === 0 || r.votes !== rows[i - 1].votes) pos = i + 1;
        r.pos = pos;
      });
      const box = el("div");
      box.append(el("p", "rank-cat", cat.label));
      const ol = el("ol", "rank");
      rows.filter((r) => r.pos <= LIMIT).forEach((r) => {
        const li = el("li");
        if (r.pos === 1 && max > 0) li.classList.add("is-top");
        const name = el("span", "rank-name", r.name);
        name.append(el("small", "rank-store", r.store));
        if (phase === "closed" && r.pos === 1 && max > 0) name.append(el("span", "rank-win", "再販売決定"));
        const bar = el("span", "rank-bar");
        const fill = el("i");
        bar.append(fill);
        const mid = el("div");
        mid.append(name, bar);
        const thumb = el("img", "rank-img");
        thumb.src = r.image || logos[r.store] || "assets/logo-gog.webp";
        thumb.alt = "";
        thumb.loading = "lazy";
        li.append(el("span", "rank-pos", String(r.pos)), thumb, mid, el("span", "rank-votes", `${r.votes}票`));
        ol.append(li);
        requestAnimationFrame(() => fill.style.setProperty("--w", max ? `${(r.votes / max) * 100}%` : "0%"));
      });
      box.append(ol);
      const rest = rows.filter((r) => r.pos > LIMIT).length;
      if (rest) box.append(el("p", "rank-more", `ほか${rest}品`));
      grid.append(box);
    });
    results.hidden = !grid.children.length;
  };

  const loadResults = async () => {
    const phase = applyPhase();
    if (phase === "before" || !candidates.length) {
      results.hidden = true;
      return;
    }
    if (sample) return renderResults(sampleTallies(), phase);
    try {
      const res = await fetch(API, { headers: { Accept: "application/json" } });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.message || res.status);
      renderResults(j.tallies || [], phase);
    } catch (err) {
      console.warn("vote results:", err);
    }
  };

  // ----- 投票：① 選んだ商品を覚えて Discord の確認画面へ -----
  const fail = (text) => {
    msg.className = "vote-msg is-err";
    msg.textContent = text;
  };

  root.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.className = "vote-msg";
    msg.textContent = "";

    const fd = new FormData(root);
    const picks = Object.fromEntries(cfg.categories.map((c) => [c.id, fd.get(c.id)]));
    const missing = cfg.categories.filter((c) => !picks[c.id]).map((c) => c.label);
    if (missing.length) return fail(`${missing.join("と")}の商品を選んでください。`);

    if (sample) {
      msg.className = "vote-msg is-ok";
      msg.textContent = "（見本表示のため、Discordには移動しません）";
      return;
    }

    const st = randomState();
    pending.set({ state: st, picks, at: Date.now(), test });
    const q = new URLSearchParams({
      response_type: "code",
      client_id: cfg.discordClientId,
      scope: "identify",
      redirect_uri: REDIRECT_URI,
      state: st,
      prompt: "none",
    });
    submit.disabled = true;
    msg.className = "vote-msg";
    msg.textContent = "Discordの確認画面に移動します…";
    location.href = `https://discord.com/oauth2/authorize?${q}`;
  });

  // ----- 投票：② Discord から戻ってきたら投票を送る -----
  const finishDiscord = async () => {
    const q = new URLSearchParams(location.search);
    const code = q.get("code");
    const err = q.get("error");
    const st = q.get("state");
    if (!code && !err) return;

    // URLから code を消して、投票の場所に戻す
    history.replaceState(null, "", location.pathname + "#vote");
    document.getElementById("vote")?.scrollIntoView();

    const p = pending.get();
    pending.clear();

    if (err) return fail("Discordでの確認がキャンセルされました。投票するには、もう一度ボタンを押してください。");
    if (!p || p.state !== st || Date.now() - p.at > 10 * 60e3) {
      return fail("確認の有効期限が切れました。商品を選び直して、もう一度ボタンを押してください。");
    }

    // 選んでいた商品を表示に戻す
    Object.entries(p.picks).forEach(([cat, id]) => {
      const input = root.querySelector(`input[name="${cat}"][value="${CSS.escape(String(id))}"]`);
      if (input) input.checked = true;
    });

    submit.disabled = true;
    msg.className = "vote-msg";
    msg.textContent = "Discordで確認しています…";
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirect_uri: REDIRECT_URI, ...p.picks }),
      });
      let j = {};
      try { j = await res.json(); } catch {}

      if (res.ok && j.ok) {
        storage.set();
        msg.className = "vote-msg is-ok";
        msg.textContent = "投票しました。ありがとうございます。";
        loadResults();
        return;
      }
      if (res.status === 409) storage.set();
      fail(j.message || "投票を受け付けられませんでした。時間をおいてもう一度お試しください。");
    } catch {
      fail("送信できませんでした。通信状況を確認して、もう一度お試しください。");
    }
    applyPhase();
  };

  loadResults().then(finishDiscord);
  setInterval(() => {
    if (phaseNow() === "open" && !document.hidden) loadResults();
  }, 60e3);
})();
