const pool = require('./database');

const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- Core fields
        age_ranges TEXT[] DEFAULT '{}',
        category VARCHAR(50),
        keywords TEXT[] DEFAULT '{}',
        location TEXT,
        availability VARCHAR(20) DEFAULT 'available',

        -- Optional fields
        themes TEXT[] DEFAULT '{}',
        condition VARCHAR(20),
        notes TEXT,

        -- AI metadata
        ai_description TEXT,
        ai_confidence JSONB,
        ai_processed_date TIMESTAMP,

        -- Search optimization
        search_vector tsvector
      );
    `);

    // Create photos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS photos (
        photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID REFERENCES items(item_id) ON DELETE CASCADE,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_primary BOOLEAN DEFAULT false
      );
    `);

    // Create gifting history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gifting_history (
        history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID REFERENCES items(item_id) ON DELETE CASCADE,
        gifted_date TIMESTAMP NOT NULL,
        recipient_name TEXT,
        recipient_age INTEGER,
        occasion TEXT,
        notes TEXT
      );
    `);

    // Create indexes for search optimization
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
      CREATE INDEX IF NOT EXISTS idx_items_availability ON items(availability);
      CREATE INDEX IF NOT EXISTS idx_items_age_ranges ON items USING GIN(age_ranges);
      CREATE INDEX IF NOT EXISTS idx_items_keywords ON items USING GIN(keywords);
      CREATE INDEX IF NOT EXISTS idx_items_themes ON items USING GIN(themes);
      CREATE INDEX IF NOT EXISTS idx_photos_item_id ON photos(item_id);
    `);

    // Create trigger to update search_vector
    await client.query(`
      CREATE OR REPLACE FUNCTION items_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', coalesce(NEW.category, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(array_to_string(NEW.keywords, ' '), '')), 'B') ||
          setweight(to_tsvector('english', coalesce(NEW.ai_description, '')), 'C') ||
          setweight(to_tsvector('english', coalesce(NEW.notes, '')), 'D');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS items_search_vector_trigger ON items;
      CREATE TRIGGER items_search_vector_trigger
      BEFORE INSERT OR UPDATE ON items
      FOR EACH ROW EXECUTE FUNCTION items_search_vector_update();
    `);

    // Create GIN index for full-text search
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_items_search_vector ON items USING GIN(search_vector);
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration if called directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { createTables };
