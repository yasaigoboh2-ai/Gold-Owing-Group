/* =========================================================
   1周年 人気投票のデータ
   - 日程を変えるときは、supabase/functions/anniv-vote/index.ts の VOTE_START / VOTE_END と
     index.html の「投票期間」表記も合わせて変えてください。
   - 候補の id は投票データのキーになります。投票が始まったら変えないでください。
     使える文字：英小文字・数字・ハイフン（例：food-moonwolf）
   - image は assets/ に置いた画像。空なら店舗ロゴを表示します。
   - name の「|」は、表示で折り返してよい位置です（表示されません）。
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
      { id: "gift", label: "Dear.630部門", en: "Gift" },
    ],
    candidates: [
      // 候補リスト（GOG 期間限定メニュー一覧のスプレッドシートより）。画像を付けるときは image: "assets/…" を足す
      // ---- 食べ物部門 ----
      { id: "food-bar-kobachi", category: "food", name: "小鉢三種", store: "Bar105", period: "2026.02", image: "assets/vote/food-bar-kobachi.webp" },
      { id: "food-bar-choco-bonbon", category: "food", name: "チョコレート|ボンボン", store: "Bar105", period: "2026.02", image: "assets/vote/food-bar-choco-bonbon.webp" },
      { id: "food-bar-kohakuto", category: "food", name: "琥珀糖", store: "Bar105", period: "2026.03", image: "assets/vote/food-bar-kohakuto.webp" },
      { id: "food-bar-waffle-chips", category: "food", name: "ワッフル|チップス", store: "Bar105", period: "2026.03", image: "assets/vote/food-bar-waffle-chips.webp" },
      { id: "food-bar-golden-half-crown", category: "food", name: "ゴールデン|ハーフ|クラウン", store: "Bar105", period: "2026.05", image: "assets/vote/food-bar-golden-half-crown.webp" },
      { id: "food-bar-cocktail-ramen", category: "food", name: "カクテル|ラーメン", store: "Bar105", period: "2026.06", image: "assets/vote/food-bar-cocktail-ramen.webp" },
      { id: "food-bar-handcuff-ring", category: "food", name: "イカした|手錠リング", store: "Bar105", period: "2026.07", image: "assets/vote/food-bar-handcuff-ring.webp" },
      { id: "food-bar-seafood-somen", category: "food", name: "カクテル|海鮮そうめん", store: "Bar105", period: "2026.07", image: "assets/vote/food-bar-seafood-somen.webp" },
      { id: "food-bar-tanabata-sweets", category: "food", name: "七夕|スイーツ|プレート", store: "Bar105", period: "2026.07", image: "assets/vote/food-bar-tanabata-sweets.webp" },
      { id: "food-bar-shio-yakisoba", category: "food", name: "塩だれ|屋台|焼きそば", store: "Bar105", period: "2026.07", image: "assets/vote/food-bar-shio-yakisoba.webp" },
      { id: "food-bar-white-sea-risotto", category: "food", name: "ホワイト|シー|リゾット", store: "Bar105", period: "2026.08", image: "assets/vote/food-bar-white-sea-risotto.webp" },
      { id: "food-club-gold-cheese-potato", category: "food", name: "ゴールド|チーズ|ポテト", store: "Club210", period: "2026.07", image: "assets/vote/food-club-gold-cheese-potato.webp" },
      { id: "food-club-purple-parfait", category: "food", name: "パープル|ミステリアス|パフェ", store: "Club210", period: "2026.10", image: "assets/vote/food-club-purple-parfait.webp" },
      { id: "food-lounge-brandy-cake", category: "food", name: "ブランデー|ケーキ", store: "Lounge315", period: "2025.12", image: "assets/vote/food-lounge-brandy-cake.webp" },
      { id: "food-lounge-kiseru-choco", category: "food", name: "キセルチョコ", store: "Lounge315", period: "2025.12", image: "assets/vote/food-lounge-kiseru-choco.webp" },
      { id: "food-lounge-venison-roast", category: "food", name: "鹿肉の|ロースト ソース|ペリグー", store: "Lounge315", period: "2026.01", image: "assets/vote/food-lounge-venison-roast.webp" },
      { id: "food-lounge-white-cabbage-roll", category: "food", name: "ホワイト|ロール|キャベツ", store: "Lounge315", period: "2026.02", image: "assets/vote/food-lounge-white-cabbage-roll.webp" },
      { id: "food-lounge-yozakura-sweets", category: "food", name: "夜桜|スイーツ|プレート", store: "Lounge315", period: "2026.04", image: "assets/vote/food-lounge-yozakura-sweets.webp" },
      { id: "food-lounge-fruit-skewer", category: "food", name: "彩り|フルーツ串", store: "Lounge315", period: "2026.07", image: "assets/vote/food-lounge-fruit-skewer.webp" },
      { id: "food-lounge-tsukimi-dessert", category: "food", name: "お月見|デザート|プレート", store: "Lounge315", period: "2026.08", image: "assets/vote/food-lounge-tsukimi-dessert.webp" },
      { id: "food-lounge-moonwolf", category: "food", name: "ムーンウルフ|デザート|プレート", store: "Lounge315", period: "2026.10", image: "assets/vote/food-lounge-moonwolf.webp" },
      { id: "food-silent-black-yakisoba", category: "food", name: "黒い焼きそば", store: "Silent735", period: "2026.07", image: "assets/vote/food-silent-black-yakisoba.webp" },
      // ---- 飲み物部門 ----
      { id: "drink-bar-ruby", category: "drink", name: "ルビィ|カクテル", store: "Bar105", period: "2025.11", image: "assets/vote/drink-bar-ruby.webp" },
      { id: "drink-bar-amethyst", category: "drink", name: "アメジスト|カクテル", store: "Bar105", period: "2026.01", image: "assets/vote/drink-bar-amethyst.webp" },
      { id: "drink-bar-shirako-ponzu", category: "drink", name: "白子ポン酢", store: "Bar105", period: "2026.02", image: "assets/vote/drink-bar-shirako-ponzu.webp" },
      { id: "drink-bar-topaz", category: "drink", name: "トパーズ|カクテル", store: "Bar105", period: "2026.04", image: "assets/vote/drink-bar-topaz.webp" },
      { id: "drink-bar-crown-half", category: "drink", name: "クラウン|ハーフ|エディション", store: "Bar105", period: "2026.05", image: "assets/vote/drink-bar-crown-half.webp" },
      { id: "drink-bar-tenteki-mojito", category: "drink", name: "飲む点滴|モヒート", store: "Bar105", period: "2026.07", image: "assets/vote/drink-bar-tenteki-mojito.webp" },
      { id: "drink-bar-hoshizora", category: "drink", name: "星空|カクテル", store: "Bar105", period: "2026.07", image: "assets/vote/drink-bar-hoshizora.webp" },
      { id: "drink-bar-ramune-bluehawaii", category: "drink", name: "ラムネ|ブルーハワイ", store: "Bar105", period: "2026.07", image: "assets/vote/drink-bar-ramune-bluehawaii.webp" },
      { id: "drink-bar-moon-drop", category: "drink", name: "ムーン|ドロップ", store: "Bar105", period: "2026.08", image: "assets/vote/drink-bar-moon-drop.webp" },
      { id: "drink-club-cinderella", category: "drink", name: "シンデレラ", store: "Club210", period: "2026.02", image: "assets/vote/drink-club-cinderella.webp" },
      { id: "drink-club-black-snake", category: "drink", name: "ブラック|スネーク|カクテル", store: "Club210", period: "2026.02", image: "assets/vote/drink-club-black-snake.webp" },
      { id: "drink-club-angel", category: "drink", name: "エンジェル", store: "Club210", period: "2026.04", image: "assets/vote/drink-club-angel.webp" },
      { id: "drink-club-neon-blue-soda", category: "drink", name: "ネオン|ブルー|ソーダ", store: "Club210", period: "2026.07", image: "assets/vote/drink-club-neon-blue-soda.webp" },
      { id: "drink-club-blood-orange", category: "drink", name: "ブラッド|オレンジ シャンパン|カクテル", store: "Club210", period: "2026.10", image: "assets/vote/drink-club-blood-orange.webp" },
      { id: "drink-lounge-marron", category: "drink", name: "まろんの|カクテル", store: "Lounge315", period: "2026.03", image: "assets/vote/drink-lounge-marron.webp" },
      { id: "drink-lounge-yozakura-rose", category: "drink", name: "夜桜|ロゼ|スパークリング", store: "Lounge315", period: "2026.04", image: "assets/vote/drink-lounge-yozakura-rose.webp" },
      { id: "drink-lounge-hakuto-sparkling", category: "drink", name: "白桃|スパークリング", store: "Lounge315", period: "2026.07", image: "assets/vote/drink-lounge-hakuto-sparkling.webp" },
      { id: "drink-lounge-tsukimi", category: "drink", name: "お月見|カクテル", store: "Lounge315", period: "2026.08", image: "assets/vote/drink-lounge-tsukimi.webp" },
      { id: "drink-lounge-moonhowl", category: "drink", name: "ムーンハウル|カクテル", store: "Lounge315", period: "2026.10", image: "assets/vote/drink-lounge-moonhowl.webp" },
      { id: "drink-silent-midnight-soda", category: "drink", name: "ミッドナイト|ソーダ", store: "Silent735", period: "2026.07", image: "assets/vote/drink-silent-midnight-soda.webp" },
      { id: "drink-silent-dark-enchant", category: "drink", name: "ダーク|エンチャント", store: "Silent735", period: "2026.10", image: "assets/vote/drink-silent-dark-enchant.webp" },
      // ---- Dear.630部門 ----
      { id: "gift-dear-cupid-rifle", category: "gift", name: "キュービッド|ライフル", store: "Dear.630", period: "半年記念・エアガン" },
      { id: "gift-dear-kmc-box", category: "gift", name: "KMC|コラボ|ボックス", store: "Dear.630", period: "七夕イベント・ギフトボックス" },
      { id: "gift-dear-kmc-card", category: "gift", name: "KMC|コラボ|カード", store: "Dear.630", period: "七夕イベント・メッセージカード" },
      { id: "gift-dear-love-potion", category: "gift", name: "ラブ|ポーション", store: "Dear.630", period: "七夕イベント・投擲武器" },
      { id: "gift-dear-surfboard", category: "gift", name: "サーフ|ボード", store: "Dear.630", period: "夏限定・背中装着アイテム" },
      { id: "gift-dear-ice-candy", category: "gift", name: "アイス|キャンディー", store: "Dear.630", period: "夏限定・口装着アイテム" },
      { id: "gift-dear-robot-waiter", category: "gift", name: "ロボット|ウェイター", store: "Dear.630", period: "9月限定・肩追従アイテム" },
      { id: "gift-dear-cauldron-backpack", category: "gift", name: "コールドロン|リュック", store: "Dear.630", period: "10月限定・背中装着アイテム" },
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
  { id: "gift-sample-1", category: "gift", name: "見本のギフトA", store: "Dear.630" },
  { id: "gift-sample-2", category: "gift", name: "見本のギフトB", store: "Dear.630" },
  { id: "gift-sample-3", category: "gift", name: "見本のギフトC", store: "Dear.630" },
];
