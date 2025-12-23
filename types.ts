export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Source {
  id: number;
  chunkId: number;
  documentName: string;
  pageNumber: number;
  content: string;
  score: number;
  folder?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  sources?: Source[];
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
}

export interface User {
  name: string;
  email: string;
  plan: 'free' | 'pro';
  role?: 'user' | 'admin'; // Added role
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  content: string; // The actual text content
  uploadDate: number;
  size: string;
  folder?: string;
}

export type LoadingState = 'idle' | 'streaming' | 'error';
export type ViewState = 'landing' | 'login' | 'chat' | 'admin';