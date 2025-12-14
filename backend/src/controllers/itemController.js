const pool = require('../config/database');
const { analyzeImage } = require('../services/visionService');
const { searchItems, parseQuery } = require('../services/searchService');
const path = require('path');

/**
 * Upload photos and create new item with AI tagging
 */
async function uploadItem(req, res) {
  const client = await pool.connect();

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    await client.query('BEGIN');

    // Analyze first image with Google Vision AI
    const firstImagePath = req.files[0].path;
    const aiAnalysis = await analyzeImage(firstImagePath);

    // Create item with AI-generated tags
    const itemQuery = `
      INSERT INTO items (
        category, keywords, age_ranges, themes,
        ai_description, ai_confidence, ai_processed_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    const itemResult = await client.query(itemQuery, [
      aiAnalysis.category,
      aiAnalysis.keywords,
      aiAnalysis.ageRanges,
      aiAnalysis.themes,
      aiAnalysis.description,
      JSON.stringify(aiAnalysis.confidenceScores),
    ]);

    const item = itemResult.rows[0];

    // Insert photos
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      await client.query(
        `INSERT INTO photos (item_id, file_path, file_name, is_primary)
         VALUES ($1, $2, $3, $4)`,
        [item.item_id, file.path, file.filename, i === 0]
      );
    }

    await client.query('COMMIT');

    // Fetch complete item with photos
    const completeItem = await getItemById(item.item_id);

    res.status(201).json({
      message: 'Item created successfully with AI tagging',
      item: completeItem,
      aiAnalysis,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error uploading item:', error);
    res.status(500).json({ error: 'Failed to upload item', details: error.message });
  } finally {
    client.release();
  }
}

/**
 * Get all items
 */
async function getAllItems(req, res) {
  try {
    const { availability, category, age_range } = req.query;

    let query = `
      SELECT
        i.*,
        COALESCE(
          json_agg(
            json_build_object(
              'photo_id', p.photo_id,
              'file_path', p.file_path,
              'file_name', p.file_name,
              'is_primary', p.is_primary
            )
            ORDER BY p.is_primary DESC, p.uploaded_date DESC
          ) FILTER (WHERE p.photo_id IS NOT NULL),
          '[]'
        ) as photos
      FROM items i
      LEFT JOIN photos p ON i.item_id = p.item_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (availability) {
      paramCount++;
      query += ` AND i.availability = $${paramCount}`;
      params.push(availability);
    }

    if (category) {
      paramCount++;
      query += ` AND i.category = $${paramCount}`;
      params.push(category);
    }

    if (age_range) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(i.age_ranges)`;
      params.push(age_range);
    }

    query += ` GROUP BY i.item_id ORDER BY i.uploaded_date DESC`;

    const result = await pool.query(query, params);
    res.json({ items: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
}

/**
 * Get item by ID
 */
async function getItem(req, res) {
  try {
    const { id } = req.params;
    const item = await getItemById(id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
}

/**
 * Helper: Get item by ID with photos
 */
async function getItemById(itemId) {
  const result = await pool.query(
    `
    SELECT
      i.*,
      COALESCE(
        json_agg(
          json_build_object(
            'photo_id', p.photo_id,
            'file_path', p.file_path,
            'file_name', p.file_name,
            'is_primary', p.is_primary
          )
          ORDER BY p.is_primary DESC, p.uploaded_date DESC
        ) FILTER (WHERE p.photo_id IS NOT NULL),
        '[]'
      ) as photos
    FROM items i
    LEFT JOIN photos p ON i.item_id = p.item_id
    WHERE i.item_id = $1
    GROUP BY i.item_id
    `,
    [itemId]
  );

  return result.rows[0] || null;
}

/**
 * Update item
 */
async function updateItem(req, res) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const {
      age_ranges,
      category,
      keywords,
      location,
      availability,
      themes,
      condition,
      notes,
    } = req.body;

    await client.query('BEGIN');

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (age_ranges !== undefined) {
      paramCount++;
      updates.push(`age_ranges = $${paramCount}`);
      values.push(age_ranges);
    }
    if (category !== undefined) {
      paramCount++;
      updates.push(`category = $${paramCount}`);
      values.push(category);
    }
    if (keywords !== undefined) {
      paramCount++;
      updates.push(`keywords = $${paramCount}`);
      values.push(keywords);
    }
    if (location !== undefined) {
      paramCount++;
      updates.push(`location = $${paramCount}`);
      values.push(location);
    }
    if (availability !== undefined) {
      paramCount++;
      updates.push(`availability = $${paramCount}`);
      values.push(availability);
    }
    if (themes !== undefined) {
      paramCount++;
      updates.push(`themes = $${paramCount}`);
      values.push(themes);
    }
    if (condition !== undefined) {
      paramCount++;
      updates.push(`condition = $${paramCount}`);
      values.push(condition);
    }
    if (notes !== undefined) {
      paramCount++;
      updates.push(`notes = $${paramCount}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_date = NOW()`);
    paramCount++;
    values.push(id);

    const query = `
      UPDATE items
      SET ${updates.join(', ')}
      WHERE item_id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not found' });
    }

    await client.query('COMMIT');

    const updatedItem = await getItemById(id);
    res.json({ message: 'Item updated successfully', item: updatedItem });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  } finally {
    client.release();
  }
}

/**
 * Delete item
 */
async function deleteItem(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM items WHERE item_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
}

/**
 * Conversational search
 */
async function conversationalSearch(req, res) {
  try {
    const { query } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Parse natural language query
    const { searchQuery, filters } = parseQuery(query);

    // Search items
    const items = await searchItems(searchQuery, filters);

    res.json({
      query: query,
      parsedFilters: filters,
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('Error in conversational search:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
}

/**
 * Record gift history
 */
async function recordGift(req, res) {
  try {
    const { id } = req.params;
    const { recipient_name, recipient_age, occasion, notes } = req.body;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Add to gifting history
      await client.query(
        `INSERT INTO gifting_history (item_id, gifted_date, recipient_name, recipient_age, occasion, notes)
         VALUES ($1, NOW(), $2, $3, $4, $5)`,
        [id, recipient_name, recipient_age, occasion, notes]
      );

      // Update item availability
      await client.query(
        `UPDATE items SET availability = 'gifted' WHERE item_id = $1`,
        [id]
      );

      await client.query('COMMIT');

      res.json({ message: 'Gift recorded successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error recording gift:', error);
    res.status(500).json({ error: 'Failed to record gift' });
  }
}

module.exports = {
  uploadItem,
  getAllItems,
  getItem,
  updateItem,
  deleteItem,
  conversationalSearch,
  recordGift,
};
