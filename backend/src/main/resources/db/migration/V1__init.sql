CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    role            VARCHAR(20)  NOT NULL DEFAULT 'GUEST',
    is_host         BOOLEAN      NOT NULL DEFAULT FALSE,
    superhost       BOOLEAN      NOT NULL DEFAULT FALSE,
    avg_guest_rating NUMERIC(3,2) DEFAULT 0,
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE properties (
    id               BIGSERIAL PRIMARY KEY,
    host_id          BIGINT       NOT NULL REFERENCES users(id),
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    property_type    VARCHAR(50)  NOT NULL,
    category         VARCHAR(50)  NOT NULL DEFAULT 'CITY',
    address          VARCHAR(500) NOT NULL,
    city             VARCHAR(100) NOT NULL,
    state            VARCHAR(100) NOT NULL,
    country          VARCHAR(100) NOT NULL DEFAULT 'India',
    zip_code         VARCHAR(20),
    latitude         NUMERIC(10,7),
    longitude        NUMERIC(10,7),
    price_per_night  NUMERIC(10,2) NOT NULL,
    weekend_price    NUMERIC(10,2),
    cleaning_fee     NUMERIC(10,2) NOT NULL DEFAULT 800,
    long_stay_discount NUMERIC(5,2) DEFAULT 0,
    max_guests       INT          NOT NULL DEFAULT 1,
    bedrooms         INT          NOT NULL DEFAULT 1,
    bathrooms        INT          NOT NULL DEFAULT 1,
    beds             INT          NOT NULL DEFAULT 1,
    instant_book     BOOLEAN      NOT NULL DEFAULT TRUE,
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    avg_rating       NUMERIC(3,2) DEFAULT 0,
    total_reviews    INT          DEFAULT 0,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE property_amenities (
    property_id BIGINT      NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amenity     VARCHAR(100) NOT NULL,
    PRIMARY KEY (property_id, amenity)
);

CREATE TABLE property_images (
    id          BIGSERIAL PRIMARY KEY,
    property_id BIGINT       NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    image_url   VARCHAR(500) NOT NULL,
    is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order  INT          DEFAULT 0
);

CREATE TABLE property_availability (
    id           BIGSERIAL PRIMARY KEY,
    property_id  BIGINT  NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    date         DATE    NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    custom_price NUMERIC(10,2),
    UNIQUE (property_id, date)
);

CREATE TABLE bookings (
    id              BIGSERIAL PRIMARY KEY,
    reference_id    VARCHAR(20)   NOT NULL UNIQUE,
    property_id     BIGINT        NOT NULL REFERENCES properties(id),
    guest_id        BIGINT        NOT NULL REFERENCES users(id),
    check_in        DATE          NOT NULL,
    check_out       DATE          NOT NULL,
    guests          INT           NOT NULL DEFAULT 1,
    nights          INT           NOT NULL,
    base_amount     NUMERIC(10,2) NOT NULL,
    cleaning_fee    NUMERIC(10,2) NOT NULL,
    service_fee     NUMERIC(10,2) NOT NULL,
    total_amount    NUMERIC(10,2) NOT NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    booking_type    VARCHAR(20)   NOT NULL DEFAULT 'INSTANT',
    message         TEXT,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_dates CHECK (check_out > check_in)
);

CREATE TABLE reviews (
    id            BIGSERIAL PRIMARY KEY,
    booking_id    BIGINT    NOT NULL UNIQUE REFERENCES bookings(id),
    property_id   BIGINT    NOT NULL REFERENCES properties(id),
    guest_id      BIGINT    NOT NULL REFERENCES users(id),
    cleanliness   INT       NOT NULL CHECK (cleanliness BETWEEN 1 AND 5),
    communication INT       NOT NULL CHECK (communication BETWEEN 1 AND 5),
    checkin       INT       NOT NULL CHECK (checkin BETWEEN 1 AND 5),
    location      INT       NOT NULL CHECK (location BETWEEN 1 AND 5),
    value         INT       NOT NULL CHECK (value BETWEEN 1 AND 5),
    accuracy      INT       NOT NULL CHECK (accuracy BETWEEN 1 AND 5),
    overall       NUMERIC(3,2) NOT NULL,
    comment       TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE wishlists (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, property_id)
);

CREATE TABLE notifications (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    message      TEXT         NOT NULL,
    type         VARCHAR(50)  NOT NULL,
    is_read      BOOLEAN      NOT NULL DEFAULT FALSE,
    reference_id BIGINT,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(512) NOT NULL UNIQUE,
    expires_at TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Seed admin user (password: Admin@123)
INSERT INTO users (email, password, full_name, role, is_host, superhost, enabled) VALUES
('admin@stayfinder.com', '$2a$12$LqIBFiUJjS5Hf7vlMEJfOeZmHunFDLQ3q8QwfpHqJPFuOoaOvBpGG', 'Platform Admin', 'ADMIN', false, false, true),
('host@stayfinder.com',  '$2a$12$LqIBFiUJjS5Hf7vlMEJfOeZmHunFDLQ3q8QwfpHqJPFuOoaOvBpGG', 'Anuj Kumar', 'GUEST', true, true, true),
('guest@stayfinder.com', '$2a$12$LqIBFiUJjS5Hf7vlMEJfOeZmHunFDLQ3q8QwfpHqJPFuOoaOvBpGG', 'Demo Guest', 'GUEST', false, false, true);

-- Seed sample property
INSERT INTO properties (host_id, title, description, property_type, category, address, city, state, price_per_night, weekend_price, cleaning_fee, max_guests, bedrooms, bathrooms, beds, instant_book, status, avg_rating, total_reviews)
VALUES (2, 'Cozy Studio with Sea View', 'Beautiful studio apartment in the heart of Bandra with stunning sea view. Perfect for couples or solo travelers.', 'ENTIRE_HOME', 'CITY', 'Linking Road, Bandra West', 'Mumbai', 'Maharashtra', 4200, 5000, 800, 2, 1, 1, 1, true, 'APPROVED', 4.92, 48);

INSERT INTO property_amenities (property_id, amenity) VALUES
(1,'WIFI'),(1,'AC'),(1,'KITCHEN'),(1,'TV'),(1,'PARKING'),(1,'SEA_VIEW'),(1,'WASHER'),(1,'IRON');

INSERT INTO property_images (property_id, image_url, is_primary, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', true, 0),
(1, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', false, 1),
(1, 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', false, 2);

-- Indexes
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_host_id ON properties(host_id);
CREATE INDEX idx_properties_price ON properties(price_per_night);
CREATE INDEX idx_properties_category ON properties(category);
CREATE INDEX idx_bookings_property_id ON bookings(property_id);
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_reviews_property_id ON reviews(property_id);
CREATE INDEX idx_availability_property_date ON property_availability(property_id, date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read);

-- =============================================
-- ADDITIONAL SEED USERS (password: Admin@123)
-- =============================================
INSERT INTO users (email, password, full_name, role, is_host, superhost, enabled) VALUES
('priya@stayfinder.com',  '$2a$12$LqIBFiUJjS5Hf7vlMEJfOeZmHunFDLQ3q8QwfpHqJPFuOoaOvBpGG', 'Priya Sharma',  'GUEST', true,  true,  true),
('rahul@stayfinder.com',  '$2a$12$LqIBFiUJjS5Hf7vlMEJfOeZmHunFDLQ3q8QwfpHqJPFuOoaOvBpGG', 'Rahul Mehta',   'GUEST', true,  false, true),
('sneha@stayfinder.com',  '$2a$12$LqIBFiUJjS5Hf7vlMEJfOeZmHunFDLQ3q8QwfpHqJPFuOoaOvBpGG', 'Sneha Patel',   'GUEST', false, false, true);

-- =============================================
-- 25 PROPERTIES ACROSS INDIA
-- host_id 2 = Anuj Kumar (superhost)
-- host_id 4 = Priya Sharma (superhost)
-- host_id 5 = Rahul Mehta
-- =============================================
INSERT INTO properties (host_id,title,description,property_type,category,address,city,state,country,price_per_night,weekend_price,cleaning_fee,max_guests,bedrooms,bathrooms,beds,instant_book,status,avg_rating,total_reviews,created_at,updated_at) VALUES

-- BEACH (3)
(2,'Luxury Beach Villa','Stunning beachfront villa with private pool just steps from Baga beach. Perfect for family vacations.','ENTIRE_HOME','BEACH','Baga Beach Road','Goa','Goa','India',8500,10000,800,6,3,2,3,true,'APPROVED',4.85,120,NOW(),NOW()),
(4,'Seaside Cottage Retreat','Cozy cottage with direct sea access and hammocks. Wake up to the sound of waves every morning.','ENTIRE_HOME','BEACH','Kovalam Beach Lane','Thiruvananthapuram','Kerala','India',4500,5500,600,4,2,1,2,true,'APPROVED',4.72,88,NOW(),NOW()),
(5,'Beach Shack Studio','Funky studio ideal for solo travellers or couples. Surf lessons available nearby.','ENTIRE_HOME','BEACH','Palolem Beach','Canacona','Goa','India',2800,3500,400,2,1,1,1,true,'APPROVED',4.60,65,NOW(),NOW()),

-- MOUNTAIN (3)
(2,'Mountain Cabin Retreat','Peaceful pine-wood cabin with fireplace and panoramic Himalayan views.','ENTIRE_HOME','MOUNTAIN','Old Manali','Manali','Himachal Pradesh','India',4200,5000,600,4,2,1,2,true,'APPROVED',4.78,95,NOW(),NOW()),
(4,'Himalayan Eco Lodge','Off-grid eco lodge powered by solar. Stunning trekking trails and stargazing every night.','ENTIRE_HOME','MOUNTAIN','Tirthan Valley','Banjar','Himachal Pradesh','India',3600,4200,500,4,2,1,2,true,'APPROVED',4.91,143,NOW(),NOW()),
(5,'Coorg Coffee Estate Home','Beautiful bungalow inside a working coffee plantation. Morning coffee tours included.','ENTIRE_HOME','MOUNTAIN','Madikeri Road','Coorg','Karnataka','India',5800,6500,700,6,3,2,3,true,'APPROVED',4.83,112,NOW(),NOW()),

-- CITY (5)
(2,'Modern City Apartment','Sleek studio in the heart of Bangalore, walking distance to MG Road and Cubbon Park.','ENTIRE_HOME','CITY','MG Road','Bangalore','Karnataka','India',3200,3800,500,3,1,1,1,true,'APPROVED',4.65,88,NOW(),NOW()),
(4,'Luxury Penthouse Mumbai','Top-floor penthouse with 360° skyline views, rooftop access, and valet parking.','ENTIRE_HOME','CITY','Bandra Kurla Complex','Mumbai','Maharashtra','India',9500,11000,1000,6,3,2,3,true,'APPROVED',4.92,200,NOW(),NOW()),
(5,'Stylish Delhi Loft','Industrial-chic loft in Hauz Khas Village, surrounded by cafes and art galleries.','ENTIRE_HOME','CITY','Hauz Khas Village','New Delhi','Delhi','India',4800,5500,600,4,2,1,2,true,'APPROVED',4.70,77,NOW(),NOW()),
(2,'Pune Budget Private Room','Affordable private room near Hinjewadi IT Park. Great for work trips.','PRIVATE_ROOM','CITY','Hinjewadi Phase 1','Pune','Maharashtra','India',1200,1500,200,2,1,1,1,true,'APPROVED',4.42,55,NOW(),NOW()),
(5,'Hyderabad Shared Studio','Budget-friendly studio near HITEC City. Perfect for short business trips.','SHARED_ROOM','CITY','HITEC City','Hyderabad','Telangana','India',900,1100,150,2,1,1,1,true,'APPROVED',4.30,40,NOW(),NOW()),

-- COUNTRYSIDE (3)
(4,'Countryside Farmhouse','Stay on a working grape farm. Wine tasting, nature walks, and authentic village food.','ENTIRE_HOME','COUNTRYSIDE','Gangapur Road','Nashik','Maharashtra','India',2800,3400,500,4,2,1,2,true,'APPROVED',4.62,75,NOW(),NOW()),
(5,'Kutch Desert Camp','Luxurious tent stay in the Rann of Kutch. White desert, folk music, and stargazing.','ENTIRE_HOME','COUNTRYSIDE','Rann of Kutch','Bhuj','Gujarat','India',6500,7500,800,4,2,1,2,true,'APPROVED',4.88,98,NOW(),NOW()),
(2,'Pondicherry French Villa','Restored French colonial villa with courtyard garden in White Town.','ENTIRE_HOME','COUNTRYSIDE','White Town','Pondicherry','Puducherry','India',5200,6000,700,6,3,2,3,true,'APPROVED',4.75,102,NOW(),NOW()),

-- LAKEFRONT (3)
(4,'Lakefront Cottage Udaipur','Romantic cottage with private lake-view balcony. Boat rides and sunset dinners on request.','ENTIRE_HOME','LAKEFRONT','Pichola Lake Road','Udaipur','Rajasthan','India',5400,6200,700,5,2,2,2,true,'APPROVED',4.93,150,NOW(),NOW()),
(5,'Dal Lake Houseboat','Traditional Kashmiri houseboat on Dal Lake. Shikara rides and wazwan dinners included.','ENTIRE_HOME','LAKEFRONT','Dal Lake','Srinagar','Jammu & Kashmir','India',7800,9000,900,6,3,2,3,true,'APPROVED',4.90,135,NOW(),NOW()),
(2,'Alleppey Backwater Home','Traditional Kerala home on the backwaters. Watch rice barges drift by from your sit-out.','ENTIRE_HOME','LAKEFRONT','Alleppey Backwaters','Alappuzha','Kerala','India',4900,5800,650,4,2,1,2,true,'APPROVED',4.80,118,NOW(),NOW()),

-- UNIQUE (3)
(4,'Treehouse Wayanad','Sleep among giant trees. Rope bridges, jungle safaris, and bird watching.','ENTIRE_HOME','UNIQUE','Vythiri Forest','Wayanad','Kerala','India',6300,7200,800,4,2,1,2,true,'APPROVED',4.96,130,NOW(),NOW()),
(5,'Cave Suite Aurangabad','Luxury cave-inspired suite carved into rock near the Ajanta Caves.','ENTIRE_HOME','UNIQUE','Ajanta Road','Aurangabad','Maharashtra','India',7500,8500,900,4,2,2,2,true,'APPROVED',4.85,90,NOW(),NOW()),
(2,'Vintage Railway Carriage','Sleep in a beautifully restored railway carriage in the Thar desert. One of a kind.','ENTIRE_HOME','UNIQUE','Desert Area','Jodhpur','Rajasthan','India',5500,6200,750,4,2,1,2,true,'APPROVED',4.78,72,NOW(),NOW()),

-- HERITAGE (3)
(4,'Heritage Haveli Jaipur','Royal haveli in the Pink City with traditional frescoes, courtyard, and rooftop dining.','ENTIRE_HOME','HERITAGE','Old City','Jaipur','Rajasthan','India',7200,8200,900,6,3,2,3,true,'APPROVED',4.88,110,NOW(),NOW()),
(5,'Colonial Bungalow Shimla','Original British-era bungalow with stone fireplace, oak floors, and Mall Road views.','ENTIRE_HOME','HERITAGE','Mall Road','Shimla','Himachal Pradesh','India',6800,7800,850,6,3,2,3,true,'APPROVED',4.81,95,NOW(),NOW()),
(2,'Mysore Palace Retreat','Palatial guesthouse in the royal Palace grounds. Heritage walks and classical dance shows.','ENTIRE_HOME','HERITAGE','Palace Road','Mysore','Karnataka','India',8900,10000,1000,8,4,3,4,true,'APPROVED',4.94,160,NOW(),NOW()),

-- CAMPING (2)
(4,'Rishikesh Riverside Camp','Luxury tent on the Ganges bank. Rafting, bungee jumping, and yoga sessions available.','SHARED_ROOM','CAMPING','Shivpuri Beach','Rishikesh','Uttarakhand','India',1500,2000,300,2,1,1,1,true,'APPROVED',4.55,60,NOW(),NOW()),
(5,'Spiti Valley Star Camp','High-altitude camp at 4400m. See the Milky Way like you have never before.','ENTIRE_HOME','CAMPING','Kaza Village','Kaza','Himachal Pradesh','India',2200,2800,400,4,2,1,2,true,'APPROVED',4.70,48,NOW(),NOW());

-- =============================================
-- AMENITIES FOR ALL NEW PROPERTIES
-- property IDs 2-26 (IDs after original property 1)
-- =============================================
INSERT INTO property_amenities (property_id, amenity) VALUES
-- Goa Beach Villa (2)
(2,'WIFI'),(2,'POOL'),(2,'AC'),(2,'KITCHEN'),(2,'PARKING'),(2,'BBQ'),(2,'BALCONY'),
-- Kovalam Cottage (3)
(3,'WIFI'),(3,'AC'),(3,'KITCHEN'),(3,'SEA_VIEW'),(3,'BALCONY'),
-- Palolem Shack (4)
(4,'WIFI'),(4,'SEA_VIEW'),(4,'KITCHEN'),
-- Manali Cabin (5)
(5,'WIFI'),(5,'KITCHEN'),(5,'TV'),(5,'WORKSPACE'),
-- Tirthan Eco Lodge (6)
(6,'WIFI'),(6,'KITCHEN'),(6,'BALCONY'),
-- Coorg Estate (7)
(7,'WIFI'),(7,'POOL'),(7,'KITCHEN'),(7,'PARKING'),(7,'BBQ'),
-- Bangalore Apt (8)
(8,'WIFI'),(8,'AC'),(8,'KITCHEN'),(8,'TV'),(8,'WORKSPACE'),
-- Mumbai Penthouse (9)
(9,'WIFI'),(9,'POOL'),(9,'AC'),(9,'KITCHEN'),(9,'PARKING'),(9,'GYM'),(9,'BALCONY'),
-- Delhi Loft (10)
(10,'WIFI'),(10,'AC'),(10,'KITCHEN'),(10,'TV'),(10,'WORKSPACE'),
-- Pune Room (11)
(11,'WIFI'),(11,'AC'),(11,'TV'),
-- Hyderabad Studio (12)
(12,'WIFI'),(12,'AC'),(12,'TV'),
-- Nashik Farmhouse (13)
(13,'WIFI'),(13,'KITCHEN'),(13,'PARKING'),(13,'BBQ'),
-- Kutch Camp (14)
(14,'WIFI'),(14,'KITCHEN'),
-- Pondicherry Villa (15)
(15,'WIFI'),(15,'AC'),(15,'KITCHEN'),(15,'POOL'),(15,'BALCONY'),
-- Udaipur Cottage (16)
(16,'WIFI'),(16,'AC'),(16,'KITCHEN'),(16,'BALCONY'),
-- Dal Houseboat (17)
(17,'WIFI'),(17,'KITCHEN'),(17,'SEA_VIEW'),
-- Alleppey Home (18)
(18,'WIFI'),(18,'KITCHEN'),(18,'BALCONY'),
-- Wayanad Treehouse (19)
(19,'WIFI'),(19,'KITCHEN'),
-- Aurangabad Cave (20)
(20,'WIFI'),(20,'AC'),(20,'KITCHEN'),(20,'HOT_TUB'),
-- Jodhpur Carriage (21)
(21,'WIFI'),(21,'AC'),(21,'KITCHEN'),
-- Jaipur Haveli (22)
(22,'WIFI'),(22,'AC'),(22,'KITCHEN'),(22,'POOL'),(22,'PARKING'),
-- Shimla Bungalow (23)
(23,'WIFI'),(23,'KITCHEN'),(23,'TV'),(23,'PARKING'),
-- Mysore Retreat (24)
(24,'WIFI'),(24,'POOL'),(24,'AC'),(24,'KITCHEN'),(24,'PARKING'),(24,'GYM'),
-- Rishikesh Camp (25)
(25,'WIFI'),(25,'KITCHEN'),
-- Spiti Camp (26)
(26,'WIFI'),(26,'KITCHEN');

-- =============================================
-- PROPERTY IMAGES (Unsplash — realistic photos)
-- =============================================
INSERT INTO property_images (property_id, image_url, is_primary, sort_order) VALUES
(2,  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', true,  0),
(2,  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800', false, 1),
(3,  'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800', true,  0),
(4,  'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800', true,  0),
(5,  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', true,  0),
(5,  'https://images.unsplash.com/photo-1551882547-ff40c63fe2fa?w=800', false, 1),
(6,  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800', true,  0),
(7,  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', true,  0),
(8,  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', true,  0),
(9,  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', true,  0),
(9,  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', false, 1),
(10, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', true,  0),
(11, 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800', true,  0),
(12, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800', true,  0),
(13, 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=800', true,  0),
(14, 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800', true,  0),
(15, 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800', true,  0),
(15, 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800', false, 1),
(16, 'https://images.unsplash.com/photo-1439130490301-25e322d88054?w=800', true,  0),
(17, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', true,  0),
(18, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', true,  0),
(19, 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800', true,  0),
(19, 'https://images.unsplash.com/photo-1502780809386-a2e4dfabe7d4?w=800', false, 1),
(20, 'https://images.unsplash.com/photo-1578645510447-e20b4311e3ce?w=800', true,  0),
(21, 'https://images.unsplash.com/photo-1570213489059-0aac6626cade?w=800', true,  0),
(22, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', true,  0),
(22, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', false, 1),
(23, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', true,  0),
(24, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', true,  0),
(24, 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800', false, 1),
(25, 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800', true,  0),
(26, 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800', true,  0);
