-- ─── Properties Table ────────────────────────────────────────────────────────
CREATE TYPE property_type     AS ENUM ('apartment', 'villa', 'plot', 'commercial', 'pg', 'house');
CREATE TYPE listing_type      AS ENUM ('sale', 'rent');
CREATE TYPE property_status   AS ENUM ('active', 'sold', 'rented', 'inactive', 'pending_review');
CREATE TYPE furnishing_type   AS ENUM ('unfurnished', 'semi-furnished', 'fully-furnished');

CREATE TABLE properties (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    type                property_type NOT NULL,
    listing_type        listing_type NOT NULL DEFAULT 'sale',

    -- Pricing
    price               BIGINT NOT NULL,
    price_per_sqft      INTEGER,
    area_sqft           FLOAT NOT NULL,

    -- Specification
    bedrooms            SMALLINT,
    bathrooms           SMALLINT,
    floor               SMALLINT,
    total_floors        SMALLINT,
    furnishing          furnishing_type DEFAULT 'unfurnished',

    -- Location
    address             VARCHAR(500) NOT NULL,
    locality            VARCHAR(150) NOT NULL,
    city                VARCHAR(100) NOT NULL,
    state               VARCHAR(100) NOT NULL,
    pincode             VARCHAR(10),
    latitude            FLOAT,
    longitude           FLOAT,

    -- Media
    images              JSONB NOT NULL DEFAULT '[]',
    video_url           VARCHAR(500),
    virtual_tour_url    VARCHAR(500),

    -- Status & Meta
    status              property_status NOT NULL DEFAULT 'pending_review',
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
    amenities           JSONB NOT NULL DEFAULT '[]',
    nearby_facilities   JSONB NOT NULL DEFAULT '{}',
    price_history       JSONB NOT NULL DEFAULT '[]',

    -- Analytics
    views_count         INTEGER NOT NULL DEFAULT 0,
    leads_count         INTEGER NOT NULL DEFAULT 0,

    -- Relationships
    broker_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    builder_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    rera_number         VARCHAR(50),
    possession_date     DATE,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_props_city ON properties(city);
CREATE INDEX idx_props_locality ON properties(locality);
CREATE INDEX idx_props_type ON properties(type);
CREATE INDEX idx_props_listing_type ON properties(listing_type);
CREATE INDEX idx_props_status ON properties(status);
CREATE INDEX idx_props_price ON properties(price);
CREATE INDEX idx_props_broker ON properties(broker_id);
CREATE INDEX idx_props_featured ON properties(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_props_geo ON properties(latitude, longitude) WHERE latitude IS NOT NULL;

-- Full-text search index
CREATE INDEX idx_props_fts ON properties
    USING GIN(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(locality,'') || ' ' || coalesce(city,'')));

-- Trigram index for fuzzy search
CREATE INDEX idx_props_city_trgm ON properties USING GIN(city gin_trgm_ops);
CREATE INDEX idx_props_locality_trgm ON properties USING GIN(locality gin_trgm_ops);

CREATE TRIGGER properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-compute price_per_sqft
CREATE OR REPLACE FUNCTION compute_price_per_sqft()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.price > 0 AND NEW.area_sqft > 0 THEN
        NEW.price_per_sqft = ROUND(NEW.price / NEW.area_sqft);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_price_psf
    BEFORE INSERT OR UPDATE OF price, area_sqft ON properties
    FOR EACH ROW EXECUTE FUNCTION compute_price_per_sqft();
