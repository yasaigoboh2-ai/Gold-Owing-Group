/* =========================================================
   1周年 人気投票のデータ
   - 日程を変えるときは、api/vote.js の VOTE_START / VOTE_END と
     index.html の「投票期間」表記も合わせて変えてください。
   - 候補の id は投票データのキーになります。投票が始まったら変えないでください。
     使える文字：英小文字・数字・ハイフン（例：food-moonwolf）
   - image は assets/ に置いた画像。空なら店舗ロゴを表示します。
   ========================================================= */
window.GOG_ANNIV = {
  vote: {
    start: "2026-11-01T00:00:00+09:00",
    end: "2026-11-08T00:00:00+09:00", // 11月7日 23:59 まで
    resale: "11月9日〜30日",
    categories: [
      { id: "food", label: "食べ物部門", en: "Food" },
      { id: "drink", label: "飲み物部門", en: "Drink" },
    ],
    candidates: [
      // { id: "food-xxx", category: "food", name: "商品名", store: "Bar105", image: "" },
      // { id: "drink-xxx", category: "drink", name: "商品名", store: "Lounge315", image: "" },
    ],
  },

  storeLogos: {
    "Bar105": "assets/logo-bar105.webp",
    "Club210": "assets/logo-club210.webp",
    "Lounge315": "assets/logo-lounge315.webp",
    "Restaurant420": "assets/logo-restaurant420.webp",
    "WEDDING525": "assets/wedding525-logo.webp",
    "Dear.630": "assets/logo-dear630.webp",
    "Silent735": "assets/logo-silent735.webp",
    "Military840": "assets/logo-military840.webp",
  },
};

/* 見た目確認用の仮データ（URLに ?sample=1 を付けたときだけ使います） */
window.GOG_ANNIV_SAMPLE = [
  { id: "food-ajillo", category: "food", name: "アヒージョ", store: "Bar105" },
  { id: "food-fishchips", category: "food", name: "フィッシュアンドチップス", store: "Bar105" },
  { id: "food-moonwolf", category: "food", name: "ムーンウルフ・デザートプレート", store: "Lounge315" },
  { id: "food-cheese", category: "food", name: "チーズの盛り合わせ", store: "Silent735" },
  { id: "drink-sunrise", category: "drink", name: "テキーラサンライズ", store: "Bar105" },
  { id: "drink-moonhowl", category: "drink", name: "ムーンハウル・カクテル", store: "Lounge315" },
  { id: "drink-signature", category: "drink", name: "シグネチャーカクテル", store: "Silent735" },
  { id: "drink-whisky", category: "drink", name: "季節のウイスキー", store: "Silent735" },
];
