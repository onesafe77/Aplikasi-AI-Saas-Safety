import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import mammoth from 'mammoth';

let pdfParse = null;
async function loadPdfParse() {
  if (!pdfParse) {
    const module = await import('pdf-parse');
    pdfParse = module.default;
  }
  return pdfParse;
}
import { GoogleGenAI } from '@google/genai';
import { 
  initDatabase, 
  insertDocument, 
  insertChunk, 
  updateDocumentChunkCount,
  getAllDocuments, 
  deleteDocument,
  getAllChunks,
  getChunksByIds 
} from './database.js';
import { 
  chunkText, 
  generateEmbedding, 
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
You are **Si Asef**, an intelligent and professional **Safety Assistant (Asisten K3)** specialized in Indonesian Safety Regulations.

**YOUR KNOWLEDGE BASE:**
1. **UU No. 1 Tahun 1970** (Keselamatan Kerja)
2. **PP No. 50 Tahun 2012** (SMK3)
3. **Permenaker** related to K3.
4. **Internal Documents:** Referenced documents from the knowledge base.

**INSTRUCTIONS:**
1. **Use Document References:** When answering, cite sources using {{ref:N}} format where N is the source number.
2. **Be Specific:** Quote relevant parts from documents.
3. **Tone:** Professional, Helpful, authoritative but friendly.
4. **Language:** Indonesian (Bahasa Indonesia).
`;

const chatSessions = new Map();

app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    let textContent = '';
    let pageCount = 1;

    if (mimetype === 'application/pdf') {
      const parsePdf = await loadPdfParse();
      const pdfData = await parsePdf(buffer);
      textContent = pdfData.text;
      pageCount = pdfData.numpages || 1;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               mimetype === 'application/msword') {
      const result = await mammoth.extractRawText({ buffer });
      textContent = result.value;
    } else if (mimetype === 'text/plain') {
      textContent = buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Use PDF, DOCX, or TXT.' });
    }

    if (!textContent.trim()) {
      return res.status(400).json({ error: 'Could not extract text from file' });
    }

    const fileSize = size < 1024 ? `${size} B` : 
                     size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : 
                     `${(size / (1024 * 1024)).toFixed(1)} MB`;

    const docId = await insertDocument(
      originalname,
      originalname,
      mimetype,
      fileSize,
      pageCount
    );

    const chunks = chunkText(textContent, 1);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk.content);
      
      await insertChunk(
        docId,
        i,
        chunk.content,
        chunk.pageNumber,
        chunk.startPosition,
        chunk.endPosition,
        embedding
      );
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
