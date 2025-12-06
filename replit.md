# Si Asef - Safety Assistant

## Overview
Si Asef is an AI-powered safety assistant that helps answer questions about Indonesian K3 (Keselamatan dan Kesehatan Kerja - Occupational Health and Safety) regulations. The application uses Google Gemini AI to provide intelligent responses to safety-related queries.

**Current State**: Production-ready React + TypeScript + Vite application configured for Replit deployment.

## Project Architecture

### Tech Stack
- **Frontend Framework**: React 19.2.1
- **Language**: TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **AI Service**: Google Gemini AI via @google/genai
- **UI Components**: Custom components with Lucide React icons
- **Markdown Rendering**: react-markdown for formatted responses

### Project Structure
```
.
├── components/           # React components
│   ├── AdminDashboard.tsx
│   ├── ChatBubble.tsx
│   ├── InputArea.tsx
│   ├── LandingPage.tsx
│   ├── Login.tsx
│   ├── Modals.tsx
│   └── Sidebar.tsx
├── services/            # API services
│   └── gemini.ts       # Gemini AI integration
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
├── types.ts            # TypeScript type definitions
├── vite.config.ts      # Vite configuration
└── package.json        # Dependencies and scripts
```

## Recent Changes (December 6, 2025)
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
This project is configured for static deployment on Replit:
- **Build Command**: `npm run build`
- **Public Directory**: `dist`
- **Deployment Type**: Static (client-side only)

## Key Features
- Real-time chat interface with AI assistant
- Indonesian K3 regulations expertise
- Admin dashboard for management
- User authentication system
- Markdown-formatted responses
- Sidebar navigation

## User Preferences
None documented yet.

## Notes
- Uses Tailwind CSS via CDN (warning shown in console - consider PostCSS setup for production optimization)
- Vite's hot module replacement (HMR) enabled for fast development
- Environment variables are injected at build time via Vite's define option
