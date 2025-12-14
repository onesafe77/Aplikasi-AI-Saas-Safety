import { UploadedDocument } from '../types';

export interface Source {
  id: number;
  chunkId: number;
  documentName: string;
  pageNumber: number;
  content: string;
  score: number;
}

export interface ChatResponse {
  text: string;
  sources: Source[];
}

let sessionId: string | null = null;

const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

export const initializeChat = (documents: UploadedDocument[] = []) => {
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const updateChatContext = async (documents: UploadedDocument[]) => {
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
  onChunk: (text: string) => void,
  onSources?: (sources: Source[]) => void
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
  let sourcesReceived = false;
  
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
          if (parsed.sources && !sourcesReceived) {
            sourcesReceived = true;
            if (onSources) {
              onSources(parsed.sources);
            }
          }
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

export const uploadDocument = async (
  file: File, 
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; documentId?: number; error?: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true, documentId: result.documentId });
        } else {
          resolve({ success: false, error: result.error || 'Upload failed' });
        }
      } catch (e) {
        resolve({ success: false, error: 'Failed to parse response' });
      }
    });

    xhr.addEventListener('error', () => {
      resolve({ success: false, error: 'Network error during upload' });
    });

    xhr.open('POST', `${getApiUrl()}/api/documents/upload`);
    xhr.send(formData);
  });
};

export const getDocuments = async () => {
  try {
    const response = await fetch(`${getApiUrl()}/api/documents`);
    if (!response.ok) throw new Error('Failed to fetch documents');
    return await response.json();
  } catch (error) {
    console.error('Get documents error:', error);
    return [];
  }
};

export const deleteDocumentApi = async (id: number) => {
  try {
    const response = await fetch(`${getApiUrl()}/api/documents/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Delete document error:', error);
    return false;
  }
};
