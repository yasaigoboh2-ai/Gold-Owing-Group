// ===== 日本時間の「今日」 =====
const jstToday = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

// ===== Footer year =====
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// ===== Mobile menu =====
(() => {
  const burger = document.querySelector("[data-burger]");
  const drawer = document.querySelector("[data-drawer]");
  if (!burger || !drawer) return;

  const setOpen = (open) => {
    drawer.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.textContent = open ? "閉じる" : "メニュー";
  };

  burger.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(burger.getAttribute("aria-expanded") !== "true");
  });
  drawer.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("click", (e) => {
    if (!drawer.contains(e.target) && !burger.contains(e.target)) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) {
      setOpen(false);
      burger.focus();
    }
  });
})();

// ===== 店舗プルダウン：外側クリック・Escで閉じる =====
(() => {
  const menu = document.querySelector("[data-nav-stores]");
  if (!menu) return;
  document.addEventListener("click", (e) => {
    if (menu.open && !menu.contains(e.target)) menu.open = false;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.open) {
      menu.open = false;
      menu.querySelector("summary")?.focus();
    }
  });
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) menu.open = false;
  });
})();

// ===== Scroll reveal（店舗ページ） =====
(() => {
  const targets = document.querySelectorAll("[data-animate]");
  if (!targets.length) return;
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-inview"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-inview");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  targets.forEach((el) => io.observe(el));
})();

// ===== 最後の夜までのカウント・日程の既読化 =====
(() => {
  const today = jstToday();
  const LAST = "2026-11-30";

  const num = document.querySelector("[data-nights-left]");
  if (num) {
    const box = num.closest(".countdown");
    const label = box?.querySelector(".countdown-label");
    const days = Math.round((Date.parse(LAST) - Date.parse(today)) / 864e5);
    if (days > 0) {
      num.textContent = days;
    } else if (label) {
      label.textContent = days === 0 ? "今夜が、最後の夜です" : "1年間、ありがとうございました";
      num.parentElement.hidden = true;
    }
  }

  document.querySelectorAll("[data-schedule] li[data-date]").forEach((li) => {
    if (li.dataset.date < today) li.classList.add("is-past");
  });
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

  openBtn.addEventListener("click", openModal);
  closeBtns.forEach((btn) => btn.addEventListener("click", closeModal));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
      closeModal();
    }
  });

  // 店舗名（Webhook振り分け用）
  const resolvePageName = () => {
    if (document.body?.dataset?.page) return document.body.dataset.page;
    if (document.body.classList.contains("page-restaurant")) return "Restaurant420";
    if (document.body.classList.contains("page-wedding")) return "WEDDING525";
    return document.title || "GOG";
  };

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
