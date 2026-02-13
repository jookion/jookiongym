const express = require('express');
const { executeQuery, executeTransaction } = require('../config/database');
const router = express.Router();

// Create new order
router.post('/', async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      payment_method,
      special_notes,
      items,
      total_amount
    } = req.body;

    // Validate required fields
    if (!customer_name || !customer_phone || !items || !total_amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: customer_name, customer_phone, items, total_amount'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Items must be a non-empty array'
      });
    }

    // Validate payment method
    const validPaymentMethods = ['cash', 'credit', 'transfer'];
    if (!validPaymentMethods.includes(payment_method)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment method. Must be one of: cash, credit, transfer'
      });
    }

    // Generate order number
    const orderNumber = `JB${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Create transaction queries
    const queries = [];

    // Insert customer
    queries.push({
      sql: `
        INSERT INTO customers (name, phone, email, address)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          name = VALUES(name),
          email = VALUES(email),
          address = VALUES(address)
      `,
      params: [customer_name, customer_phone, customer_email || null, customer_address || null]
    });

    // Get customer ID
    queries.push({
      sql: 'SELECT id FROM customers WHERE phone = ?',
      params: [customer_phone]
    });

    // Insert order
    queries.push({
      sql: `
        INSERT INTO orders (order_number, customer_id, total_amount, payment_method, special_notes)
        VALUES (?, (SELECT id FROM customers WHERE phone = ?), ?, ?, ?)
      `,
      params: [orderNumber, customer_phone, total_amount, payment_method, special_notes || null]
    });

    // Get order ID
    queries.push({
      sql: 'SELECT id FROM orders WHERE order_number = ?',
      params: [orderNumber]
    });

    // Insert order items
    for (const item of items) {
      queries.push({
        sql: `
          INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
          VALUES ((SELECT id FROM orders WHERE order_number = ?), ?, ?, ?, ?)
        `,
        params: [orderNumber, item.menu_item_id, item.quantity, item.unit_price, item.total_price]
      });
    }

    // Execute transaction
    const results = await executeTransaction(queries);
    
    // Get the order ID from results
    const orderId = results[3][0].id;

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: {
        order_id: orderId,
        order_number: orderNumber,
        total_amount: total_amount,
        customer_name: customer_name,
        customer_phone: customer_phone
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Get order details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get order information
    const orderSql = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.address as customer_address
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `;

    const orderResult = await executeQuery(orderSql, [id]);

    if (orderResult.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Get order items
    const itemsSql = `
      SELECT 
        oi.*,
        mi.name as item_name,
        mi.description as item_description,
        mi.image_url as item_image,
        c.name as category_name
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN categories c ON mi.category_id = c.id
      WHERE oi.order_id = ?
    `;

    const orderItems = await executeQuery(itemsSql, [id]);

    const order = orderResult[0];
    order.items = orderItems;

    res.json({
      status: 'success',
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.payment_method,
        o.order_status,
        o.created_at,
        c.name as customer_name,
        c.phone as customer_phone
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
    `;

    const params = [];

    if (status) {
      sql += ' WHERE o.order_status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const orders = await executeQuery(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM orders';
    if (status) {
      countSql += ' WHERE order_status = ?';
    }
    const countResult = await executeQuery(countSql, status ? [status] : []);
    const totalCount = countResult[0].total;

    res.json({
      status: 'success',
      data: orders,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const sql = 'UPDATE orders SET order_status = ? WHERE id = ?';
    const result = await executeQuery(sql, [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Order status updated successfully',
      data: {
        order_id: id,
        new_status: status
      }
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

// Get order by order number
router.get('/number/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const sql = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.address as customer_address
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.order_number = ?
    `;

    const orderResult = await executeQuery(sql, [orderNumber]);

    if (orderResult.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Get order items
    const itemsSql = `
      SELECT 
        oi.*,
        mi.name as item_name,
        mi.description as item_description,
        mi.image_url as item_image
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `;

    const orderItems = await executeQuery(itemsSql, [orderResult[0].id]);

    const order = orderResult[0];
    order.items = orderItems;

    res.json({
      status: 'success',
      data: order
    });

  } catch (error) {
    console.error('Error fetching order by number:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

module.exports = router;
