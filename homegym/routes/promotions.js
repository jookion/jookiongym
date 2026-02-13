const express = require('express');
const { executeQuery } = require('../config/database');
const router = express.Router();

// Get all active promotions
router.get('/', async (req, res) => {
  try {
    const { active = true } = req.query;

    let sql = `
      SELECT *
      FROM promotions
    `;

    const params = [];

    if (active === 'true' || active === true) {
      sql += `
        WHERE is_active = TRUE 
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
      `;
    }

    sql += ' ORDER BY created_at DESC';

    const promotions = await executeQuery(sql, params);

    res.json({
      status: 'success',
      data: promotions,
      count: promotions.length
    });

  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch promotions',
      error: error.message
    });
  }
});

// Get promotion by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sql = 'SELECT * FROM promotions WHERE id = ?';
    const promotion = await executeQuery(sql, [id]);

    if (promotion.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Promotion not found'
      });
    }

    res.json({
      status: 'success',
      data: promotion[0]
    });

  } catch (error) {
    console.error('Error fetching promotion:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch promotion',
      error: error.message
    });
  }
});

// Validate promotion code
router.post('/validate', async (req, res) => {
  try {
    const { promo_code, total_amount } = req.body;

    if (!promo_code || !total_amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Promo code and total amount are required'
      });
    }

    const sql = `
      SELECT *
      FROM promotions
      WHERE promo_code = ?
        AND is_active = TRUE
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
    `;

    const promotion = await executeQuery(sql, [promo_code]);

    if (promotion.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Invalid or expired promotion code'
      });
    }

    const promo = promotion[0];
    let discount_amount = 0;

    if (promo.discount_percent) {
      discount_amount = (total_amount * promo.discount_percent) / 100;
    } else if (promo.discount_amount) {
      discount_amount = promo.discount_amount;
    }

    const final_amount = Math.max(0, total_amount - discount_amount);

    res.json({
      status: 'success',
      message: 'Promotion code applied successfully',
      data: {
        promotion: promo,
        original_amount: total_amount,
        discount_amount: discount_amount,
        final_amount: final_amount
      }
    });

  } catch (error) {
    console.error('Error validating promotion code:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to validate promotion code',
      error: error.message
    });
  }
});

// Create new promotion
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      discount_percent,
      discount_amount,
      promo_code,
      start_date,
      end_date,
      is_active = true
    } = req.body;

    // Validate required fields
    if (!title || (!discount_percent && !discount_amount)) {
      return res.status(400).json({
        status: 'error',
        message: 'Title and either discount_percent or discount_amount are required'
      });
    }

    // Validate discount values
    if (discount_percent && (discount_percent < 0 || discount_percent > 100)) {
      return res.status(400).json({
        status: 'error',
        message: 'Discount percentage must be between 0 and 100'
      });
    }

    if (discount_amount && discount_amount < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Discount amount cannot be negative'
      });
    }

    // Check if promo code already exists
    if (promo_code) {
      const existingPromo = await executeQuery(
        'SELECT id FROM promotions WHERE promo_code = ?',
        [promo_code]
      );

      if (existingPromo.length > 0) {
        return res.status(409).json({
          status: 'error',
          message: 'Promotion code already exists'
        });
      }
    }

    // Insert new promotion
    const sql = `
      INSERT INTO promotions (
        title, description, discount_percent, discount_amount, 
        promo_code, start_date, end_date, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(sql, [
      title,
      description || null,
      discount_percent || null,
      discount_amount || null,
      promo_code || null,
      start_date || null,
      end_date || null,
      is_active
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Promotion created successfully',
      data: {
        promotion_id: result.insertId,
        title: title,
        promo_code: promo_code
      }
    });

  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create promotion',
      error: error.message
    });
  }
});

// Update promotion
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      discount_percent,
      discount_amount,
      promo_code,
      start_date,
      end_date,
      is_active
    } = req.body;

    // Validate discount values
    if (discount_percent !== undefined && (discount_percent < 0 || discount_percent > 100)) {
      return res.status(400).json({
        status: 'error',
        message: 'Discount percentage must be between 0 and 100'
      });
    }

    if (discount_amount !== undefined && discount_amount < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Discount amount cannot be negative'
      });
    }

    // Check if promo code is already taken by another promotion
    if (promo_code) {
      const existingPromo = await executeQuery(
        'SELECT id FROM promotions WHERE promo_code = ? AND id != ?',
        [promo_code, id]
      );

      if (existingPromo.length > 0) {
        return res.status(409).json({
          status: 'error',
          message: 'Promotion code is already taken by another promotion'
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const params = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    if (discount_percent !== undefined) {
      updateFields.push('discount_percent = ?');
      params.push(discount_percent);
    }
    if (discount_amount !== undefined) {
      updateFields.push('discount_amount = ?');
      params.push(discount_amount);
    }
    if (promo_code !== undefined) {
      updateFields.push('promo_code = ?');
      params.push(promo_code);
    }
    if (start_date !== undefined) {
      updateFields.push('start_date = ?');
      params.push(start_date);
    }
    if (end_date !== undefined) {
      updateFields.push('end_date = ?');
      params.push(end_date);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No fields to update'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE promotions SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await executeQuery(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Promotion not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Promotion updated successfully',
      data: {
        promotion_id: id
      }
    });

  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update promotion',
      error: error.message
    });
  }
});

// Delete promotion
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sql = 'DELETE FROM promotions WHERE id = ?';
    const result = await executeQuery(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Promotion not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Promotion deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete promotion',
      error: error.message
    });
  }
});

// Get promotion statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_promotions,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_promotions,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive_promotions,
        COUNT(CASE WHEN start_date <= NOW() AND (end_date IS NULL OR end_date >= NOW()) THEN 1 END) as currently_active,
        COUNT(CASE WHEN end_date < NOW() THEN 1 END) as expired_promotions
      FROM promotions
    `;

    const stats = await executeQuery(sql);

    res.json({
      status: 'success',
      data: stats[0]
    });

  } catch (error) {
    console.error('Error fetching promotion statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch promotion statistics',
      error: error.message
    });
  }
});

module.exports = router;
