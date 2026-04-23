-- pgvector 확장 활성화
create extension if not exists vector;

-- ── embedding 컬럼 추가 ──────────────────────────────────────────────────────
-- Gemini text-embedding-004: 768차원
alter table factory_transactions  add column if not exists embedding vector(768);
alter table land_transactions     add column if not exists embedding vector(768);
alter table factory_register      add column if not exists embedding vector(768);

-- ── HNSW 인덱스 (검색 속도) ────────────────────────────────────────────────
create index if not exists idx_ft_embedding
  on factory_transactions using hnsw (embedding vector_cosine_ops);
create index if not exists idx_lt_embedding
  on land_transactions using hnsw (embedding vector_cosine_ops);
create index if not exists idx_fr_embedding
  on factory_register using hnsw (embedding vector_cosine_ops);

-- ── 기존 함수 제거 (시그니처 변경 시 필요) ─────────────────────────────────
drop function if exists match_factory_transactions(vector, integer);
drop function if exists match_land_transactions(vector, integer);
drop function if exists match_factory_register(vector, integer);

-- ── match 함수: factory_transactions ────────────────────────────────────────
create or replace function match_factory_transactions(
  query_embedding vector(768),
  match_count     int default 20
)
returns table (
  signgu_nm            text,
  emd_li_nm            text,
  contract_day         text,
  prvtuse_ar           numeric,
  sitergt_ar           numeric,
  delng_amt            bigint,
  buldng_wk_purpos_nm  text,
  build_yy             text,
  mdt_div              text,
  similarity           float
)
language sql stable
as $$
  select
    signgu_nm, emd_li_nm, contract_day,
    prvtuse_ar, sitergt_ar, delng_amt,
    buldng_wk_purpos_nm, build_yy, mdt_div,
    1 - (embedding <=> query_embedding) as similarity
  from factory_transactions
  where rlse_yn != 'C'
    and embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- ── match 함수: land_transactions ───────────────────────────────────────────
create or replace function match_land_transactions(
  query_embedding vector(768),
  match_count     int default 15
)
returns table (
  signgu_nm        text,
  emd_li_nm        text,
  contract_day     text,
  land_delng_ar    numeric,
  delng_amt        bigint,
  purpos_region_nm text,
  landcgr_nm       text,
  similarity       float
)
language sql stable
as $$
  select
    signgu_nm, emd_li_nm, contract_day,
    land_delng_ar, delng_amt,
    purpos_region_nm, landcgr_nm,
    1 - (embedding <=> query_embedding) as similarity
  from land_transactions
  where rlse_yn != 'C'
    and embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- ── match 함수: factory_register ────────────────────────────────────────────
create or replace function match_factory_register(
  query_embedding vector(768),
  match_count     int default 10
)
returns table (
  compny_grp_nm        text,
  administ_inst_nm     text,
  indutype_desc_dtcont text,
  lot_ar               numeric,
  subfaclt_ar          numeric,
  emply_cnt            text,
  factry_scale_div_nm  text,
  similarity           float
)
language sql stable
as $$
  select
    compny_grp_nm, administ_inst_nm, indutype_desc_dtcont,
    lot_ar, subfaclt_ar, emply_cnt, factry_scale_div_nm,
    1 - (embedding <=> query_embedding) as similarity
  from factory_register
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;
