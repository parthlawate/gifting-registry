const pool = require('../config/database');

/**
 * Search items based on conversational query
 * Uses PostgreSQL full-text search and filtering
 */
async function searchItems(query, filters = {}) {
  try {
    let sql = `
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
      WHERE i.availability = 'available'
    `;

    const params = [];
    let paramCount = 0;

    // Full-text search
    if (query && query.trim() !== '') {
      paramCount++;
      sql += ` AND i.search_vector @@ plainto_tsquery('english', $${paramCount})`;
      params.push(query);
    }

    // Age range filter
    if (filters.ageRange) {
      paramCount++;
      sql += ` AND $${paramCount} = ANY(i.age_ranges)`;
      params.push(filters.ageRange);
    }

    // Category filter
    if (filters.category) {
      paramCount++;
      sql += ` AND i.category = $${paramCount}`;
      params.push(filters.category);
    }

    // Theme filter
    if (filters.theme) {
      paramCount++;
      sql += ` AND $${paramCount} = ANY(i.themes)`;
      params.push(filters.theme);
    }

    // Keyword filter
    if (filters.keyword) {
      paramCount++;
      sql += ` AND $${paramCount} = ANY(i.keywords)`;
      params.push(filters.keyword);
    }

    sql += ` GROUP BY i.item_id ORDER BY i.uploaded_date DESC`;

    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Error searching items:', error);
    throw error;
  }
}

/**
 * Parse natural language query into structured filters
 * This is a simple implementation - can be enhanced with NLP
 */
function parseQuery(naturalQuery) {
  const query = naturalQuery.toLowerCase();
  const filters = {};

  // Age detection
  const agePatterns = [
    { pattern: /\b(baby|babies|infant)\b/, range: 'baby' },
    { pattern: /\b(toddler|preschool|preschooler|young child)\b/, range: 'young-child' },
    { pattern: /\b(\d+)\s*year[s]?\s*old\b/, range: null }, // Will calculate
    { pattern: /\b(kid|kids|child|children)\b/, range: 'older-child' },
    { pattern: /\b(teen|teenager|adolescent)\b/, range: 'teen' },
    { pattern: /\b(adult|grown-up|grownup)\b/, range: 'adult' },
    { pattern: /\b(grandmother|grandfather|grandma|grandpa|senior|elderly)\b/, range: 'adult' },
  ];

  for (const { pattern, range } of agePatterns) {
    const match = query.match(pattern);
    if (match) {
      if (range) {
        filters.ageRange = range;
      } else {
        // Extract age number
        const age = parseInt(match[1]);
        filters.ageRange = ageToRange(age);
      }
      break;
    }
  }

  // Category detection
  const categories = [
    'toys', 'games', 'books', 'kitchen', 'home-decor',
    'electronics', 'clothing', 'stationery', 'craft', 'sports'
  ];

  for (const category of categories) {
    if (query.includes(category) || query.includes(category.replace('-', ' '))) {
      filters.category = category.includes('-') ? category :
        categories.find(c => c.includes(category)) || category;
      break;
    }
  }

  // Theme detection
  const themes = [
    'educational', 'creative', 'outdoor', 'indoor', 'tech',
    'cooking', 'reading', 'music', 'art', 'science', 'animals', 'vehicles'
  ];

  for (const theme of themes) {
    if (query.includes(theme)) {
      filters.theme = theme;
      break;
    }
  }

  return { searchQuery: naturalQuery, filters };
}

/**
 * Convert age to appropriate age range
 */
function ageToRange(age) {
  if (age <= 2) return 'baby';
  if (age <= 6) return 'young-child';
  if (age <= 12) return 'older-child';
  if (age <= 17) return 'teen';
  return 'adult';
}

module.exports = {
  searchItems,
  parseQuery,
};
