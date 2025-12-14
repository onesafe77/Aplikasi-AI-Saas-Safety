# Si Asef - Safety Assistant

## Overview
Si Asef is an AI-powered safety assistant that helps answer questions about Indonesian K3 (Keselamatan dan Kesehatan Kerja - Occupational Health and Safety) regulations. The application uses Google Gemini AI to provide intelligent responses to safety-related queries.

**Current State**: Production-ready React + TypeScript + Vite application configured for Replit deployment.

## Project Architecture

### Tech Stack
- **Frontend Framework**: React 19.2.1
- **Language**: TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Backend**: Express.js (Node.js)
- **AI Service**: Google Gemini AI via @google/genai (server-side, API key secured)
- **UI Components**: Custom components with Lucide React icons
- **Markdown Rendering**: react-markdown for formatted responses

### Project Structure
```
.
├── components/           # React components
│   ├── AdminDashboard.tsx  # Document upload/delete management
│   ├── ChatBubble.tsx      # Message display with citation parsing
│   ├── CitationBubble.tsx  # Green bubble badges for source references
│   ├── InputArea.tsx
│   ├── LandingPage.tsx
│   ├── Login.tsx
│   ├── Modals.tsx
│   └── Sidebar.tsx
├── server/              # Backend server
│   ├── index.js         # Express server with all API endpoints
│   ├── database.js      # PostgreSQL operations for documents/chunks
│   └── rag.js           # Chunking, embeddings, semantic search
├── services/            # Frontend services
│   └── gemini.ts        # API client with SSE streaming
├── App.tsx              # Main application with document/chat integration
├── index.tsx            # Application entry point
├── types.ts             # TypeScript type definitions
├── vite.config.ts       # Vite configuration with API proxy
└── package.json         # Dependencies and scripts
```

### Security Architecture
The application uses a secure backend proxy pattern:
- Frontend makes requests to `/api/chat` endpoint
- Backend server (port 3001) handles Gemini API calls with the secure API key
- API key is never exposed to the client
- Vite dev server proxies `/api` requests to the backend

## Recent Changes (December 14, 2025)
1. **Citation Improvements**: AI now uses citations sparingly at end of sentences/paragraphs
2. **Citation Badge Styling**: Smaller, superscript-style badges that don't disrupt reading
3. **Regulasi Spotlight Section**: New animated section on landing page with quote display
4. **Dynamic Spotlight Content**: Spotlight fetches random quotes from uploaded documents
5. **Chat History Feature**: Full conversation persistence with database storage
   - Chat sessions saved to PostgreSQL (chat_sessions, chat_messages tables)
   - View and continue previous conversations from sidebar
   - Session titles auto-generated from first message
6. **AI Response Formatting**: AI now uses structured formatting (bullet points, numbered lists, headers, bold text) for better readability
7. **Citation Hover Preview**: Hover over citation badges to see quick preview with document name, page, and excerpt (300ms delay)
8. **Source Panel**: Click citation badges to open full-screen side panel with complete document reference details
9. **Fixed Markdown with Citations**: ReactMarkdown now properly renders bold, lists, headers alongside inline citation bubbles
10. **Natural AI Tone**: Updated AI prompt to be more conversational and less robotic - uses friendly Indonesian, practical tips, natural transitions

### Previous Changes
- Fixed pdf-parse import using dynamic import for ESM compatibility
- Added upload progress bar with percentage indicator
- Added success/error notifications after upload completes
- Improved file upload UX with real-time progress tracking

## Previous Changes (December 6, 2025)
1. Configured Vite server for Replit environment (port 5000, allowedHosts: true)
2. Set up GEMINI_API_KEY as a Replit secret
3. Created workflow for development server
4. Updated .gitignore for environment variables
5. Configured deployment settings for production

## Environment Configuration

### Required Secrets
- `GEMINI_API_KEY` - Google Gemini API key (configured in Replit Secrets)

### Server Configuration
- **Development Port**: 5000 (required for Replit webview)
- **Host**: 0.0.0.0 (binds to all interfaces)
- **Allowed Hosts**: true (enables Replit proxy to work correctly)

## Development

### Running Locally
```bash
npm run dev
```
The application will start on http://localhost:5000

### Building for Production
```bash
npm run build
```
Output will be in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

## Deployment
This project is configured for autoscale deployment on Replit:
- **Build Command**: `npm run build`
- **Run Command**: `node server/index.js`
- **Deployment Type**: Autoscale (requires backend for AI API calls)

## Key Features
- Real-time chat interface with AI assistant
- Indonesian K3 regulations expertise
- **RAG System**: Document-based retrieval augmented generation
  - Upload PDF, Word, or TXT documents
  - Automatic text chunking and embedding generation
  - Semantic search for relevant document passages
  - Inline citations with clickable green bubble badges
- Admin dashboard for document management (upload/delete)
- User authentication system
- Markdown-formatted responses with source attribution
- Sidebar navigation

## User Preferences
None documented yet.

## Notes
- Uses Tailwind CSS via CDN (warning shown in console - consider PostCSS setup for production optimization)
- Vite's hot module replacement (HMR) enabled for fast development
- Environment variables are injected at build time via Vite's define option
