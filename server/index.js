import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import mammoth from 'mammoth';
import pdfParse from '@cyber2024/pdf-parse-fixed';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { GoogleGenAI } from '@google/genai';

async function parsePdfWithPdfjs(buffer) {
  try {
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data, useSystemFonts: true });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const pageCount = pdf.numPages;
    
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return { text: fullText, numpages: pageCount };
  } catch (error) {
    console.error('pdfjs parsing error:', error.message);
    throw error;
  }
}

async function parsePdfRobust(buffer) {
  try {
    const result = await parsePdfWithPdfjs(buffer);
    console.log(`PDF parsed with pdfjs: ${result.numpages} pages, ${result.text.length} chars`);
    return result;
  } catch (pdfjsError) {
    console.log('pdfjs failed, trying pdf-parse fallback...');
    try {
      const result = await pdfParse(buffer);
      console.log(`PDF parsed with pdf-parse: ${result.numpages} pages, ${result.text.length} chars`);
      return result;
    } catch (pdfParseError) {
      console.error('Both PDF parsers failed');
      throw pdfParseError;
    }
  }
}
import XLSX from 'xlsx';
import { 
  initDatabase, 
  insertDocument, 
  insertChunk, 
  updateDocumentChunkCount,
  getAllDocuments, 
  deleteDocument,
  getAllChunks,
  getChunksByIds,
  getRandomChunk,
  createChatSession,
  getChatSessions,
  getChatSession,
  saveChatMessage,
  getChatMessages,
  deleteChatSession,
  getAllFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  updateDocumentsFolder,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getUserByNik,
  bulkCreateUsers
} from './database.js';
import { 
  chunkText, 
  generateEmbedding,
  generateEmbeddingsBatch,
  searchSimilarChunks, 
  buildRAGPrompt 
} from './rag.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

initDatabase().catch(console.error);

const BASE_INSTRUCTION = `
Kamu adalah **Si Asef**, asisten K3 yang cerdas dan ramah. Kamu ahli dalam regulasi keselamatan kerja Indonesia dan siap membantu dengan cara yang natural, seperti berbicara dengan rekan kerja yang berpengalaman.

**PENGETAHUAN:**
- UU No. 1 Tahun 1970 (Keselamatan Kerja)
- PP No. 50 Tahun 2012 (SMK3)
- Permenaker terkait K3
- Dokumen internal dari knowledge base

**CARA MENJAWAB:**

1. **Gaya Bahasa:** Gunakan bahasa Indonesia yang natural dan mudah dipahami. Hindari bahasa yang terlalu kaku atau birokratis. Contoh:
   - Jangan: "Berdasarkan ketentuan yang berlaku, dinyatakan bahwa..."
   - Lebih baik: "Sesuai aturan, perusahaan perlu..."

2. **Struktur Jawaban:**
   - Mulai dengan poin utama langsung, jangan bertele-tele
   - Gunakan **bold** untuk istilah penting
   - Gunakan bullet points (-) untuk daftar
   - Gunakan nomor (1. 2. 3.) untuk langkah-langkah
   - Paragraf singkat (2-3 kalimat), mudah dibaca
   - Pisahkan dengan baris kosong antar bagian

3. **Kutipan/Citation:** Gunakan format {{ref:N}} dengan hemat. Letakkan di akhir kalimat atau paragraf yang mengandung fakta penting. Satu kutipan per poin sudah cukup.

4. **Kepribadian:**
   - Ramah tapi tetap profesional
   - Berikan konteks praktis, bukan hanya teori
   - Kalau ada tips atau saran tambahan, sampaikan dengan natural
   - Boleh menggunakan kata-kata seperti "Nah,", "Jadi,", "Perlu dicatat," untuk transisi yang lebih natural

5. **Interaktif - WAJIB:**
   - Di AKHIR setiap jawaban, SELALU tawarkan untuk menjelaskan lebih detail tentang topik yang sedang dibahas
   - Gunakan format pertanyaan yang relevan dengan topik, contoh:
     * "Mau saya jelaskan lebih detail tentang [topik spesifik] ini?"
     * "Apakah ada bagian dari [topik] yang ingin saya jelaskan lebih lanjut?"
     * "Kalau mau tahu lebih dalam tentang [aspek tertentu], saya bisa bantu jelaskan."
   - Pertanyaan harus spesifik sesuai topik yang dibahas, bukan pertanyaan umum
   - Buat user merasa diajak berdiskusi, bukan hanya diberi informasi satu arah
`;

const chatSessions = new Map();

app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    console.log(`Processing upload: ${originalname} (${mimetype}, ${size} bytes)`);
    
    let textContent = '';
    let pageCount = 1;

    if (mimetype === 'application/pdf') {
      try {
        const pdfData = await parsePdfRobust(buffer);
        textContent = pdfData.text;
        pageCount = pdfData.numpages || 1;
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError.message);
        if (pdfError.message && (pdfError.message.includes('password') || pdfError.message.includes('encrypted'))) {
          return res.status(400).json({ 
            error: 'PDF ini terproteksi password. Silakan buka proteksi PDF terlebih dahulu.' 
          });
        }
        return res.status(400).json({ 
          error: 'Gagal membaca PDF. Pastikan file tidak rusak atau corrupt.' 
        });
      }
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               mimetype === 'application/msword') {
      try {
        const result = await mammoth.extractRawText({ buffer });
        textContent = result.value;
        console.log(`DOCX parsed: ${textContent.length} chars extracted`);
      } catch (docError) {
        console.error('DOCX parsing error:', docError.message);
        return res.status(400).json({ 
          error: 'Gagal membaca file Word. Pastikan file tidak rusak.' 
        });
      }
    } else if (mimetype === 'text/plain') {
      textContent = buffer.toString('utf-8');
      console.log(`TXT parsed: ${textContent.length} chars`);
    } else {
      return res.status(400).json({ error: 'Tipe file tidak didukung. Gunakan PDF, DOCX, atau TXT.' });
    }

    if (!textContent.trim()) {
      console.log('No text content extracted from file');
      if (mimetype === 'application/pdf') {
        return res.status(400).json({ 
          error: 'PDF ini tidak mengandung teks (kemungkinan hasil scan/gambar). Si Asef belum bisa membaca PDF hasil scan. Silakan gunakan PDF dengan teks yang bisa di-copy atau konversi dengan OCR terlebih dahulu.' 
        });
      }
      return res.status(400).json({ error: 'Tidak dapat mengekstrak teks dari file.' });
    }

    const fileSize = size < 1024 ? `${size} B` : 
                     size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : 
                     `${(size / (1024 * 1024)).toFixed(1)} MB`;

    const folder = req.body.folder || 'Umum';

    const docId = await insertDocument(
      originalname,
      originalname,
      mimetype,
      fileSize,
      pageCount,
      folder
    );

    const chunks = chunkText(textContent, 1);
    
    const BATCH_SIZE = 5;
    for (let batchStart = 0; batchStart < chunks.length; batchStart += BATCH_SIZE) {
      const batchChunks = chunks.slice(batchStart, batchStart + BATCH_SIZE);
      const texts = batchChunks.map(c => c.content);
      
      const embeddings = await generateEmbeddingsBatch(texts);
      
      for (let idx = 0; idx < batchChunks.length; idx++) {
        const chunk = batchChunks[idx];
        await insertChunk(
          docId,
          batchStart + idx,
          chunk.content,
          chunk.pageNumber,
          chunk.startPosition,
          chunk.endPosition,
          embeddings[idx]
        );
      }
    }

    await updateDocumentChunkCount(docId, chunks.length);

    res.json({ 
      success: true, 
      documentId: docId,
      fileName: originalname,
      chunks: chunks.length,
      pages: pageCount
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const documents = await getAllDocuments();
    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    await deleteDocument(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

app.get('/api/folders', async (req, res) => {
  try {
    const folders = await getAllFolders();
    res.json(folders);
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to get folders' });
  }
});

app.post('/api/folders', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nama folder harus diisi' });
    }
    const folder = await createFolder(name.trim(), description);
    res.json(folder);
  } catch (error) {
    console.error('Create folder error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Folder dengan nama tersebut sudah ada' });
    }
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

app.put('/api/folders/:id', async (req, res) => {
  try {
    const { name, description, oldName } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nama folder harus diisi' });
    }
    const folder = await updateFolder(req.params.id, name.trim(), description);
    if (oldName && oldName !== name.trim()) {
      await updateDocumentsFolder(oldName, name.trim());
    }
    res.json(folder);
  } catch (error) {
    console.error('Update folder error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Folder dengan nama tersebut sudah ada' });
    }
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

app.delete('/api/folders/:id', async (req, res) => {
  try {
    await deleteFolder(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { nik, nama, departemen, jabatan, role } = req.body;
    if (!nik || !nama) {
      return res.status(400).json({ error: 'NIK dan Nama harus diisi' });
    }
    const user = await createUser(nik, nama, departemen, jabatan, role);
    res.json(user);
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'NIK sudah terdaftar' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { nik, nama, departemen, jabatan, role } = req.body;
    if (!nik || !nama) {
      return res.status(400).json({ error: 'NIK dan Nama harus diisi' });
    }
    const user = await updateUser(req.params.id, nik, nama, departemen, jabatan, role);
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'NIK sudah terdaftar' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.post('/api/users/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    await resetUserPassword(req.params.id, newPassword || '123456');
    res.json({ success: true, message: 'Password berhasil direset' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

app.post('/api/users/upload-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      return res.status(400).json({ error: 'File Excel kosong atau tidak memiliki data' });
    }

    const headers = data[0].map(h => h?.toString().toLowerCase().trim() || '');
    const namaIdx = headers.findIndex(h => h.includes('nama'));
    const nikIdx = headers.findIndex(h => h.includes('nik'));
    const deptIdx = headers.findIndex(h => h.includes('departemen') || h.includes('dept'));
    const jabatanIdx = headers.findIndex(h => h.includes('jabatan') || h.includes('position'));

    if (nikIdx === -1 || namaIdx === -1) {
      return res.status(400).json({ error: 'Kolom NIK dan NAMA harus ada di file Excel' });
    }

    const users = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[nikIdx] || !row[namaIdx]) continue;
      
      users.push({
        nik: row[nikIdx]?.toString().trim(),
        nama: row[namaIdx]?.toString().trim(),
        departemen: deptIdx !== -1 ? row[deptIdx]?.toString().trim() || '' : '',
        jabatan: jabatanIdx !== -1 ? row[jabatanIdx]?.toString().trim() || '' : '',
        role: 'user'
      });
    }

    if (users.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data user valid di file Excel' });
    }

    const result = await bulkCreateUsers(users);
    res.json({ 
      success: true, 
      imported: result.length,
      message: `${result.length} user berhasil diimport`
    });

  } catch (error) {
    console.error('Upload Excel error:', error);
    res.status(500).json({ error: 'Gagal memproses file Excel' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { nik, password } = req.body;
    const user = await getUserByNik(nik);
    
    if (!user) {
      return res.status(401).json({ error: 'NIK tidak terdaftar' });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ error: 'Password salah' });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        nik: user.nik,
        nama: user.nama,
        departemen: user.departemen,
        jabatan: user.jabatan,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login gagal' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const allChunks = await getAllChunks();
    let sources = [];
    let augmentedPrompt = message;

    if (allChunks.length > 0) {
      const queryEmbedding = await generateEmbedding(message);
      const relevantChunks = await searchSimilarChunks(queryEmbedding, allChunks, 5);
      
      if (relevantChunks.length > 0) {
        const ragResult = buildRAGPrompt(message, relevantChunks);
        augmentedPrompt = ragResult.prompt;
        sources = ragResult.sources;
      }
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let chatSession = chatSessions.get(sessionId);
    
    if (!chatSession) {
      chatSession = await ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: BASE_INSTRUCTION,
          temperature: 0.3,
        },
      });
      chatSessions.set(sessionId, chatSession);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(`data: ${JSON.stringify({ sources })}\n\n`);

    const resultStream = await chatSession.sendMessageStream({ message: augmentedPrompt });

    for await (const chunk of resultStream) {
      const text = typeof chunk.text === 'function' ? chunk.text() : chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (error) {
    console.error('Chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to communicate with AI service' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

app.post('/api/chat/reset', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) {
    chatSessions.delete(sessionId);
  }
  res.json({ success: true });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasApiKey: !!process.env.GEMINI_API_KEY,
    hasDatabase: !!process.env.DATABASE_URL
  });
});

app.get('/api/spotlight', async (req, res) => {
  try {
    const chunk = await getRandomChunk();
    if (chunk) {
      res.json({
        content: chunk.content,
        documentName: chunk.name || chunk.original_name,
        pageNumber: chunk.page_number
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Spotlight error:', error);
    res.status(500).json({ error: 'Failed to get spotlight' });
  }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const sessions = await getChatSessions(userId);
    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const { id, title, userId } = req.body;
    await createChatSession(id, title || 'Chat Baru', userId);
    res.json({ success: true, id });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.get('/api/sessions/:id/messages', async (req, res) => {
  try {
    const messages = await getChatMessages(req.params.id);
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

app.post('/api/sessions/:id/messages', async (req, res) => {
  try {
    const { role, content, sources } = req.body;
    await saveChatMessage(req.params.id, role, content, sources);
    res.json({ success: true });
  } catch (error) {
    console.error('Save message error:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

app.put('/api/sessions/:id', async (req, res) => {
  try {
    const { title } = req.body;
    await createChatSession(req.params.id, title);
    res.json({ success: true });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

app.delete('/api/sessions/:id', async (req, res) => {
  try {
    await deleteChatSession(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
