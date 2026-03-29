-- ─── Transactions Table ───────────────────────────────────────────────────────
CREATE TYPE transaction_status AS ENUM (
    'offer_made', 'counter_offer', 'accepted',
    'agreement_signed', 'loan_applied', 'registration_done',
    'completed', 'cancelled'
);

CREATE TABLE transactions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id             UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    buyer_id                UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    broker_id               UUID REFERENCES users(id) ON DELETE SET NULL,

    offer_price             BIGINT NOT NULL CHECK (offer_price > 0),
    final_price             BIGINT CHECK (final_price > 0),
    status                  transaction_status NOT NULL DEFAULT 'offer_made',

    timeline                JSONB NOT NULL DEFAULT '[]',
    documents               JSONB NOT NULL DEFAULT '[]',
    loan_details            JSONB,

    broker_commission       BIGINT,
    reos_fee                BIGINT,

    expected_closure_date   DATE,
    completed_at            TIMESTAMPTZ,
    notes                   TEXT,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_property ON transactions(property_id);
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_broker ON transactions(broker_id);
CREATE INDEX idx_transactions_status ON transactions(status);

CREATE TRIGGER transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- On deal complete, mark property sold/rented
CREATE OR REPLACE FUNCTION on_transaction_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
        UPDATE properties
        SET status = CASE
            WHEN listing_type = 'rent' THEN 'rented'::property_status
            ELSE 'sold'::property_status
        END
        WHERE id = NEW.property_id;

        NEW.completed_at = NOW();
        -- Compute platform fee (0.5%) and broker commission (2%)
        IF NEW.final_price IS NOT NULL THEN
            NEW.reos_fee = ROUND(NEW.final_price * 0.005);
            NEW.broker_commission = ROUND(NEW.final_price * 0.02);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_on_complete
    BEFORE UPDATE OF status ON transactions
    FOR EACH ROW EXECUTE FUNCTION on_transaction_complete();

-- ─── Revenue Reporting View ───────────────────────────────────────────────────
CREATE VIEW revenue_summary AS
SELECT
    DATE_TRUNC('month', completed_at) AS month,
    COUNT(*) AS deals_closed,
    SUM(final_price) AS total_gmv,
    SUM(reos_fee) AS platform_revenue,
    SUM(broker_commission) AS broker_payouts,
    AVG(final_price) AS avg_deal_size
FROM transactions
WHERE status = 'completed'
GROUP BY month
ORDER BY month DESC;
