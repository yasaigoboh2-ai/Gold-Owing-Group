// ===== 1周年 人気投票 =====
(() => {
  const root = document.querySelector("[data-vote-form]");
  const cfg = window.GOG_ANNIV?.vote;
  if (!root || !cfg) return;

  const params = new URLSearchParams(location.search);
  const sample = params.has("sample");
  const candidates = sample ? window.GOG_ANNIV_SAMPLE || [] : cfg.candidates || [];
  const logos = window.GOG_ANNIV.storeLogos || {};
  const VOTED_KEY = "gog_anniv_vote_2026";

  const start = Date.parse(cfg.start);
  const end = Date.parse(cfg.end);
  const phaseNow = () => {
    const forced = params.get("phase");
    if (sample && ["before", "open", "closed"].includes(forced)) return forced;
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

  const state = $("[data-vote-state]");
  const cats = $("[data-vote-cats]");
  const submit = $("[data-vote-submit]");
  const msg = $("[data-vote-msg]");
  const nameInput = root.querySelector('input[name="name"]');
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
      const wrap = el("div", "cands");
      list.forEach((c) => {
        const label = el("label", "cand");
        const input = el("input");
        input.type = "radio";
        input.name = cat.id;
        input.value = c.id;
        const body = el("span", "cand-body");
        const img = el("img", "cand-img");
        img.src = c.image || logos[c.store] || "assets/logo-gog.webp";
        img.alt = "";
        img.loading = "lazy";
        if (!c.image && c.store === "Silent735") img.style.filter = "invert(1)";
        const txt = el("span");
        txt.append(el("span", "cand-name", c.name), el("span", "cand-store", c.store));
        body.append(img, txt, el("span", "cand-check"));
        label.append(input, body);
        wrap.append(label);
      });
      fs.append(wrap);
    }
    cats.append(fs);
  });

  // ----- 受付状態 -----
  const applyPhase = () => {
    const phase = phaseNow();
    const voted = !!storage.get();
    const open = phase === "open" && !voted && candidates.length > 0;

    root.querySelectorAll("input").forEach((i) => (i.disabled = !open));
    submit.disabled = !open;

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
      const box = el("div");
      box.append(el("p", "rank-cat", cat.label));
      const ol = el("ol", "rank");
      let pos = 0;
      let prev = null;
      rows.forEach((r, i) => {
        if (r.votes !== prev) pos = i + 1;
        prev = r.votes;
        const li = el("li");
        if (pos === 1 && max > 0) li.classList.add("is-top");
        const name = el("span", "rank-name", r.name);
        if (phase === "closed" && pos === 1 && max > 0) name.append(el("span", "rank-win", "再販売決定"));
        const bar = el("span", "rank-bar");
        const fill = el("i");
        bar.append(fill);
        const mid = el("div");
        mid.append(name, bar);
        li.append(el("span", "rank-pos", String(pos)), mid, el("span", "rank-votes", `${r.votes}票`));
        ol.append(li);
        requestAnimationFrame(() => fill.style.setProperty("--w", max ? `${(r.votes / max) * 100}%` : "0%"));
      });
      box.append(ol);
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
      const res = await fetch("/api/vote", { headers: { Accept: "application/json" } });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j?.message || res.status);
      renderResults(j.tallies || [], phase);
    } catch (err) {
      console.warn("vote results:", err);
    }
  };

  // ----- 投票の送信 -----
  root.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.className = "vote-msg";
    msg.textContent = "";

    const fd = new FormData(root);
    const name = (fd.get("name") || "").toString().trim();
    const picks = Object.fromEntries(cfg.categories.map((c) => [c.id, fd.get(c.id)]));
    const missing = cfg.categories.filter((c) => !picks[c.id]).map((c) => c.label);

    const fail = (text) => {
      msg.classList.add("is-err");
      msg.textContent = text;
    };
    if (missing.length) return fail(`${missing.join("と")}の商品を選んでください。`);
    if (!name) {
      nameInput.focus();
      return fail("キャラクター名を入力してください。");
    }

    if (sample) {
      msg.classList.add("is-ok");
      msg.textContent = "（見本表示のため送信していません）";
      return;
    }

    submit.disabled = true;
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ...picks }),
      });
      let j = {};
      try { j = await res.json(); } catch {}

      if (res.ok && j.ok) {
        storage.set();
        msg.classList.add("is-ok");
        msg.textContent = "投票しました。ありがとうございます。";
        loadResults();
        return;
      }
      fail(j.message || "投票を受け付けられませんでした。時間をおいてもう一度お試しください。");
    } catch {
      fail("送信できませんでした。通信状況を確認して、もう一度お試しください。");
    }
    applyPhase();
  });

  loadResults();
  setInterval(() => {
    if (phaseNow() === "open" && !document.hidden) loadResults();
  }, 60e3);
})();
