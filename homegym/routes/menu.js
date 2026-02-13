const express = require('express');
const { executeQuery } = require('../config/database');
const router = express.Router();

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        mi.*,
        c.name as category_name,
        c.name_th as category_name_th
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      WHERE mi.is_available = TRUE
      ORDER BY c.id, mi.is_popular DESC, mi.name
    `;
    
    const menuItems = await executeQuery(sql);
    
    res.json({
      status: 'success',
      data: menuItems,
      count: menuItems.length
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch menu items',
      error: error.message
    });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.*,
        COUNT(mi.id) as item_count
      FROM categories c
      LEFT JOIN menu_items mi ON c.id = mi.category_id AND mi.is_available = TRUE
      GROUP BY c.id
      ORDER BY c.id
    `;
    
    const categories = await executeQuery(sql);
    
    res.json({
      status: 'success',
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// Get menu items by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const sql = `
      SELECT 
        mi.*,
        c.name as category_name,
        c.name_th as category_name_th
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      WHERE mi.category_id = ? AND mi.is_available = TRUE
      ORDER BY mi.is_popular DESC, mi.name
    `;
    
    const menuItems = await executeQuery(sql, [categoryId]);
    
    if (menuItems.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No menu items found for this category'
      });
    }
    
    res.json({
      status: 'success',
      data: menuItems,
      count: menuItems.length
    });
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch menu items by category',
      error: error.message
    });
  }
});

// Get popular menu items
router.get('/popular', async (req, res) => {
  try {
    const sql = `
      SELECT 
        mi.*,
        c.name as category_name,
        c.name_th as category_name_th
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      WHERE mi.is_popular = TRUE AND mi.is_available = TRUE
      ORDER BY mi.name
    `;
    
    const popularItems = await executeQuery(sql);
    
    res.json({
      status: 'success',
      data: popularItems,
      count: popularItems.length
    });
  } catch (error) {
    console.error('Error fetching popular menu items:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch popular menu items',
      error: error.message
    });
  }
});

// Search menu items
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query must be at least 2 characters long'
      });
    }
    
    const searchTerm = `%${q.trim()}%`;
    const sql = `
      SELECT 
        mi.*,
        c.name as category_name,
        c.name_th as category_name_th
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      WHERE mi.is_available = TRUE 
        AND (mi.name LIKE ? OR mi.description LIKE ? OR c.name LIKE ? OR c.name_th LIKE ?)
      ORDER BY mi.is_popular DESC, mi.name
      LIMIT 20
    `;
    
    const searchResults = await executeQuery(sql, [searchTerm, searchTerm, searchTerm, searchTerm]);
    
    res.json({
      status: 'success',
      data: searchResults,
      count: searchResults.length,
      query: q
    });
  } catch (error) {
    console.error('Error searching menu items:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to search menu items',
      error: error.message
    });
  }
});

// Get menu item by ID
router.get('/item/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        mi.*,
        c.name as category_name,
        c.name_th as category_name_th
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      WHERE mi.id = ? AND mi.is_available = TRUE
    `;
    
    const menuItem = await executeQuery(sql, [id]);
    
    if (menuItem.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu item not found'
      });
    }
    
    res.json({
      status: 'success',
      data: menuItem[0]
    });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch menu item',
      error: error.message
    });
  }
});

module.exports = router;
