import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const BASE_INSTRUCTION = `
You are **Si Asef**, an intelligent and professional **Safety Assistant (Asisten K3)** specialized in Indonesian Safety Regulations.

**YOUR KNOWLEDGE BASE:**
1. **UU No. 1 Tahun 1970** (Keselamatan Kerja)
2. **PP No. 50 Tahun 2012** (SMK3)
3. **Permenaker** related to K3.
4. **Internal Documents:** The user may provide specific internal documents (context below).

**INSTRUCTIONS:**
1. **Prioritize Uploaded Documents:** If the user asks about internal matters and documents are provided below, answer primarily from there. Cite the file name like this: **[Sumber: namafile.pdf]**.
2. **General Regulations:** If the answer is not in the uploaded documents, use your general knowledge of Indonesian K3 laws. Cite specific articles (Pasal/Ayat) if possible.
3. **Tone:** Professional, Helpful, authoritative but friendly.
4. **Language:** Indonesian (Bahasa Indonesia).

**UPLOADED DOCUMENTS CONTEXT:**
`;

const formatDocuments = (docs) => {
  if (!docs || docs.length === 0) return "No internal documents uploaded yet.";
  
  return docs.map(doc => `
--- BEGIN SOURCE: ${doc.name} ---
${doc.content.substring(0, 20000)}
--- END SOURCE: ${doc.name} ---
  `).join('\n');
};

const chatSessions = new Map();

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId, documents } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let chatSession = chatSessions.get(sessionId);
    
    if (!chatSession) {
      const context = formatDocuments(documents);
      const fullSystemInstruction = `${BASE_INSTRUCTION}\n${context}`;
      
      chatSession = await ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: fullSystemInstruction,
          temperature: 0.3,
        },
      });
      chatSessions.set(sessionId, chatSession);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const resultStream = await chatSession.sendMessageStream({ message });

    for await (const chunk of resultStream) {
      const text = typeof chunk.text === 'function' ? chunk.text() : chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (error) {
    console.error('Gemini API error:', error);
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
  res.json({ status: 'ok', hasApiKey: !!process.env.GEMINI_API_KEY });
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
