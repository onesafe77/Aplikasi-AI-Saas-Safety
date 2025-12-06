import { UploadedDocument } from '../types';

let sessionId: string | null = null;
let currentDocuments: UploadedDocument[] = [];

const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

export const initializeChat = (documents: UploadedDocument[] = []) => {
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  currentDocuments = documents;
};

export const updateChatContext = async (documents: UploadedDocument[]) => {
  currentDocuments = documents;
  if (sessionId) {
    try {
      await fetch(`${getApiUrl()}/api/chat/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    } catch (error) {
      console.error('Failed to reset chat session:', error);
    }
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

export const sendMessageToGemini = async (
  content: string, 
  onChunk: (text: string) => void
): Promise<void> => {
  if (!sessionId) {
    initializeChat();
  }

  const response = await fetch(`${getApiUrl()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: content,
      sessionId,
      documents: currentDocuments,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to communicate with AI service');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) {
            onChunk(parsed.text);
          }
          if (parsed.error) {
            throw new Error(parsed.error);
          }
        } catch (e) {
        }
      }
    }
  }
};
