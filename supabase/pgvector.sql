-- ── pgvector 설치 ───────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ── embedding 컬럼 추가 (768차원 = Gemini text-embedding-004) ────────────────
ALTER TABLE factory_transactions ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE land_transactions    ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE factory_register     ADD COLUMN IF NOT EXISTS embedding vector(768);

-- ── HNSW 인덱스 (코사인 유사도 기반 검색) ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_factory_tx_embedding
  ON factory_transactions USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_land_tx_embedding
  ON land_transactions USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_factory_register_embedding
  ON factory_register USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── 벡터 검색 함수 (factory_transactions) ──────────────────────────────────
CREATE OR REPLACE FUNCTION match_factory_transactions(
  query_embedding vector(768),
  match_count     int DEFAULT 20
)
RETURNS TABLE (
  id                    text,
  signgu_nm             text,
  emd_li_nm             text,
  contract_day          text,
  prvtuse_ar            numeric,
  sitergt_ar            numeric,
  delng_amt             numeric,
  buldng_wk_purpos_nm   text,
  build_yy              text,
  mdt_div               text,
  similarity            float
)
LANGUAGE sql STABLE AS $$
  SELECT
    id, signgu_nm, emd_li_nm, contract_day,
    prvtuse_ar, sitergt_ar, delng_amt,
    buldng_wk_purpos_nm, build_yy, mdt_div,
    1 - (embedding <=> query_embedding) AS similarity
  FROM factory_transactions
  WHERE embedding IS NOT NULL
    AND rlse_yn = 'N'
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── 벡터 검색 함수 (land_transactions) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION match_land_transactions(
  query_embedding vector(768),
  match_count     int DEFAULT 15
)
RETURNS TABLE (
  id                text,
  signgu_nm         text,
  emd_li_nm         text,
  contract_day      text,
  land_delng_ar     numeric,
  delng_amt         numeric,
  purpos_region_nm  text,
  landcgr_nm        text,
  similarity        float
)
LANGUAGE sql STABLE AS $$
  SELECT
    id, signgu_nm, emd_li_nm, contract_day,
    land_delng_ar, delng_amt,
    purpos_region_nm, landcgr_nm,
    1 - (embedding <=> query_embedding) AS similarity
  FROM land_transactions
  WHERE embedding IS NOT NULL
    AND rlse_yn = 'N'
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── 벡터 검색 함수 (factory_register) ──────────────────────────────────────
CREATE OR REPLACE FUNCTION match_factory_register(
  query_embedding vector(768),
  match_count     int DEFAULT 10
)
RETURNS TABLE (
  id                    text,
  compny_grp_nm         text,
  administ_inst_nm      text,
  indutype_desc_dtcont  text,
  lot_ar                numeric,
  subfaclt_ar           numeric,
  emply_cnt             text,
  factry_scale_div_nm   text,
  similarity            float
)
LANGUAGE sql STABLE AS $$
  SELECT
    id, compny_grp_nm, administ_inst_nm, indutype_desc_dtcont,
    lot_ar, subfaclt_ar, emply_cnt, factry_scale_div_nm,
    1 - (embedding <=> query_embedding) AS similarity
  FROM factory_register
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
