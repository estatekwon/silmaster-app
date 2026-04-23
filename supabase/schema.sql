-- NextAuth 필수 테이블
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

-- 구독 테이블
create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  plan text not null default 'free',   -- 'free' | 'pro'
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id)
);

-- FK
alter table accounts add constraint accounts_user_id_fkey
  foreign key (user_id) references users(id) on delete cascade;
alter table sessions add constraint sessions_user_id_fkey
  foreign key (user_id) references users(id) on delete cascade;
