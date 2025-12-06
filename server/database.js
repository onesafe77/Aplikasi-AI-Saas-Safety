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
        total_pages INTEGER DEFAULT 1,
        total_chunks INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
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

    console.log('Database tables initialized');
  } finally {
    client.release();
  }
}

export async function insertDocument(name, originalName, fileType, fileSize, totalPages) {
  const result = await pool.query(
    `INSERT INTO documents (name, original_name, file_type, file_size, total_pages) 
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [name, originalName, fileType, fileSize, totalPages]
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
    `SELECT id, name, original_name, file_type, file_size, total_pages, total_chunks, created_at 
     FROM documents ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function deleteDocument(id) {
  await pool.query(`DELETE FROM documents WHERE id = $1`, [id]);
}

export async function getAllChunks() {
  const result = await pool.query(
    `SELECT c.id, c.document_id, c.chunk_index, c.content, c.page_number, c.embedding,
            d.name as document_name, d.original_name
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
            d.name as document_name, d.original_name
     FROM chunks c 
     JOIN documents d ON c.document_id = d.id
     WHERE c.id = ANY($1)`,
    [ids]
  );
  return result.rows;
}

export { pool };
