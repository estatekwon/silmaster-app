-- ── NextAuth 필수 테이블 ────────────────────────────────────────────────────
create table if not exists accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  type text not null,
  provider text not null,
  provider_account_id text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  unique(provider, provider_account_id)
);

create table if not exists sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  session_token text not null unique,
  expires timestamptz not null
);

create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  name text,
  email text unique,
  email_verified timestamptz,
  image text,
  created_at timestamptz default now()
);

create table if not exists verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  unique(identifier, token)
);

alter table accounts add constraint accounts_user_id_fkey
  foreign key (user_id) references users(id) on delete cascade;
alter table sessions add constraint sessions_user_id_fkey
  foreign key (user_id) references users(id) on delete cascade;

-- ── 구독 테이블 ─────────────────────────────────────────────────────────────
create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  plan text not null default 'free',
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id)
);

-- ── 실거래 데이터 테이블 ─────────────────────────────────────────────────────

-- 공장 등록현황 (78,552건)
create table if not exists factory_register (
  id text primary key,
  compny_grp_nm text,
  administ_inst_nm text,
  indutype_desc_dtcont text,
  emply_cnt text,
  lot_ar numeric,
  subfaclt_ar numeric,
  factry_scale_div_nm text,
  factry_regist_de text,
  refine_roadnm_addr text,
  purpos_region_nm text,
  landcgr_nm text,
  lat numeric,
  lng numeric,
  synced_at timestamptz default now()
);

create index if not exists idx_fr_administ on factory_register(administ_inst_nm);
create index if not exists idx_fr_indutype on factory_register(indutype_desc_dtcont);

-- 공장·창고 실거래 (79,387건)
create table if not exists factory_transactions (
  id text primary key,
  signgu_nm text,
  emd_li_nm text,
  contract_day text,
  prvtuse_ar numeric,
  sitergt_ar numeric,
  floor_cnt text,
  delng_amt bigint,
  build_yy text,
  buldng_wk_purpos_nm text,
  rlse_yn text default 'N',
  mdt_div text,
  purpos_region_nm text,
  synced_at timestamptz default now()
);

create index if not exists idx_ft_signgu on factory_transactions(signgu_nm);
create index if not exists idx_ft_contract on factory_transactions(contract_day desc);
create index if not exists idx_ft_rlse on factory_transactions(rlse_yn);

-- 토지 실거래 (52,946건)
create table if not exists land_transactions (
  id text primary key,
  signgu_nm text,
  emd_li_nm text,
  contract_day text,
  land_delng_ar numeric,
  delng_amt bigint,
  purpos_region_nm text,
  landcgr_nm text,
  rlse_yn text default 'N',
  synced_at timestamptz default now()
);

create index if not exists idx_lt_signgu on land_transactions(signgu_nm);
create index if not exists idx_lt_contract on land_transactions(contract_day desc);

-- ── 동기화 로그 ─────────────────────────────────────────────────────────────
create table if not exists sync_logs (
  id uuid default gen_random_uuid() primary key,
  source text not null,        -- 'factory_register' | 'factory_tx' | 'land_tx'
  total_fetched int,
  total_upserted int,
  started_at timestamptz,
  finished_at timestamptz,
  error text
);
