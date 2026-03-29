-- ─── Development Seed Data ───────────────────────────────────────────────────
-- Only run in development / staging environments.

-- Admin user (password: Admin@12345)
INSERT INTO users (id, name, email, phone, password_hash, role, city, is_verified, is_active) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'REOS Admin',
    'admin@reos.in',
    '9000000001',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMZJaaaSwm.CWV2eJhMQEMeSx2', -- Admin@12345
    'admin',
    'Mumbai',
    TRUE,
    TRUE
);

-- Sample broker
INSERT INTO users (id, name, email, phone, password_hash, role, city, is_verified, rera_number) VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'Rajesh Kapoor',
    'rajesh@broker.com',
    '9876543210',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMZJaaaSwm.CWV2eJhMQEMeSx2',
    'broker',
    'Pune',
    TRUE,
    'MH-RERA-12345'
);

-- Sample buyer
INSERT INTO users (id, name, email, phone, password_hash, role, city, preferences) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'Priya Sharma',
    'priya@buyer.com',
    '9123456789',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMZJaaaSwm.CWV2eJhMQEMeSx2',
    'buyer',
    'Pune',
    '{"budget_max": 7000000, "bedrooms": [2, 3], "preferred_cities": ["Pune"]}'
);

-- Sample properties
INSERT INTO properties (id, title, description, type, listing_type, price, area_sqft, bedrooms, bathrooms, floor, total_floors, furnishing, address, locality, city, state, pincode, latitude, longitude, status, is_verified, is_featured, amenities, broker_id) VALUES
(
    'p0000000-0000-0000-0000-000000000001',
    '2BHK Premium Apartment in Kothrud',
    'Spacious 2BHK apartment in prime Kothrud location with all modern amenities. Close to Kothrud metro station.',
    'apartment', 'sale', 6500000, 950, 2, 2, 5, 12, 'semi-furnished',
    'Rainbow Residency, Paud Road', 'Kothrud', 'Pune', 'Maharashtra', '411038',
    18.5074, 73.8077,
    'active', TRUE, TRUE,
    '["gym", "parking", "security", "power_backup", "lift"]',
    'b0000000-0000-0000-0000-000000000001'
),
(
    'p0000000-0000-0000-0000-000000000002',
    '3BHK Villa in Baner with Private Garden',
    'Luxurious independent villa in Baner with private garden, modular kitchen, and premium fittings.',
    'villa', 'sale', 12500000, 2200, 3, 3, 1, 2, 'fully-furnished',
    '14, Green Valley, Baner Road', 'Baner', 'Pune', 'Maharashtra', '411045',
    18.5590, 73.7741,
    'active', TRUE, TRUE,
    '["garden", "parking", "security", "gym", "swimming_pool"]',
    'b0000000-0000-0000-0000-000000000001'
),
(
    'p0000000-0000-0000-0000-000000000003',
    '1BHK Flat for Rent near Hinjewadi IT Park',
    'Well-maintained 1BHK flat for rent near Hinjewadi IT Park. Ideal for IT professionals.',
    'apartment', 'rent', 18000, 550, 1, 1, 3, 7, 'semi-furnished',
    'Sunrise Apartments, Phase 1', 'Hinjewadi', 'Pune', 'Maharashtra', '411057',
    18.5912, 73.7389,
    'active', TRUE, FALSE,
    '["parking", "security", "wifi_ready"]',
    'b0000000-0000-0000-0000-000000000001'
);
