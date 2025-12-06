import { GoogleGenAI } from '@google/genai';

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

export function chunkText(text, pageNumber = 1) {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  let currentChunk = '';
  let startPos = 0;
  let currentPos = 0;
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        pageNumber,
        startPosition: startPos,
        endPosition: currentPos,
      });
      
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(words.length * 0.1));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
      startPos = currentPos - overlapWords.join(' ').length;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
    currentPos += sentence.length + 1;
  }
  
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      pageNumber,
      startPosition: startPos,
      endPosition: currentPos,
    });
  }
  
  return chunks;
}

export async function generateEmbedding(text) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('No API key for embeddings, using random vectors');
    return Array.from({ length: 768 }, () => Math.random());
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: [{ parts: [{ text }] }],
    });
    return result.embeddings[0].values;
  } catch (error) {
    console.error('Embedding error:', error);
    return Array.from({ length: 768 }, () => Math.random());
  }
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchSimilarChunks(queryEmbedding, allChunks, topK = 5) {
  const scored = allChunks
    .filter(chunk => chunk.embedding && chunk.embedding.length > 0)
    .map(chunk => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  
  return scored;
}

export function buildRAGPrompt(question, relevantChunks) {
  if (!relevantChunks || relevantChunks.length === 0) {
    return {
      prompt: question,
      sources: [],
    };
  }
  
  const sources = relevantChunks.map((chunk, index) => ({
    id: index + 1,
    chunkId: chunk.id,
    documentName: chunk.original_name || chunk.document_name,
    pageNumber: chunk.page_number,
    content: chunk.content,
    score: chunk.score,
  }));
  
  const contextText = sources
    .map(s => `[Sumber ${s.id}] (${s.documentName}, Halaman ${s.pageNumber}):\n${s.content}`)
    .join('\n\n');
  
  const prompt = `Berdasarkan dokumen referensi berikut, jawab pertanyaan user.
PENTING: Sertakan nomor referensi dalam jawaban menggunakan format {{ref:N}} dimana N adalah nomor sumber (1, 2, 3, dst).
Contoh: "Menurut peraturan, setiap kecelakaan wajib dilaporkan {{ref:1}} dalam waktu 2x24 jam {{ref:2}}."

DOKUMEN REFERENSI:
${contextText}

PERTANYAAN: ${question}

JAWABAN (sertakan {{ref:N}} untuk setiap fakta yang diambil dari sumber):`;

  return { prompt, sources };
}
