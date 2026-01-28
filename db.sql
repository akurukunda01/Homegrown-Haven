-- -- Create the database
-- CREATE DATABASE business_directory;

-- -- Connect to the database
-- \c business_directory;

-- -- Create businesses table
-- CREATE TABLE businesses (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     category VARCHAR(100) NOT NULL,
--     description TEXT,
--     image VARCHAR(500),
--     rating DECIMAL(2, 1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
--     review_count INTEGER DEFAULT 0,
--     distance VARCHAR(50),
--     address VARCHAR(500),
--     phone VARCHAR(20),
--     email VARCHAR(255),
--     website VARCHAR(500),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Create reviews table
-- CREATE TABLE reviews (
--     id SERIAL PRIMARY KEY,
--     business_id INTEGER NOT NULL,
--     user_name VARCHAR(255) NOT NULL,
--     user_email VARCHAR(255),
--     rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
--     title VARCHAR(255),
--     comment TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
-- );
-- INSERT INTO businesses (name, category, description, image, distance, address, phone, email, website)
-- VALUES 
--     ('The Coffee House', 'Cafe', 'Cozy neighborhood cafe with artisan coffee and fresh pastries', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24', '0.5 mi', '123 Main St, City, State 12345', '(555) 123-4567', 'info@coffeehouse.com', 'https://coffeehouse.com'),
--     ('Tech Repair Pro', 'Electronics', 'Professional electronics repair service with same-day service available', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837', '1.2 mi', '456 Oak Ave, City, State 12345', '(555) 234-5678', 'support@techrepairpro.com', 'https://techrepairpro.com'),
--     ('Green Garden Restaurant', 'Restaurant', 'Farm-to-table dining with organic ingredients and seasonal menu', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', '0.8 mi', '789 Pine Rd, City, State 12345', '(555) 345-6789', 'reservations@greengarden.com', 'https://greengarden.com');

-- CREATE TABLE users (
--     id SERIAL PRIMARY KEY,
--     user_name VARCHAR(50) UNIQUE NOT NULL,
--     email VARCHAR(255) UNIQUE NOT NULL,
--     password_hash VARCHAR(255), 
--     first_name VARCHAR(100),
--     last_name VARCHAR(100),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
-- );

-- INSERT INTO users (user_name, email, password_hash, first_name, last_name)
-- VALUES
-- ('Aadi', 'aadi@example.com', 'password', 'Aadi', 'K')

-- ALTER TABLE reviews 
-- DROP COLUMN user_email,
-- DROP COLUMN user_name,
-- ADD COLUMN user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE;
-- INSERT INTO businesses (name, category, description, image, distance, address, phone, email, website)
-- VALUES
    -- ('Urban Threads Boutique', 'Clothing', 'Trendy boutique offering curated streetwear and sustainable fashion', 'https://images.unsplash.com/photo-1521335629791-ce4aec67dd47', '0.9 mi', '321 Elm St, City, State 12345', '(555) 456-7890', 'contact@urbanthreads.com', 'https://urbanthreads.com'),
    -- ('FreshFit Gym', 'Fitness', 'Modern gym with personal trainers, group classes, and state-of-the-art equipment', 'https://images.unsplash.com/photo-1554284126-aa88f22d8b74', '1.5 mi', '654 Maple Ave, City, State 12345', '(555) 567-8901', 'hello@freshfitgym.com', 'https://freshfitgym.com'),
    -- ('Bloom Flower Studio', 'Florist', 'Boutique florist specializing in custom arrangements and event decor', 'https://images.unsplash.com/photo-1526045612212-70caf35c14df', '0.7 mi', '987 Willow Blvd, City, State 12345', '(555) 678-9012', 'orders@bloomstudio.com', 'https://bloomstudio.com'),
    -- ('Pet Haven', 'Pet Care', 'Local pet grooming and boarding facility with experienced caretakers', 'https://images.unsplash.com/photo-1560807707-8cc77767d783', '1.0 mi', '159 Cedar St, City, State 12345', '(555) 789-0123', 'info@pethaven.com', 'https://pethaven.com'),
    -- ('Book Nook', 'Bookstore', 'Independent bookstore with cozy reading corners and weekly author events', 'https://images.unsplash.com/photo-1512820790803-83ca734da794', '0.4 mi', '753 Birch Rd, City, State 12345', '(555) 890-1234', 'hello@booknook.com', 'https://booknook.com'),
    -- ('Sunrise Yoga Studio', 'Wellness', 'Peaceful yoga studio offering classes for all levels and meditation sessions', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773', '0.6 mi', '842 Aspen Ln, City, State 12345', '(555) 901-2345', 'info@sunriseyoga.com', 'https://sunriseyoga.com'),
    -- ('City Cycle Co.', 'Bicycle Shop', 'Bike shop offering repairs, rentals, and eco-friendly commuting gear', 'https://images.unsplash.com/photo-1508606572321-901ea443707f', '1.3 mi', '268 Spruce St, City, State 12345', '(555) 234-6789', 'service@citycycleco.com', 'https://citycycleco.com'),
    -- ('The Artisan’s Table', 'Restaurant', 'Upscale restaurant with handcrafted dishes and locally sourced ingredients', 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092', '0.9 mi', '632 Walnut Ave, City, State 12345', '(555) 678-3456', 'reservations@artisanstable.com', 'https://artisanstable.com'),
    -- ('Pixel Print Shop', 'Printing', 'Full-service print shop for business cards, posters, and custom merchandise', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c', '1.1 mi', '411 Cherry Blvd, City, State 12345', '(555) 456-1122', 'orders@pixelprintshop.com', 'https://pixelprintshop.com'),
    -- ('Harmony Spa & Wellness', 'Spa', 'Luxury spa offering massages, facials, and holistic wellness treatments', 'https://images.unsplash.com/photo-1599058917212-d750089bc07d', '0.8 mi', '529 Magnolia Dr, City, State 12345', '(555) 334-2233', 'appointments@harmonyspa.com', 'https://harmonyspa.com');
 -- Add auth0_id column to users table
-- ALTER TABLE users 
-- ADD COLUMN auth0_id VARCHAR(255) UNIQUE;

-- -- Make password_hash nullable (since Auth0 handles passwords)
-- ALTER TABLE users 
-- ALTER COLUMN password_hash DROP NOT NULL;

-- -- Add avatar_url for profile picture from Auth0
-- ALTER TABLE users 
-- ADD COLUMN avatar_url VARCHAR(500);

-- -- Create index for faster Auth0 lookups
-- CREATE INDEX idx_users_auth0_id ON users(auth0_id);      

-- CREATE TABLE favorites (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     UNIQUE(user_id, business_id) -- Prevent duplicate favorites
-- );

-- -- Create indexes for faster queries
-- CREATE INDEX idx_favorites_user_id ON favorites(user_id);
-- CREATE INDEX idx_favorites_business_id ON favorites(business_id);
-- CREATE TABLE deals (
--     id SERIAL PRIMARY KEY,
--     business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
--     title VARCHAR(255) NOT NULL,
--     description TEXT,
--     discount_percentage INTEGER,
--     discount_amount DECIMAL(10, 2),
--     code VARCHAR(50),
--     end_date DATE,
--     is_active BOOLEAN DEFAULT TRUE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Add index
-- CREATE INDEX idx_deals_business_id ON deals(business_id);
-- CREATE INDEX idx_deals_active ON deals(is_active);
-- Insert sample deals for various businesses
-- INSERT INTO deals (business_id, title, description, discount_percentage, code, end_date, is_active)
-- VALUES
--     (1, '15% Off Your First Purchase', 'New customers get 15% off their first order of coffee and pastries', 15, 'FIRST15', '2025-12-31', TRUE),
--     (1, 'Free Pastry with Any Coffee', 'Buy any coffee and get a free pastry of your choice', NULL, 'FREEPASTRY', '2025-11-30', TRUE),
--     (2, '$20 Off Laptop Repair', 'Get $20 off any laptop repair service', NULL, 'LAPTOP20', '2025-12-15', TRUE),
--     (3, '20% Off Dinner for Two', 'Enjoy 20% off when dining for two or more', 20, 'DINNER20', '2025-11-25', TRUE),
--     (4, 'Buy One Get One 50% Off', 'Buy any item and get a second item at 50% off', 50, 'BOGO50', '2025-12-20', TRUE),
--     (5, 'First Month Free', 'New members get their first month of gym membership free', NULL, 'FIRSTFREE', '2025-11-30', TRUE),
--     (6, '$10 Off Flower Arrangements', 'Save $10 on custom flower arrangements over $50', NULL, 'BLOOM10', '2025-12-01', TRUE),
--     (7, 'Free Pet Grooming Add-on', 'Get a free nail trim with any grooming service', NULL, 'NAILFREE', '2025-12-31', TRUE),
--     (8, '25% Off All Books', 'Take 25% off any book in store', 25, 'BOOK25', '2025-11-20', TRUE),
--     (9, 'Free Yoga Class', 'Try your first yoga class free - no strings attached', NULL, 'FIRSTFREE', '2025-12-31', TRUE),
--     (10, '$15 Off Bike Tune-Up', 'Professional bike tune-up for $15 off regular price', NULL, 'TUNE15', '2025-12-10', TRUE);


-- INSERT INTO deals (business_id, title, description, discount_percentage, code, end_date, is_active)
-- VALUES
--     (1, 'Summer Special - Expired', 'This deal has ended', 10, 'SUMMER10', '2025-08-31', TRUE),
--     (3, 'Labor Day Deal - Expired', 'This deal has ended', 15, 'LABOR15', '2025-09-05', TRUE);

-- UPDATE businesses
-- SET image = CASE
--     WHEN name = 'Harmony Spa & Wellness' THEN 'https://images.unsplash.com/photo-1556228453-efd6f2a6efcf'
--     WHEN name = 'Urban Threads Boutique' THEN 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c'
-- END
-- WHERE name IN ('Harmony Spa & Wellness', 'Urban Threads Boutique');

-- DELETE FROM businesses
-- WHERE LOWER(TRIM(name)) = 'harmony spa & wellness';
-- ALTER TABLE businesses 
-- ADD COLUMN latitude DECIMAL(10, 8),
-- ADD COLUMN longitude DECIMAL(11, 8);

-- -- Create index for faster distance queries
-- CREATE INDEX idx_businesses_location ON businesses(latitude, longitude);

UPDATE businesses SET
    latitude = 40.2859 + (random() * 0.02 - 0.01),  -- Vary by ~1 mile
    longitude = -76.6502 + (random() * 0.02 - 0.01)
 WHERE latitude IS NOT NULL;