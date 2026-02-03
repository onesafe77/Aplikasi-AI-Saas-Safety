import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // 10 seconds
  idleTimeoutMillis: 30000, // 30 seconds
  max: 20, // max connections
  ssl: process.env.DATABASE_URL?.includes('railway') || process.env.DATABASE_URL?.includes('aws') ? {
    rejectUnauthorized: false
  } : false
});

// Test database connection on startup
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// Function to test connection
export async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set (hidden for security)' : 'NOT SET');

    const client = await pool.connect();
    console.log('✓ Connection established');

    const result = await client.query('SELECT NOW() as current_time');
    console.log('✓ Query executed successfully at', result.rows[0].current_time);

    client.release();
    console.log('✓ Database connected successfully');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    if (error.code === 'ENOTFOUND') {
      console.error('→ DNS lookup failed. Check database host.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('→ Connection refused. Check if database is running.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('→ Connection timeout. Check network/firewall.');
    } else if (error.message?.includes('password')) {
      console.error('→ Authentication failed. Check credentials.');
    } else if (error.message?.includes('SSL')) {
      console.error('→ SSL error. Try adjusting SSL settings.');
    }

    return false;
  }
}

export async function initDatabase() {
  // Test connection first
  const isConnected = await testConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to database. Please check DATABASE_URL configuration.');
  }

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size VARCHAR(50),
        folder VARCHAR(100) DEFAULT 'Umum',
        total_pages INTEGER DEFAULT 1,
        total_chunks INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder VARCHAR(100) DEFAULT 'Umum';
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS chunks (
        id SERIAL PRIMARY KEY,
        document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        page_number INTEGER DEFAULT 1,
        start_position INTEGER DEFAULT 0,
        end_position INTEGER DEFAULT 0,
        embedding FLOAT8[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        user_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(50) REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        sources JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON chat_messages(session_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description VARCHAR(255),
        icon VARCHAR(50) DEFAULT 'folder',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const folderCount = await client.query(`SELECT COUNT(*) FROM folders`);
    if (parseInt(folderCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO folders (name, sort_order) VALUES 
        ('Peraturan Pemerintah', 1),
        ('SOP GECL', 2),
        ('SOP BIB', 3),
        ('Umum', 4)
        ON CONFLICT (name) DO NOTHING
      `);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        slug VARCHAR(100) UNIQUE,
        subscription_status VARCHAR(50) DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure users have organization_id
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    `);

    // Ensure documents have organization_id and industry_tag
    await client.query(`
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS industry_tag VARCHAR(100);
    `);

    // Ensure chunks have organization_id (for faster filtering)
    await client.query(`
      ALTER TABLE chunks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    `);

    // Ensure folders have organization_id
    await client.query(`
      ALTER TABLE folders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    `);

    // Ensure chat_sessions have organization_id
    await client.query(`
      ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        organization_id UUID REFERENCES organizations(id),
        nik VARCHAR(50) NOT NULL,
        nama VARCHAR(255) NOT NULL,
        departemen VARCHAR(100),
        jabatan VARCHAR(100),
        password VARCHAR(255) DEFAULT '123456',
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(organization_id, nik)
      );
    `);

    const adminCount = await client.query(`SELECT COUNT(*) FROM users WHERE role = 'admin'`);
    if (parseInt(adminCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO users (nik, nama, departemen, jabatan, role) VALUES 
        ('admin', 'Administrator', 'IT', 'System Admin', 'admin')
        ON CONFLICT (nik) DO NOTHING
      `);
    }

    console.log('Database tables initialized');
  } finally {
    client.release();
  }
}

export async function insertDocument(name, originalName, fileType, fileSize, totalPages, folder = 'Umum') {
  const result = await pool.query(
    `INSERT INTO documents (name, original_name, file_type, file_size, total_pages, folder) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [name, originalName, fileType, fileSize, totalPages, folder]
  );
  return result.rows[0].id;
}

export async function insertChunk(documentId, chunkIndex, content, pageNumber, startPos, endPos, embedding) {
  await pool.query(
    `INSERT INTO chunks (document_id, chunk_index, content, page_number, start_position, end_position, embedding) 
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [documentId, chunkIndex, content, pageNumber, startPos, endPos, embedding]
  );
}

export async function updateDocumentChunkCount(documentId, count) {
  await pool.query(
    `UPDATE documents SET total_chunks = $1 WHERE id = $2`,
    [count, documentId]
  );
}

export async function getAllDocuments() {
  const result = await pool.query(
    `SELECT id, name, original_name, file_type, file_size, folder, total_pages, total_chunks, created_at 
     FROM documents ORDER BY folder, created_at DESC`
  );
  return result.rows;
}

export async function deleteDocument(id) {
  await pool.query(`DELETE FROM chunks WHERE document_id = $1`, [id]);
  await pool.query(`DELETE FROM documents WHERE id = $1`, [id]);
}

export async function getAllChunks() {
  const result = await pool.query(
    `SELECT c.id, c.document_id, c.chunk_index, c.content, c.page_number, c.embedding,
            d.name as document_name, d.original_name, d.folder
     FROM chunks c 
     JOIN documents d ON c.document_id = d.id
     ORDER BY c.document_id, c.chunk_index`
  );
  return result.rows;
}

export async function getChunksByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const result = await pool.query(
    `SELECT c.id, c.document_id, c.chunk_index, c.content, c.page_number,
            d.name as document_name, d.original_name, d.folder
     FROM chunks c 
     JOIN documents d ON c.document_id = d.id
     WHERE c.id = ANY($1)`,
    [ids]
  );
  return result.rows;
}

export async function getRandomChunk() {
  const result = await pool.query(
    `SELECT c.id, c.content, c.page_number,
            d.name as document_name, d.original_name
     FROM chunks c 
     JOIN documents d ON c.document_id = d.id
     WHERE LENGTH(c.content) > 100 AND LENGTH(c.content) < 500
     ORDER BY RANDOM()
     LIMIT 1`
  );
  return result.rows[0] || null;
}

export async function createChatSession(id, title, userId = null) {
  await pool.query(
    `INSERT INTO chat_sessions (id, title, user_id) VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET title = $2, updated_at = CURRENT_TIMESTAMP`,
    [id, title, userId]
  );
}

export async function getChatSessions(userId = null) {
  if (userId) {
    const result = await pool.query(
      `SELECT id, title, created_at, updated_at FROM chat_sessions 
       WHERE user_id = $1
       ORDER BY updated_at DESC LIMIT 50`,
      [userId]
    );
    return result.rows;
  }
  const result = await pool.query(
    `SELECT id, title, created_at, updated_at FROM chat_sessions 
     ORDER BY updated_at DESC LIMIT 50`
  );
  return result.rows;
}

export async function getChatSession(sessionId) {
  const result = await pool.query(
    `SELECT id, title, created_at FROM chat_sessions WHERE id = $1`,
    [sessionId]
  );
  return result.rows[0] || null;
}

export async function saveChatMessage(sessionId, role, content, sources = null) {
  await pool.query(
    `INSERT INTO chat_messages (session_id, role, content, sources) VALUES ($1, $2, $3, $4)`,
    [sessionId, role, content, sources ? JSON.stringify(sources) : null]
  );
  await pool.query(
    `UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [sessionId]
  );
}

export async function getChatMessages(sessionId) {
  const result = await pool.query(
    `SELECT id, role, content, sources, created_at FROM chat_messages 
     WHERE session_id = $1 ORDER BY created_at ASC`,
    [sessionId]
  );
  return result.rows;
}

export async function deleteChatSession(sessionId) {
  await pool.query(`DELETE FROM chat_sessions WHERE id = $1`, [sessionId]);
}

export async function getAllFolders() {
  const result = await pool.query(
    `SELECT id, name, description, icon, sort_order, created_at FROM folders ORDER BY sort_order, name`
  );
  return result.rows;
}

export async function createFolder(name, description = null) {
  const maxOrder = await pool.query(`SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM folders`);
  const result = await pool.query(
    `INSERT INTO folders (name, description, sort_order) VALUES ($1, $2, $3) RETURNING *`,
    [name, description, maxOrder.rows[0].next_order]
  );
  return result.rows[0];
}

export async function updateFolder(id, name, description = null) {
  const result = await pool.query(
    `UPDATE folders SET name = $1, description = $2 WHERE id = $3 RETURNING *`,
    [name, description, id]
  );
  return result.rows[0];
}

export async function deleteFolder(id) {
  const folder = await pool.query(`SELECT name FROM folders WHERE id = $1`, [id]);
  if (folder.rows.length > 0) {
    await pool.query(`UPDATE documents SET folder = 'Umum' WHERE folder = $1`, [folder.rows[0].name]);
  }
  await pool.query(`DELETE FROM folders WHERE id = $1`, [id]);
}

export async function updateDocumentsFolder(oldFolderName, newFolderName) {
  await pool.query(`UPDATE documents SET folder = $1 WHERE folder = $2`, [newFolderName, oldFolderName]);
}

export async function getAllUsers() {
  const result = await pool.query(
    `SELECT id, nik, nama, departemen, jabatan, role, created_at FROM users ORDER BY nama`
  );
  return result.rows;
}

export async function createUser(nik, nama, departemen, jabatan, role = 'user', organizationId = null, password = '123456') {
  const result = await pool.query(
    `INSERT INTO users (nik, nama, departemen, jabatan, role, organization_id, password) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [nik, nama, departemen, jabatan, role, organizationId, password]
  );
  return result.rows[0];
}

export async function updateUser(id, nik, nama, departemen, jabatan, role) {
  const result = await pool.query(
    `UPDATE users SET nik = $1, nama = $2, departemen = $3, jabatan = $4, role = $5 WHERE id = $6 RETURNING *`,
    [nik, nama, departemen, jabatan, role, id]
  );
  return result.rows[0];
}

export async function deleteUser(id) {
  await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
}

export async function resetUserPassword(id, newPassword = '123456') {
  await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [newPassword, id]);
}

export async function getUserByNik(nik) {
  const result = await pool.query(
    `SELECT id, nik, nama, departemen, jabatan, password, role FROM users WHERE nik = $1`,
    [nik]
  );
  return result.rows[0] || null;
}

export async function bulkCreateUsers(users) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results = [];
    for (const user of users) {
      const result = await client.query(
        `INSERT INTO users (nik, nama, departemen, jabatan, role) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (nik) DO UPDATE SET nama = $2, departemen = $3, jabatan = $4
         RETURNING *`,
        [user.nik, user.nama, user.departemen, user.jabatan, user.role || 'user']
      );
      results.push(result.rows[0]);
    }
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}


export async function createOrganization(name, industry, slug, settings = {}) {
  const result = await pool.query(
    `INSERT INTO organizations (name, industry, slug, settings) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, industry, slug, JSON.stringify(settings)]
  );
  return result.rows[0];
}

export { pool };
