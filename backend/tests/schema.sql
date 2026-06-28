-- Self-contained schema + deterministic seed data for the automated test
-- database (business_directory_test). This mirrors the live `business_directory`
-- structure (see backend/db/database_er.svg) but uses fixed, known seed rows so
-- the API integration tests are reproducible and order-independent.
--
-- The conftest.py fixture DROPs/CREATEs business_directory_test and runs this
-- file once per test session. It NEVER touches the real business_directory DB.

-- ---------------------------------------------------------------- schema ----

CREATE TABLE businesses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    rating NUMERIC(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    distance VARCHAR(50),
    address VARCHAR(500),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auth0_id VARCHAR(255) UNIQUE,
    avatar_url TEXT
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, business_id)
);

CREATE TABLE deals (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percentage INTEGER,
    discount_amount NUMERIC(10,2),
    code VARCHAR(50),
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_businesses_location ON businesses (latitude, longitude);
CREATE INDEX idx_users_auth0_id ON users (auth0_id);
CREATE INDEX idx_favorites_user_id ON favorites (user_id);
CREATE INDEX idx_favorites_business_id ON favorites (business_id);
CREATE INDEX idx_deals_business_id ON deals (business_id);
CREATE INDEX idx_deals_active ON deals (is_active);

-- ------------------------------------------------------------------ seed ----
-- Inserted without explicit ids so SERIAL assigns 1, 2, 3 ... deterministically
-- on a fresh database. Coordinates are fixed (no randomness) so distance-based
-- assertions are stable.

INSERT INTO businesses (name, category, description, rating, review_count, latitude, longitude) VALUES
    ('Test Coffee House',      'Cafe',       'Cozy seeded cafe',         4.5, 1, 40.28590000, -76.65020000),  -- id 1
    ('Test Tech Repair',       'Electronics','Seeded electronics shop',  3.0, 0, 40.30000000, -76.60000000),  -- id 2
    ('Test Garden Restaurant', 'Restaurant', 'Seeded farm-to-table',     4.8, 0, 40.29000000, -76.65500000);  -- id 3

INSERT INTO users (user_name, email, auth0_id, first_name, last_name) VALUES
    ('testuser',  'testuser@example.com', 'auth0|testuser',  'Test',  'User'),   -- id 1
    ('otheruser', 'other@example.com',    'auth0|otheruser', 'Other', 'User');   -- id 2

-- Active deals. end_date NULL => always active regardless of CURRENT_DATE.
INSERT INTO deals (business_id, title, description, discount_percentage, code, end_date, is_active) VALUES
    (1, '15% Off First Order', 'Seeded active deal', 15, 'FIRST15', NULL, TRUE),
    (2, '$20 Off Repair',      'Seeded active deal', NULL, 'LAPTOP20', NULL, TRUE);

-- One existing review on business 1 by user 1.
INSERT INTO reviews (business_id, user_id, rating, comment) VALUES
    (1, 1, 5, 'Seeded review comment for testing.');
