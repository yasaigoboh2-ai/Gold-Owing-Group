/* =========================================================
   1周年 人気投票のデータ
   - 日程を変えるときは、supabase/functions/anniv-vote/index.ts の VOTE_START / VOTE_END と
     index.html の「投票期間」表記も合わせて変えてください。
   - 候補の id は投票データのキーになります。投票が始まったら変えないでください。
     使える文字：英小文字・数字・ハイフン（例：food-moonwolf）
   - image は assets/ に置いた画像。空なら店舗ロゴを表示します。
   ========================================================= */
window.GOG_ANNIV = {
  vote: {
    // 投票の受付（Supabase Edge Function）
    api: "https://wacmbwlypznivloopsaq.supabase.co/functions/v1/anniv-vote",
    // Discord アプリの Client ID（公開してよい値）。Edge Function の DISCORD_CLIENT_ID と同じにする
    discordClientId: "1565500993578336306",
    start: "2026-11-01T00:00:00+09:00",
    end: "2026-11-08T00:00:00+09:00", // 11月7日 23:59 まで
    resale: "11月9日〜30日",
    categories: [
      { id: "food", label: "食べ物部門", en: "Food" },
      { id: "drink", label: "飲み物部門", en: "Drink" },
    ],
    candidates: [
      // 候補リスト（GOG 期間限定メニュー一覧のスプレッドシートより）。画像を付けるときは image: "assets/…" を足す
      // ---- 食べ物部門 ----
      { id: "food-bar-kobachi", category: "food", name: "小鉢三種", store: "Bar105", period: "2026.02", image: "assets/vote/food-bar-kobachi.webp" },
      { id: "food-bar-choco-bonbon", category: "food", name: "チョコレートボンボン", store: "Bar105", period: "2026.02", image: "assets/vote/food-bar-choco-bonbon.webp" },
      { id: "food-bar-kohakuto", category: "food", name: "琥珀糖", store: "Bar105", period: "2026.03", image: "assets/vote/food-bar-kohakuto.webp" },
      { id: "food-bar-waffle-chips", category: "food", name: "ワッフルチップス", store: "Bar105", period: "2026.03", image: "assets/vote/food-bar-waffle-chips.webp" },
      { id: "food-bar-golden-half-crown", category: "food", name: "ゴールデンハーフクラウン", store: "Bar105", period: "2026.05", image: "assets/vote/food-bar-golden-half-crown.webp" },
      { id: "food-bar-cocktail-ramen", category: "food", name: "カクテルラーメン", store: "Bar105", period: "2026.06", image: "assets/vote/food-bar-cocktail-ramen.webp" },
      { id: "food-bar-handcuff-ring", category: "food", name: "イカした手錠リング", store: "Bar105", period: "2026.07", image: "assets/vote/food-bar-handcuff-ring.webp" },
      { id: "food-bar-seafood-somen", category: "food", name: "カクテル海鮮そうめん", store: "Bar105", period: "2026.07", image: "assets/vote/food-bar-seafood-somen.webp" },
      { id: "food-bar-tanabata-sweets", category: "food", name: "七夕スイーツプレート", store: "Bar105", period: "2026.07", image: "assets/vote/food-bar-tanabata-sweets.webp" },
      { id: "food-bar-shio-yakisoba", category: "food", name: "塩だれ屋台焼きそば", store: "Bar105", period: "2026.07", image: "assets/vote/food-bar-shio-yakisoba.webp" },
      { id: "food-bar-white-sea-risotto", category: "food", name: "ホワイトシーリゾット", store: "Bar105", period: "2026.08", image: "assets/vote/food-bar-white-sea-risotto.webp" },
      { id: "food-club-gold-cheese-potato", category: "food", name: "ゴールドチーズポテト", store: "Club210", period: "2026.07", image: "assets/vote/food-club-gold-cheese-potato.webp" },
      { id: "food-club-purple-parfait", category: "food", name: "パープルミステリアスパフェ", store: "Club210", period: "2026.10", image: "assets/vote/food-club-purple-parfait.webp" },
      { id: "food-lounge-brandy-cake", category: "food", name: "ブランデーケーキ", store: "Lounge315", period: "2025.12", image: "assets/vote/food-lounge-brandy-cake.webp" },
      { id: "food-lounge-kiseru-choco", category: "food", name: "キセルチョコ", store: "Lounge315", period: "2025.12", image: "assets/vote/food-lounge-kiseru-choco.webp" },
      { id: "food-lounge-venison-roast", category: "food", name: "鹿肉のロースト ソースペリグー", store: "Lounge315", period: "2026.01", image: "assets/vote/food-lounge-venison-roast.webp" },
      { id: "food-lounge-white-cabbage-roll", category: "food", name: "ホワイトロールキャベツ", store: "Lounge315", period: "2026.02", image: "assets/vote/food-lounge-white-cabbage-roll.webp" },
      { id: "food-lounge-yozakura-sweets", category: "food", name: "夜桜スイーツプレート", store: "Lounge315", period: "2026.04", image: "assets/vote/food-lounge-yozakura-sweets.webp" },
      { id: "food-lounge-fruit-skewer", category: "food", name: "彩りフルーツ串", store: "Lounge315", period: "2026.07", image: "assets/vote/food-lounge-fruit-skewer.webp" },
      { id: "food-lounge-tsukimi-dessert", category: "food", name: "お月見デザートプレート", store: "Lounge315", period: "2026.08", image: "assets/vote/food-lounge-tsukimi-dessert.webp" },
      { id: "food-lounge-moonwolf", category: "food", name: "ムーンウルフデザートプレート", store: "Lounge315", period: "2026.10", image: "assets/vote/food-lounge-moonwolf.webp" },
      { id: "food-silent-black-yakisoba", category: "food", name: "黒い焼きそば", store: "Silent735", period: "2026.07", image: "assets/vote/food-silent-black-yakisoba.webp" },
      // ---- 飲み物部門 ----
      { id: "drink-bar-ruby", category: "drink", name: "ルビィカクテル", store: "Bar105", period: "2025.11", image: "assets/vote/drink-bar-ruby.webp" },
      { id: "drink-bar-amethyst", category: "drink", name: "アメジストカクテル", store: "Bar105", period: "2026.01", image: "assets/vote/drink-bar-amethyst.webp" },
      { id: "drink-bar-shirako-ponzu", category: "drink", name: "白子ポン酢", store: "Bar105", period: "2026.02", image: "assets/vote/drink-bar-shirako-ponzu.webp" },
      { id: "drink-bar-topaz", category: "drink", name: "トパーズカクテル", store: "Bar105", period: "2026.04", image: "assets/vote/drink-bar-topaz.webp" },
      { id: "drink-bar-crown-half", category: "drink", name: "クラウンハーフエディション", store: "Bar105", period: "2026.05", image: "assets/vote/drink-bar-crown-half.webp" },
      { id: "drink-bar-tenteki-mojito", category: "drink", name: "飲む点滴モヒート", store: "Bar105", period: "2026.07", image: "assets/vote/drink-bar-tenteki-mojito.webp" },
      { id: "drink-bar-hoshizora", category: "drink", name: "星空カクテル", store: "Bar105", period: "2026.07", image: "assets/vote/drink-bar-hoshizora.webp" },
      { id: "drink-bar-ramune-bluehawaii", category: "drink", name: "ラムネブルーハワイ", store: "Bar105", period: "2026.07", image: "assets/vote/drink-bar-ramune-bluehawaii.webp" },
      { id: "drink-bar-moon-drop", category: "drink", name: "ムーンドロップ", store: "Bar105", period: "2026.08", image: "assets/vote/drink-bar-moon-drop.webp" },
      { id: "drink-club-cinderella", category: "drink", name: "シンデレラ", store: "Club210", period: "2026.02", image: "assets/vote/drink-club-cinderella.webp" },
      { id: "drink-club-black-snake", category: "drink", name: "ブラックスネークカクテル", store: "Club210", period: "2026.02", image: "assets/vote/drink-club-black-snake.webp" },
      { id: "drink-club-angel", category: "drink", name: "エンジェル", store: "Club210", period: "2026.04", image: "assets/vote/drink-club-angel.webp" },
      { id: "drink-club-neon-blue-soda", category: "drink", name: "ネオンブルーソーダ", store: "Club210", period: "2026.07", image: "assets/vote/drink-club-neon-blue-soda.webp" },
      { id: "drink-club-blood-orange", category: "drink", name: "ブラッドオレンジ シャンパンカクテル", store: "Club210", period: "2026.10", image: "assets/vote/drink-club-blood-orange.webp" },
      { id: "drink-lounge-marron", category: "drink", name: "まろんのカクテル", store: "Lounge315", period: "2026.03", image: "assets/vote/drink-lounge-marron.webp" },
      { id: "drink-lounge-yozakura-rose", category: "drink", name: "夜桜ロゼスパークリング", store: "Lounge315", period: "2026.04", image: "assets/vote/drink-lounge-yozakura-rose.webp" },
      { id: "drink-lounge-hakuto-sparkling", category: "drink", name: "白桃スパークリング", store: "Lounge315", period: "2026.07", image: "assets/vote/drink-lounge-hakuto-sparkling.webp" },
      { id: "drink-lounge-tsukimi", category: "drink", name: "お月見カクテル", store: "Lounge315", period: "2026.08", image: "assets/vote/drink-lounge-tsukimi.webp" },
      { id: "drink-lounge-moonhowl", category: "drink", name: "ムーンハウルカクテル", store: "Lounge315", period: "2026.10", image: "assets/vote/drink-lounge-moonhowl.webp" },
      { id: "drink-silent-midnight-soda", category: "drink", name: "ミッドナイトソーダ", store: "Silent735", period: "2026.07", image: "assets/vote/drink-silent-midnight-soda.webp" },
      { id: "drink-silent-dark-enchant", category: "drink", name: "ダークエンチャント", store: "Silent735", period: "2026.10", image: "assets/vote/drink-silent-dark-enchant.webp" },
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
