-- ============================================================
-- Lunari Finance OS — Supabase/Postgres Schema
-- ============================================================
-- Row-Level Security (RLS) enforces tenant isolation.
-- All writes are append-only on audit_log.
-- Triggers write to audit_log on critical table changes.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Extensions
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- Tenants & Entities
-- ────────────────────────────────────────────────────────────

CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  plan          TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'enterprise')),
  settings      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE entities (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  legal_name        TEXT NOT NULL,
  currency          CHAR(3) NOT NULL,
  country_code      CHAR(2) NOT NULL,
  parent_entity_id  UUID REFERENCES entities(id),
  fiscal_year_end   CHAR(5) NOT NULL DEFAULT '12-31',
  tax_id            TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entities_tenant ON entities(tenant_id);

-- ────────────────────────────────────────────────────────────
-- Users & Access
-- ────────────────────────────────────────────────────────────

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN (
    'super_admin','tenant_admin','finance_controller','finance_manager',
    'accountant','ap_clerk','ar_clerk','auditor','read_only'
  )),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_entity_access (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_id   UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, entity_id)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);

-- ────────────────────────────────────────────────────────────
-- GL: Accounts, Periods, Journals
-- ────────────────────────────────────────────────────────────

CREATE TABLE gl_accounts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  entity_id         UUID NOT NULL REFERENCES entities(id),
  code              TEXT NOT NULL,
  name              TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense')),
  normal_balance    TEXT NOT NULL CHECK (normal_balance IN ('debit','credit')),
  currency          CHAR(3) NOT NULL,
  is_control        BOOLEAN NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  parent_account_id UUID REFERENCES gl_accounts(id),
  description       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, entity_id, code)
);

CREATE TABLE gl_periods (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  entity_id   UUID NOT NULL REFERENCES entities(id),
  year        INTEGER NOT NULL,
  month       INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  status      TEXT NOT NULL CHECK (status IN ('open','closed','locked')) DEFAULT 'open',
  opened_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at   TIMESTAMPTZ,
  closed_by   UUID REFERENCES users(id),
  locked_at   TIMESTAMPTZ,
  locked_by   UUID REFERENCES users(id),
  UNIQUE (tenant_id, entity_id, year, month)
);

CREATE TABLE gl_journals (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  entity_id           UUID NOT NULL REFERENCES entities(id),
  period_id           UUID NOT NULL REFERENCES gl_periods(id),
  reference           TEXT NOT NULL,
  description         TEXT NOT NULL,
  status              TEXT NOT NULL CHECK (status IN (
    'draft','pending_approval','approved','posted','reversed','rejected'
  )) DEFAULT 'draft',
  prepared_by         UUID NOT NULL REFERENCES users(id),
  prepared_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at        TIMESTAMPTZ,
  approved_by         UUID REFERENCES users(id),
  approved_at         TIMESTAMPTZ,
  rejected_by         UUID REFERENCES users(id),
  rejected_at         TIMESTAMPTZ,
  rejection_reason    TEXT,
  posted_by           UUID REFERENCES users(id),
  posted_at           TIMESTAMPTZ,
  reversed_by         UUID REFERENCES users(id),
  reversed_at         TIMESTAMPTZ,
  reversal_journal_id UUID REFERENCES gl_journals(id),
  original_journal_id UUID REFERENCES gl_journals(id),
  source_module       TEXT NOT NULL DEFAULT 'manual',
  source_id           UUID,
  total_debit         NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_credit        NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Enforce balanced journals at DB level
  CONSTRAINT journals_must_balance CHECK (total_debit = total_credit)
);

CREATE TABLE gl_journal_lines (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_id          UUID NOT NULL REFERENCES gl_journals(id) ON DELETE CASCADE,
  sequence            INTEGER NOT NULL,
  account_id          UUID NOT NULL REFERENCES gl_accounts(id),
  description         TEXT NOT NULL,
  debit               NUMERIC(18,2) NOT NULL DEFAULT 0,
  credit              NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency            CHAR(3) NOT NULL,
  fx_rate             NUMERIC(18,8) NOT NULL DEFAULT 1,
  functional_debit    NUMERIC(18,2) NOT NULL DEFAULT 0,
  functional_credit   NUMERIC(18,2) NOT NULL DEFAULT 0,
  entity_id           UUID NOT NULL REFERENCES entities(id),
  -- One or the other, never both
  CONSTRAINT line_debit_or_credit CHECK (NOT (debit > 0 AND credit > 0)),
  CONSTRAINT line_non_negative CHECK (debit >= 0 AND credit >= 0)
);

CREATE TABLE gl_balances (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  entity_id         UUID NOT NULL REFERENCES entities(id),
  account_id        UUID NOT NULL REFERENCES gl_accounts(id),
  period_id         UUID NOT NULL REFERENCES gl_periods(id),
  opening_debit     NUMERIC(18,2) NOT NULL DEFAULT 0,
  opening_credit    NUMERIC(18,2) NOT NULL DEFAULT 0,
  period_debit      NUMERIC(18,2) NOT NULL DEFAULT 0,
  period_credit     NUMERIC(18,2) NOT NULL DEFAULT 0,
  closing_debit     NUMERIC(18,2) NOT NULL DEFAULT 0,
  closing_credit    NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency          CHAR(3) NOT NULL,
  UNIQUE (tenant_id, entity_id, account_id, period_id)
);

CREATE TABLE fx_rates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  from_currency   CHAR(3) NOT NULL,
  to_currency     CHAR(3) NOT NULL,
  rate            NUMERIC(18,8) NOT NULL,
  rate_type       TEXT NOT NULL CHECK (rate_type IN ('spot','average','closing')),
  effective_date  DATE NOT NULL,
  source          TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, from_currency, to_currency, effective_date, rate_type)
);

-- ────────────────────────────────────────────────────────────
-- Vendors & Customers
-- ────────────────────────────────────────────────────────────

CREATE TABLE vendors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  entity_id       UUID NOT NULL REFERENCES entities(id),
  name            TEXT NOT NULL,
  legal_name      TEXT,
  tax_id          TEXT,
  currency        CHAR(3) NOT NULL DEFAULT 'USD',
  payment_terms   INTEGER NOT NULL DEFAULT 30,
  bank_account    TEXT,
  routing_number  TEXT,
  status          TEXT NOT NULL CHECK (status IN ('active','inactive','blocked')) DEFAULT 'active',
  address         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  entity_id         UUID NOT NULL REFERENCES entities(id),
  name              TEXT NOT NULL,
  legal_name        TEXT,
  tax_id            TEXT,
  currency          CHAR(3) NOT NULL DEFAULT 'USD',
  payment_terms     INTEGER NOT NULL DEFAULT 30,
  credit_limit      NUMERIC(18,2) NOT NULL DEFAULT 0,
  outstanding_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL CHECK (status IN ('active','inactive','credit_hold')) DEFAULT 'active',
  address           JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- AP (Accounts Payable)
-- ────────────────────────────────────────────────────────────

CREATE TABLE ap_invoices (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  entity_id           UUID NOT NULL REFERENCES entities(id),
  vendor_id           UUID NOT NULL REFERENCES vendors(id),
  invoice_number      TEXT NOT NULL,
  invoice_date        DATE NOT NULL,
  due_date            DATE NOT NULL,
  received_date       DATE NOT NULL,
  currency            CHAR(3) NOT NULL,
  subtotal_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
  tax_amount          NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_amount        NUMERIC(18,2) NOT NULL DEFAULT 0,
  paid_amount         NUMERIC(18,2) NOT NULL DEFAULT 0,
  outstanding_amount  NUMERIC(18,2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL CHECK (status IN (
    'draft','pending_approval','approved','posted','paid','partially_paid','void','rejected'
  )) DEFAULT 'draft',
  journal_id          UUID REFERENCES gl_journals(id),
  approved_by         UUID REFERENCES users(id),
  approved_at         TIMESTAMPTZ,
  rejected_by         UUID REFERENCES users(id),
  rejected_at         TIMESTAMPTZ,
  rejection_reason    TEXT,
  posted_at           TIMESTAMPTZ,
  notes               TEXT,
  attachment_url      TEXT,
  prepared_by         UUID NOT NULL REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ap_invoice_lines (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID NOT NULL REFERENCES ap_invoices(id) ON DELETE CASCADE,
  sequence        INTEGER NOT NULL,
  description     TEXT NOT NULL,
  account_id      UUID NOT NULL REFERENCES gl_accounts(id),
  quantity        NUMERIC(18,4) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(18,2) NOT NULL DEFAULT 0,
  amount          NUMERIC(18,2) NOT NULL DEFAULT 0,
  tax_code        TEXT,
  tax_rate        NUMERIC(6,4) NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(18,2) NOT NULL DEFAULT 0
);

CREATE TABLE ap_payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  entity_id       UUID NOT NULL REFERENCES entities(id),
  vendor_id       UUID NOT NULL REFERENCES vendors(id),
  payment_date    DATE NOT NULL,
  amount          NUMERIC(18,2) NOT NULL,
  currency        CHAR(3) NOT NULL,
  bank_account_id UUID,
  reference       TEXT NOT NULL,
  memo            TEXT,
  status          TEXT NOT NULL CHECK (status IN (
    'draft','pending_approval','approved','processed','cancelled'
  )) DEFAULT 'draft',
  journal_id      UUID REFERENCES gl_journals(id),
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ap_payment_invoice_map (
  payment_id  UUID NOT NULL REFERENCES ap_payments(id) ON DELETE CASCADE,
  invoice_id  UUID NOT NULL REFERENCES ap_invoices(id),
  amount      NUMERIC(18,2) NOT NULL,
  PRIMARY KEY (payment_id, invoice_id)
);

-- ────────────────────────────────────────────────────────────
-- AR (Accounts Receivable)
-- ────────────────────────────────────────────────────────────

CREATE TABLE ar_invoices (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  entity_id           UUID NOT NULL REFERENCES entities(id),
  customer_id         UUID NOT NULL REFERENCES customers(id),
  invoice_number      TEXT NOT NULL,
  invoice_date        DATE NOT NULL,
  due_date            DATE NOT NULL,
  currency            CHAR(3) NOT NULL,
  subtotal_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
  tax_amount          NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_amount        NUMERIC(18,2) NOT NULL DEFAULT 0,
  paid_amount         NUMERIC(18,2) NOT NULL DEFAULT 0,
  outstanding_amount  NUMERIC(18,2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL CHECK (status IN (
    'draft','sent','pending_approval','approved','posted','paid',
    'partially_paid','overdue','void','written_off'
  )) DEFAULT 'draft',
  journal_id          UUID REFERENCES gl_journals(id),
  sent_at             TIMESTAMPTZ,
  approved_by         UUID REFERENCES users(id),
  approved_at         TIMESTAMPTZ,
  posted_at           TIMESTAMPTZ,
  notes               TEXT,
  prepared_by         UUID NOT NULL REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ar_invoice_lines (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID NOT NULL REFERENCES ar_invoices(id) ON DELETE CASCADE,
  sequence    INTEGER NOT NULL,
  description TEXT NOT NULL,
  account_id  UUID NOT NULL REFERENCES gl_accounts(id),
  quantity    NUMERIC(18,4) NOT NULL DEFAULT 1,
  unit_price  NUMERIC(18,2) NOT NULL DEFAULT 0,
  amount      NUMERIC(18,2) NOT NULL DEFAULT 0,
  tax_code    TEXT,
  tax_rate    NUMERIC(6,4) NOT NULL DEFAULT 0,
  tax_amount  NUMERIC(18,2) NOT NULL DEFAULT 0
);

CREATE TABLE ar_receipts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  entity_id       UUID NOT NULL REFERENCES entities(id),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  receipt_date    DATE NOT NULL,
  amount          NUMERIC(18,2) NOT NULL,
  currency        CHAR(3) NOT NULL,
  bank_account_id UUID,
  reference       TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('draft','posted','matched')) DEFAULT 'draft',
  journal_id      UUID REFERENCES gl_journals(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- Cash & Bank
-- ────────────────────────────────────────────────────────────

CREATE TABLE cash_bank_accounts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  entity_id             UUID NOT NULL REFERENCES entities(id),
  name                  TEXT NOT NULL,
  bank_name             TEXT NOT NULL,
  account_number        TEXT NOT NULL,
  routing_number        TEXT,
  account_type          TEXT NOT NULL CHECK (account_type IN ('checking','savings','money_market','credit_line')),
  currency              CHAR(3) NOT NULL,
  gl_account_id         UUID NOT NULL REFERENCES gl_accounts(id),
  current_balance       NUMERIC(18,2) NOT NULL DEFAULT 0,
  available_balance     NUMERIC(18,2) NOT NULL DEFAULT 0,
  last_reconciled_date  DATE,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cash_transactions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  entity_id               UUID NOT NULL REFERENCES entities(id),
  bank_account_id         UUID NOT NULL REFERENCES cash_bank_accounts(id),
  transaction_date        DATE NOT NULL,
  value_date              DATE NOT NULL,
  description             TEXT NOT NULL,
  reference               TEXT,
  amount                  NUMERIC(18,2) NOT NULL,
  type                    TEXT NOT NULL CHECK (type IN ('debit','credit')),
  currency                CHAR(3) NOT NULL,
  balance                 NUMERIC(18,2) NOT NULL,
  status                  TEXT NOT NULL CHECK (status IN ('unreconciled','reconciled','excluded')) DEFAULT 'unreconciled',
  matched_journal_line_id UUID REFERENCES gl_journal_lines(id),
  imported_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cash_reconciliations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  entity_id           UUID NOT NULL REFERENCES entities(id),
  bank_account_id     UUID NOT NULL REFERENCES cash_bank_accounts(id),
  period_id           UUID NOT NULL REFERENCES gl_periods(id),
  statement_date      DATE NOT NULL,
  statement_balance   NUMERIC(18,2) NOT NULL,
  gl_balance          NUMERIC(18,2) NOT NULL,
  reconciled_balance  NUMERIC(18,2) NOT NULL,
  difference          NUMERIC(18,2) NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('in_progress','completed','approved')) DEFAULT 'in_progress',
  reconciled_by       UUID REFERENCES users(id),
  approved_by         UUID REFERENCES users(id),
  approved_at         TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- ReconcileIQ (Balance Sheet Reconciliation)
-- ────────────────────────────────────────────────────────────

CREATE TABLE recon_worksheets (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  entity_id             UUID NOT NULL REFERENCES entities(id),
  account_id            UUID NOT NULL REFERENCES gl_accounts(id),
  period_id             UUID NOT NULL REFERENCES gl_periods(id),
  gl_balance            NUMERIC(18,2) NOT NULL,
  reconciled_balance    NUMERIC(18,2) NOT NULL DEFAULT 0,
  unreconciled_balance  NUMERIC(18,2) NOT NULL,
  status                TEXT NOT NULL CHECK (status IN ('open','in_progress','prepared','reviewed','approved','locked')) DEFAULT 'open',
  prepared_by           UUID REFERENCES users(id),
  prepared_at           TIMESTAMPTZ,
  reviewed_by           UUID REFERENCES users(id),
  reviewed_at           TIMESTAMPTZ,
  approved_by           UUID REFERENCES users(id),
  approved_at           TIMESTAMPTZ,
  notes                 TEXT,
  currency              CHAR(3) NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recon_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worksheet_id    UUID NOT NULL REFERENCES recon_worksheets(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  amount          NUMERIC(18,2) NOT NULL,
  currency        CHAR(3) NOT NULL,
  transaction_date DATE NOT NULL,
  reference_id    UUID,
  reference_type  TEXT,
  status          TEXT NOT NULL CHECK (status IN ('open','matched','exception','cleared')) DEFAULT 'open',
  matched_item_id UUID REFERENCES recon_items(id),
  notes           TEXT,
  added_by        UUID NOT NULL REFERENCES users(id),
  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- CloseIQ
-- ────────────────────────────────────────────────────────────

CREATE TABLE close_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  entity_id       UUID NOT NULL REFERENCES entities(id),
  period_id       UUID NOT NULL REFERENCES gl_periods(id),
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL,
  owner_id        UUID NOT NULL REFERENCES users(id),
  reviewer_id     UUID REFERENCES users(id),
  due_date        DATE NOT NULL,
  due_time        TIME NOT NULL DEFAULT '17:00',
  completed_at    TIMESTAMPTZ,
  completed_by    UUID REFERENCES users(id),
  status          TEXT NOT NULL CHECK (status IN (
    'not_started','in_progress','completed','blocked','waived'
  )) DEFAULT 'not_started',
  blocked_reason  TEXT,
  waived_reason   TEXT,
  priority        TEXT NOT NULL CHECK (priority IN ('critical','high','medium','low')),
  sequence        INTEGER NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE close_task_dependencies (
  task_id         UUID NOT NULL REFERENCES close_tasks(id) ON DELETE CASCADE,
  depends_on_id   UUID NOT NULL REFERENCES close_tasks(id),
  PRIMARY KEY (task_id, depends_on_id)
);

-- ────────────────────────────────────────────────────────────
-- ScheduleIQ (Prepaids & Accruals)
-- ────────────────────────────────────────────────────────────

CREATE TABLE sched_prepaids (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  entity_id               UUID NOT NULL REFERENCES entities(id),
  description             TEXT NOT NULL,
  vendor                  TEXT NOT NULL,
  invoice_id              UUID REFERENCES ap_invoices(id),
  start_date              DATE NOT NULL,
  end_date                DATE NOT NULL,
  total_amount            NUMERIC(18,2) NOT NULL,
  amortized_amount        NUMERIC(18,2) NOT NULL DEFAULT 0,
  remaining_amount        NUMERIC(18,2) NOT NULL,
  currency                CHAR(3) NOT NULL,
  prepaid_account_id      UUID NOT NULL REFERENCES gl_accounts(id),
  expense_account_id      UUID NOT NULL REFERENCES gl_accounts(id),
  amortization_method     TEXT NOT NULL CHECK (amortization_method IN ('straight_line','declining_balance','units_of_production')),
  monthly_amount          NUMERIC(18,2) NOT NULL,
  status                  TEXT NOT NULL CHECK (status IN ('active','fully_amortized','terminated','suspended')) DEFAULT 'active',
  created_by              UUID NOT NULL REFERENCES users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sched_prepaid_lines (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prepaid_id  UUID NOT NULL REFERENCES sched_prepaids(id) ON DELETE CASCADE,
  period_id   UUID NOT NULL REFERENCES gl_periods(id),
  amount      NUMERIC(18,2) NOT NULL,
  journal_id  UUID REFERENCES gl_journals(id),
  posted_at   TIMESTAMPTZ,
  status      TEXT NOT NULL CHECK (status IN ('scheduled','posted','reversed')) DEFAULT 'scheduled'
);

CREATE TABLE sched_accruals (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  entity_id             UUID NOT NULL REFERENCES entities(id),
  description           TEXT NOT NULL,
  accrual_date          DATE NOT NULL,
  reversal_date         DATE,
  amount                NUMERIC(18,2) NOT NULL,
  currency              CHAR(3) NOT NULL,
  debit_account_id      UUID NOT NULL REFERENCES gl_accounts(id),
  credit_account_id     UUID NOT NULL REFERENCES gl_accounts(id),
  journal_id            UUID REFERENCES gl_journals(id),
  reversal_journal_id   UUID REFERENCES gl_journals(id),
  status                TEXT NOT NULL CHECK (status IN ('open','reversed','settled')) DEFAULT 'open',
  category              TEXT NOT NULL,
  recurring             BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_months      INTEGER,
  notes                 TEXT,
  created_by            UUID NOT NULL REFERENCES users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- RevenueIQ (ASC 606 / IFRS 15)
-- ────────────────────────────────────────────────────────────

CREATE TABLE rev_contracts (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  entity_id               UUID NOT NULL REFERENCES entities(id),
  customer_id             UUID NOT NULL REFERENCES customers(id),
  contract_number         TEXT NOT NULL,
  contract_date           DATE NOT NULL,
  currency                CHAR(3) NOT NULL,
  total_transaction_price NUMERIC(18,2) NOT NULL,
  recognized_revenue      NUMERIC(18,2) NOT NULL DEFAULT 0,
  deferred_revenue        NUMERIC(18,2) NOT NULL DEFAULT 0,
  status                  TEXT NOT NULL CHECK (status IN ('draft','active','completed','terminated','disputed')) DEFAULT 'draft',
  notes                   TEXT,
  created_by              UUID NOT NULL REFERENCES users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rev_obligations (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id                 UUID NOT NULL REFERENCES rev_contracts(id) ON DELETE CASCADE,
  description                 TEXT NOT NULL,
  standalone_selling_price    NUMERIC(18,2) NOT NULL,
  allocated_transaction_price NUMERIC(18,2) NOT NULL,
  recognized_amount           NUMERIC(18,2) NOT NULL DEFAULT 0,
  deferred_amount             NUMERIC(18,2) NOT NULL DEFAULT 0,
  status                      TEXT NOT NULL CHECK (status IN ('unsatisfied','partially_satisfied','fully_satisfied')) DEFAULT 'unsatisfied',
  recognition_method          TEXT NOT NULL CHECK (recognition_method IN ('point_in_time','over_time')),
  start_date                  DATE NOT NULL,
  end_date                    DATE,
  completion_pct              NUMERIC(5,2) NOT NULL DEFAULT 0
);

CREATE TABLE rev_schedules (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id       UUID NOT NULL REFERENCES rev_contracts(id),
  obligation_id     UUID NOT NULL REFERENCES rev_obligations(id),
  period_id         UUID NOT NULL REFERENCES gl_periods(id),
  scheduled_amount  NUMERIC(18,2) NOT NULL,
  recognized_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  journal_id        UUID REFERENCES gl_journals(id),
  status            TEXT NOT NULL CHECK (status IN ('scheduled','recognized','deferred')) DEFAULT 'scheduled'
);

-- ────────────────────────────────────────────────────────────
-- LeaseIQ (IFRS 16 / ASC 842)
-- ────────────────────────────────────────────────────────────

CREATE TABLE lease_contracts (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id),
  entity_id                 UUID NOT NULL REFERENCES entities(id),
  lease_number              TEXT NOT NULL,
  description               TEXT NOT NULL,
  lessor                    TEXT NOT NULL,
  asset_description         TEXT NOT NULL,
  asset_category            TEXT NOT NULL,
  lease_type                TEXT NOT NULL CHECK (lease_type IN ('operating','finance')),
  classification            TEXT NOT NULL CHECK (classification IN ('short_term','low_value','standard')),
  commencement_date         DATE NOT NULL,
  expiration_date           DATE NOT NULL,
  term_months               INTEGER NOT NULL,
  renewal_options           INTEGER NOT NULL DEFAULT 0,
  purchase_option           BOOLEAN NOT NULL DEFAULT FALSE,
  currency                  CHAR(3) NOT NULL,
  monthly_payment           NUMERIC(18,2) NOT NULL,
  annual_escalation         NUMERIC(6,4) NOT NULL DEFAULT 0,
  discount_rate             NUMERIC(8,6) NOT NULL,
  right_of_use_asset        NUMERIC(18,2) NOT NULL,
  lease_liability           NUMERIC(18,2) NOT NULL,
  accumulated_amortization  NUMERIC(18,2) NOT NULL DEFAULT 0,
  current_liability         NUMERIC(18,2) NOT NULL DEFAULT 0,
  long_term_liability       NUMERIC(18,2) NOT NULL DEFAULT 0,
  status                    TEXT NOT NULL CHECK (status IN ('draft','active','modified','terminated','expired')) DEFAULT 'draft',
  gl_roa_account_id         UUID NOT NULL REFERENCES gl_accounts(id),
  gl_liability_account_id   UUID NOT NULL REFERENCES gl_accounts(id),
  gl_amortization_account_id UUID NOT NULL REFERENCES gl_accounts(id),
  gl_interest_account_id    UUID NOT NULL REFERENCES gl_accounts(id),
  notes                     TEXT,
  created_by                UUID NOT NULL REFERENCES users(id),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lease_schedules (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id                UUID NOT NULL REFERENCES lease_contracts(id) ON DELETE CASCADE,
  period_number           INTEGER NOT NULL,
  period_date             DATE NOT NULL,
  period_id               UUID REFERENCES gl_periods(id),
  payment_amount          NUMERIC(18,2) NOT NULL,
  interest_expense        NUMERIC(18,2) NOT NULL,
  principal_reduction     NUMERIC(18,2) NOT NULL,
  liability_balance       NUMERIC(18,2) NOT NULL,
  rou_asset_amortization  NUMERIC(18,2) NOT NULL,
  rou_asset_balance       NUMERIC(18,2) NOT NULL,
  journal_id              UUID REFERENCES gl_journals(id),
  status                  TEXT NOT NULL CHECK (status IN ('scheduled','posted','reversed')) DEFAULT 'scheduled'
);

-- ────────────────────────────────────────────────────────────
-- AssetIQ
-- ────────────────────────────────────────────────────────────

CREATE TABLE asset_register (
  id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                       UUID NOT NULL REFERENCES tenants(id),
  entity_id                       UUID NOT NULL REFERENCES entities(id),
  asset_number                    TEXT NOT NULL UNIQUE,
  name                            TEXT NOT NULL,
  description                     TEXT,
  category                        TEXT NOT NULL,
  sub_category                    TEXT,
  location                        TEXT,
  serial_number                   TEXT,
  vendor                          TEXT,
  invoice_id                      UUID REFERENCES ap_invoices(id),
  acquisition_date                DATE NOT NULL,
  in_service_date                 DATE NOT NULL,
  currency                        CHAR(3) NOT NULL,
  acquisition_cost                NUMERIC(18,2) NOT NULL,
  salvage_value                   NUMERIC(18,2) NOT NULL DEFAULT 0,
  depreciable_base                NUMERIC(18,2) NOT NULL,
  useful_life_months              INTEGER NOT NULL,
  depreciation_method             TEXT NOT NULL CHECK (depreciation_method IN ('straight_line','declining_balance','sum_of_years','units_of_production')),
  accumulated_depreciation        NUMERIC(18,2) NOT NULL DEFAULT 0,
  net_book_value                  NUMERIC(18,2) NOT NULL,
  status                          TEXT NOT NULL CHECK (status IN ('active','disposed','fully_depreciated','impaired','held_for_sale')) DEFAULT 'active',
  disposed_at                     TIMESTAMPTZ,
  disposal_proceeds               NUMERIC(18,2),
  gain_loss_on_disposal           NUMERIC(18,2),
  gl_asset_account_id             UUID NOT NULL REFERENCES gl_accounts(id),
  gl_accum_deprec_account_id      UUID NOT NULL REFERENCES gl_accounts(id),
  gl_deprec_expense_account_id    UUID NOT NULL REFERENCES gl_accounts(id),
  last_depreciation_date          DATE,
  notes                           TEXT,
  created_by                      UUID NOT NULL REFERENCES users(id),
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE asset_depreciation (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id                UUID NOT NULL REFERENCES asset_register(id) ON DELETE CASCADE,
  period_id               UUID NOT NULL REFERENCES gl_periods(id),
  depreciation_date       DATE NOT NULL,
  opening_nbv             NUMERIC(18,2) NOT NULL,
  depreciation_amount     NUMERIC(18,2) NOT NULL,
  accumulated_depreciation NUMERIC(18,2) NOT NULL,
  closing_nbv             NUMERIC(18,2) NOT NULL,
  journal_id              UUID REFERENCES gl_journals(id),
  status                  TEXT NOT NULL CHECK (status IN ('scheduled','posted','reversed')) DEFAULT 'scheduled'
);

-- ────────────────────────────────────────────────────────────
-- ComplianceHub
-- ────────────────────────────────────────────────────────────

CREATE TABLE compliance_obligations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  entity_id             UUID NOT NULL REFERENCES entities(id),
  name                  TEXT NOT NULL,
  description           TEXT NOT NULL,
  regulatory_body       TEXT NOT NULL,
  framework             TEXT NOT NULL,
  frequency             TEXT NOT NULL CHECK (frequency IN ('monthly','quarterly','semi_annual','annual','ad_hoc')),
  next_due_date         DATE NOT NULL,
  last_completed_date   DATE,
  status                TEXT NOT NULL CHECK (status IN ('active','expired','pending','waived')) DEFAULT 'active',
  owner                 UUID NOT NULL REFERENCES users(id),
  risk_level            TEXT NOT NULL CHECK (risk_level IN ('critical','high','medium','low')),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE compliance_controls (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  entity_id         UUID NOT NULL REFERENCES entities(id),
  control_id        TEXT NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('preventive','detective','corrective')),
  frequency         TEXT NOT NULL,
  owner             UUID NOT NULL REFERENCES users(id),
  reviewer          UUID REFERENCES users(id),
  risk_level        TEXT NOT NULL CHECK (risk_level IN ('critical','high','medium','low')),
  status            TEXT NOT NULL CHECK (status IN ('effective','deficient','material_weakness','not_tested')) DEFAULT 'not_tested',
  last_tested_date  DATE,
  next_test_date    DATE,
  framework         TEXT NOT NULL,
  process           TEXT NOT NULL,
  narrative         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, entity_id, control_id)
);

CREATE TABLE compliance_evidence (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  entity_id         UUID NOT NULL REFERENCES entities(id),
  control_id        UUID REFERENCES compliance_controls(id),
  obligation_id     UUID REFERENCES compliance_obligations(id),
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  evidence_date     DATE NOT NULL,
  file_url          TEXT,
  file_name         TEXT,
  status            TEXT NOT NULL CHECK (status IN ('pending','submitted','accepted','rejected')) DEFAULT 'submitted',
  submitted_by      UUID NOT NULL REFERENCES users(id),
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by       UUID REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- AuditIQ (PBC, Evidence)
-- ────────────────────────────────────────────────────────────

CREATE TABLE audit_pbc_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  entity_id       UUID NOT NULL REFERENCES entities(id),
  audit_period    TEXT NOT NULL,
  category        TEXT NOT NULL,
  request_number  TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  requested_by    UUID NOT NULL REFERENCES users(id),
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date        DATE NOT NULL,
  assigned_to     UUID NOT NULL REFERENCES users(id),
  status          TEXT NOT NULL CHECK (status IN (
    'open','in_progress','submitted','under_review','accepted','rejected'
  )) DEFAULT 'open',
  priority        TEXT NOT NULL CHECK (priority IN ('urgent','high','normal','low')) DEFAULT 'normal',
  notes           TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_evidence (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pbc_item_id       UUID NOT NULL REFERENCES audit_pbc_items(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  entity_id         UUID NOT NULL REFERENCES entities(id),
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  evidence_type     TEXT NOT NULL CHECK (evidence_type IN ('document','screenshot','report','reconciliation','confirmation','other')),
  file_url          TEXT,
  file_name         TEXT,
  file_size         INTEGER,
  period            TEXT NOT NULL,
  prepared_by       UUID NOT NULL REFERENCES users(id),
  prepared_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by       UUID REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  status            TEXT NOT NULL CHECK (status IN ('draft','submitted','accepted','rejected')) DEFAULT 'draft',
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_pbc_comments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pbc_item_id       UUID NOT NULL REFERENCES audit_pbc_items(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES users(id),
  content           TEXT NOT NULL,
  is_auditor_comment BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- Audit Log (append-only, never updated or deleted)
-- ────────────────────────────────────────────────────────────

CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  entity_id       UUID REFERENCES entities(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  user_name       TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  source_module   TEXT NOT NULL,
  resource_type   TEXT NOT NULL,
  resource_id     UUID,
  description     TEXT NOT NULL,
  before_state    JSONB,
  after_state     JSONB,
  metadata        JSONB NOT NULL DEFAULT '{}',
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log is append-only
CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);

-- ────────────────────────────────────────────────────────────
-- Row-Level Security Policies
-- ────────────────────────────────────────────────────────────

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ap_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tenant's data
-- (In production, auth.uid() maps to users.id via JWT)
CREATE POLICY tenant_isolation_entities ON entities
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY tenant_isolation_gl_journals ON gl_journals
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY tenant_isolation_ap_invoices ON ap_invoices
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY tenant_isolation_ar_invoices ON ar_invoices
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY tenant_isolation_audit_log ON audit_log
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- ────────────────────────────────────────────────────────────
-- Audit Triggers
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_audit_journal()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    tenant_id, entity_id, user_id, user_name, event_type,
    source_module, resource_type, resource_id, description,
    before_state, after_state
  ) VALUES (
    NEW.tenant_id, NEW.entity_id,
    COALESCE(NEW.posted_by, NEW.approved_by, NEW.prepared_by),
    'system',
    CASE
      WHEN OLD IS NULL THEN 'journal.created'
      WHEN NEW.status = 'posted' AND OLD.status != 'posted' THEN 'journal.posted'
      WHEN NEW.status = 'approved' AND OLD.status != 'approved' THEN 'journal.approved'
      WHEN NEW.status = 'reversed' AND OLD.status != 'reversed' THEN 'journal.reversed'
      ELSE 'journal.updated'
    END,
    NEW.source_module, 'journal', NEW.id,
    'Journal ' || NEW.reference || ' — status: ' || NEW.status,
    CASE WHEN OLD IS NOT NULL THEN row_to_json(OLD) ELSE NULL END,
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_journals_insert
  AFTER INSERT ON gl_journals
  FOR EACH ROW EXECUTE FUNCTION trigger_audit_journal();

CREATE TRIGGER audit_journals_update
  AFTER UPDATE ON gl_journals
  FOR EACH ROW EXECUTE FUNCTION trigger_audit_journal();

-- Period lock trigger
CREATE OR REPLACE FUNCTION trigger_audit_period()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO audit_log (
      tenant_id, entity_id, user_id, user_name, event_type,
      source_module, resource_type, resource_id, description,
      before_state, after_state
    ) VALUES (
      NEW.tenant_id, NEW.entity_id,
      COALESCE(NEW.locked_by, NEW.closed_by, '00000000-0000-0000-0000-000000000000'),
      'system',
      CASE
        WHEN NEW.status = 'locked' THEN 'period.locked'
        WHEN NEW.status = 'closed' THEN 'period.closed'
        WHEN NEW.status = 'open' AND OLD.status = 'locked' THEN 'period.unlocked'
        ELSE 'period.updated'
      END,
      'closeiq', 'period', NEW.id,
      'Period ' || NEW.year || '-' || LPAD(NEW.month::TEXT, 2, '0') || ' status: ' || NEW.status,
      row_to_json(OLD), row_to_json(NEW)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_periods_update
  AFTER UPDATE ON gl_periods
  FOR EACH ROW EXECUTE FUNCTION trigger_audit_period();
