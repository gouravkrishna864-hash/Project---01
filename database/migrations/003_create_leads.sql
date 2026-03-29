-- ─── Leads Table ─────────────────────────────────────────────────────────────
CREATE TYPE lead_status AS ENUM (
    'new', 'contacted', 'site_visit_scheduled',
    'site_visit_done', 'negotiating', 'deal_closed', 'lost'
);
CREATE TYPE lead_priority AS ENUM ('hot', 'warm', 'cold');
CREATE TYPE lead_source   AS ENUM ('search', 'recommendation', 'direct', 'referral', 'whatsapp');

CREATE TABLE leads (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id         UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    broker_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    status              lead_status NOT NULL DEFAULT 'new',
    ai_score            FLOAT NOT NULL DEFAULT 0 CHECK (ai_score BETWEEN 0 AND 100),
    score_factors       JSONB NOT NULL DEFAULT '{}',
    priority            lead_priority NOT NULL DEFAULT 'cold',
    source              lead_source NOT NULL DEFAULT 'search',

    budget              BIGINT,
    notes               TEXT,
    follow_up_date      TIMESTAMPTZ,
    last_contacted_at   TIMESTAMPTZ,
    visit_scheduled_at  TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate active leads for same user+property
    UNIQUE (user_id, property_id)
);

-- Indexes
CREATE INDEX idx_leads_user ON leads(user_id);
CREATE INDEX idx_leads_property ON leads(property_id);
CREATE INDEX idx_leads_broker ON leads(broker_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_followup ON leads(follow_up_date) WHERE follow_up_date IS NOT NULL;
CREATE INDEX idx_leads_score ON leads(ai_score DESC);

CREATE TRIGGER leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-set priority based on AI score
CREATE OR REPLACE FUNCTION set_lead_priority()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ai_score >= 75 THEN
        NEW.priority = 'hot';
    ELSIF NEW.ai_score >= 45 THEN
        NEW.priority = 'warm';
    ELSE
        NEW.priority = 'cold';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_auto_priority
    BEFORE INSERT OR UPDATE OF ai_score ON leads
    FOR EACH ROW EXECUTE FUNCTION set_lead_priority();
