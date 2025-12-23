import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDatabase() {
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

export { pool };
