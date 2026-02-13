const express = require('express');
const { executeQuery } = require('../config/database');
const router = express.Router();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;

    let sql = `
      SELECT 
        c.*,
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
    `;

    const params = [];

    if (search) {
      sql += ' WHERE c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const customers = await executeQuery(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM customers';
    if (search) {
      countSql += ' WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?';
    }
    const countResult = await executeQuery(countSql, search ? [search, search, search] : []);
    const totalCount = countResult[0].total;

    res.json({
      status: 'success',
      data: customers,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        c.*,
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as total_spent,
        AVG(o.total_amount) as average_order_value
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.id = ?
      GROUP BY c.id
    `;

    const customer = await executeQuery(sql, [id]);

    if (customer.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }

    // Get customer's order history
    const ordersSql = `
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.payment_method,
        o.order_status,
        o.created_at
      FROM orders o
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
      LIMIT 10
    `;

    const orders = await executeQuery(ordersSql, [id]);

    const customerData = customer[0];
    customerData.orders = orders;

    res.json({
      status: 'success',
      data: customerData
    });

  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and phone are required fields'
      });
    }

    // Check if customer already exists
    const existingCustomer = await executeQuery(
      'SELECT id FROM customers WHERE phone = ?',
      [phone]
    );

    if (existingCustomer.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Customer with this phone number already exists',
        data: {
          customer_id: existingCustomer[0].id
        }
      });
    }

    // Insert new customer
    const sql = `
      INSERT INTO customers (name, phone, email, address)
      VALUES (?, ?, ?, ?)
    `;

    const result = await executeQuery(sql, [name, phone, email || null, address || null]);

    res.status(201).json({
      status: 'success',
      message: 'Customer created successfully',
      data: {
        customer_id: result.insertId,
        name: name,
        phone: phone,
        email: email,
        address: address
      }
    });

  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create customer',
      error: error.message
    });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and phone are required fields'
      });
    }

    // Check if phone number is already taken by another customer
    const existingCustomer = await executeQuery(
      'SELECT id FROM customers WHERE phone = ? AND id != ?',
      [phone, id]
    );

    if (existingCustomer.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Phone number is already taken by another customer'
      });
    }

    // Update customer
    const sql = `
      UPDATE customers 
      SET name = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await executeQuery(sql, [name, phone, email || null, address || null, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Customer updated successfully',
      data: {
        customer_id: id,
        name: name,
        phone: phone,
        email: email,
        address: address
      }
    });

  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update customer',
      error: error.message
    });
  }
});

// Get customer by phone number
router.get('/phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;

    const sql = `
      SELECT 
        c.*,
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.phone = ?
      GROUP BY c.id
    `;

    const customer = await executeQuery(sql, [phone]);

    if (customer.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }

    res.json({
      status: 'success',
      data: customer[0]
    });

  } catch (error) {
    console.error('Error fetching customer by phone:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
});

// Get customer statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_customers_30d,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_customers_7d,
        AVG(total_spent) as average_customer_value
      FROM (
        SELECT 
          c.id,
          c.created_at,
          COALESCE(SUM(o.total_amount), 0) as total_spent
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id
        GROUP BY c.id
      ) customer_stats
    `;

    const stats = await executeQuery(sql);

    res.json({
      status: 'success',
      data: stats[0]
    });

  } catch (error) {
    console.error('Error fetching customer statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customer statistics',
      error: error.message
    });
  }
});

module.exports = router;
