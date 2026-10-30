-- ============================================================
--  GOG 1周年 人気投票（Supabase）
--  Supabase → SQL Editor にこのファイルの中身を貼り付けて「Run」してください。
--  何度実行しても大丈夫です。
--
--  Supabaseプロジェクト：gog-portal（社員ポータルと同じ）
--  読み書きは Edge Function「anniv-vote」（supabase/functions/anniv-vote）からだけ行います。
--  RLSを有効にしてポリシーを作らないので、公開キー(anon)からは見えません。
-- ============================================================

create table if not exists public.anniv_votes (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  voter_name   text not null check (char_length(voter_name) between 1 and 32),
  voter_key    text not null,                               -- 名前の表記ゆれ対策（小文字化）
  category     text not null check (category in ('food', 'drink', 'gift')),
  candidate_id text not null check (candidate_id ~ '^[a-z0-9][a-z0-9-]{0,47}$'),
  ip_hash      text,                                        -- IPそのものは保存しない
  is_test      boolean not null default false,              -- 11/1より前のテスト投票（本番とは別に集計）
  unique (voter_key, category, is_test)                     -- 1人につき各部門1票（テストと本番は別）
);

create index if not exists anniv_votes_ip_idx on public.anniv_votes (ip_hash, category, is_test);

alter table public.anniv_votes enable row level security;

create or replace view public.anniv_vote_tally
with (security_invoker = true) as
  select category, candidate_id, count(*)::int as votes, is_test
  from public.anniv_votes
  group by category, candidate_id, is_test;

revoke all on public.anniv_votes from anon, authenticated;
revoke all on public.anniv_vote_tally from anon, authenticated;

-- ------------------------------------------------------------
--  よく使う操作
-- ------------------------------------------------------------
-- 集計を見る（本番だけ）：
--   select * from public.anniv_vote_tally where not is_test order by category, votes desc;
-- テスト投票だけ消す：
--   delete from public.anniv_votes where is_test;
-- 投票した人の一覧：
--   select created_at, voter_name, category, candidate_id from public.anniv_votes order by created_at;
-- 他人の名前で投票されていた等、1件を取り消す（名前で指定）：
--   delete from public.anniv_votes where voter_key = lower('キャラクター名');
-- テスト投票をすべて消す（本番開始前に）：
--   truncate public.anniv_votes;
