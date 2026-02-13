-- Homegym Database Schema
-- Created for online ordering system

-- Create database
CREATE DATABASE IF NOT EXISTS homegym;
USE homegym;

-- Create tables
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_th VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    is_popular BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(200),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'credit', 'transfer') NOT NULL,
    order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    special_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    discount_percent DECIMAL(5,2),
    discount_amount DECIMAL(10,2),
    promo_code VARCHAR(50) UNIQUE,
    start_date DATETIME,
    end_date DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data

-- Categories
INSERT INTO categories (name, name_th, description) VALUES
('Weight Training', 'อุปกรณ์เสริมสร้างกล้ามเนื้อ', 'ดัมเบล, บาร์เบล, และอื่นๆ'),
('Cardio', 'อุปกรณ์คาร์ดิโอ', 'ลู่วิ่ง, จักรยานออกกำลังกาย'),
('Yoga', 'อุปกรณ์โยคะ', 'เสื่อโยคะ, บล็อคโยคะ'),
('Apparel', 'ชุดออกกำลังกาย', 'เสื้อ, กางเกง, รองเท้า');

-- Products
INSERT INTO products (name, category_id, price, description, image_url, is_popular) VALUES
('Dumbbell Set', 1, 2500.00, 'ชุดดัมเบลปรับน้ำหนัก 2.5-24 กก.', 'images/ดัมเบล2-1.webp', TRUE),
('Treadmill', 2, 15000.00, 'ลู่วิ่งไฟฟ้าความเร็วสูงสุด 20 กม./ชม.', 'images/ลู่วิ่งไฟฟ้า.jpg', TRUE),
('Yoga Mat', 3, 800.00, 'เสื่อโยคะหนา 6 มม. กันลื่น', 'images/แผ่นโยคะ.jpg', FALSE),
('Sports Bra', 4, 1200.00, 'สปอร์ตบาร์ซัพพอร์ตสูง', 'images/สปอร์ตบาร์ สีดำ.jpg', TRUE),
('Tank Top', 4, 800.00, 'เสื้อกล้ามผ้าฝ้าย 100%', 'images/เสื้อกล้าม สีขาว.jpg', FALSE),
('Running Shoes', 4, 3500.00, 'รองเท้าวิ่งน้ำหนักเบา', 'images/Pre-Order  รองเท้าวิ่ง Nike Zoom Fly 5 DM8968800 Men''s AthleticsRunning Running Shoes Orange x Black NIKE.webp', TRUE);

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON homegym.* TO 'homegym_user'@'localhost' IDENTIFIED BY 'your_password';
-- FLUSH PRIVILEGES;