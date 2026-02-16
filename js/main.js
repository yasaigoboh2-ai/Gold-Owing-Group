// ===== Footer year =====
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// ===== Mobile menu (burger) =====
(() => {
  const burger = document.querySelector("[data-burger]");
  const drawer = document.querySelector("[data-drawer]");
  if (!burger || !drawer) return;

  const open = () => {
    drawer.style.display = "block";
    drawer.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
  };

  const close = () => {
    drawer.style.display = "none";
    drawer.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
  };

  const toggle = () => {
    const expanded = burger.getAttribute("aria-expanded") === "true";
    expanded ? close() : open();
  };

  burger.addEventListener("click", (e) => {
    e.stopPropagation();
    toggle();
  });

  drawer.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) close();
  });

  document.addEventListener("click", (e) => {
    const isInside = drawer.contains(e.target) || burger.contains(e.target);
    if (!isInside) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();

// ===== Scroll reveal =====
(() => {
  const targets = document.querySelectorAll("[data-animate]");
  if (!targets.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-inview");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  targets.forEach((el) => io.observe(el));
})();

// ===== Reservation modal + submit -> API =====
(() => {
  const modal = document.querySelector("[data-reservation-modal]");
  const openBtn = document.querySelector("[data-open-reservation]");
  const closeBtns = document.querySelectorAll("[data-close-reservation]");
  const form = document.querySelector("[data-reservation-form]");

  // そのページに予約UIが無ければ何もしない
  if (!modal || !openBtn || !form) return;

  const openModal = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  // open / close
  openBtn.addEventListener("click", openModal);
  closeBtns.forEach((btn) => btn.addEventListener("click", closeModal));

  // ESCで閉じる
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
      closeModal();
    }
  });

  // 店舗名（Webhook振り分け用）
  const resolvePageName = () => {
    // ✅ 最優先：<body data-page="WEDDING525"> みたいに決め打ち
    if (document.body?.dataset?.page) return document.body.dataset.page;

    // 次点：クラス判定（保険）
    if (document.body.classList.contains("page-restaurant")) return "Restaurant420";
    if (document.body.classList.contains("page-wedding")) return "WEDDING525";

    // 最後：title
    return document.title || "GOG";
  };

  // submit -> your API
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const payload = {
      name: (fd.get("name") || "").toString().trim(),
      contact: (fd.get("contact") || "").toString().trim(),
      datetime: (fd.get("datetime") || "").toString().trim(),
      people: Number(fd.get("people") || 0),
      note: (fd.get("note") || "").toString().trim(),
      page: resolvePageName(),
    };

    // 必須チェック
    if (!payload.name || !payload.contact || !payload.datetime || !payload.people) {
      alert("必須項目を入力してください。");
      return;
    }

    try {
      const res = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 失敗時：APIのメッセージも拾う
      if (!res.ok) {
        let detail = "";
        try {
          const j = await res.json();
          detail = j?.message ? `\n\n${j.message}` : "";
        } catch {}
        throw new Error(`Reservation API error (${res.status})${detail}`);
      }

      alert("送信しました！");
      form.reset();
      closeModal();
    } catch (err) {
      console.error(err);
      alert("送信に失敗しました。時間をおいて再度お試しください。");
    }
  });
})();
