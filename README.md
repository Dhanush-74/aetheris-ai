# 🌌 Aetheris AI — Next-Generation AI Chatbot Powered by Google Gemini

**Aetheris AI** is a premium, full-stack, enterprise-grade AI chatbot application built with modern **React.js**, **Tailwind CSS**, **Node.js**, **Express**, **MongoDB**, and the official **Google Gemini API**. 

Designed with an original **cyber-luminescent, glassmorphic aesthetic**, Aetheris AI delivers a distinct user experience featuring real-time Server-Sent Events (SSE) streaming, continuous contextual memory across multi-turn dialogues, LaTeX mathematical expression rendering, syntax-highlighted code execution blocks, user authentication, and responsive cross-platform support.

---

## 🌟 Key Features

- **Unique & Original Identity**: Ethereal dark and crystalline light themes, animated neural synaptic orb, glassmorphism panels, and smooth micro-animations powered by Framer Motion.
- **Official Google Gemini Integration**: Integrated using the official `@google/generative-ai` SDK with support for `gemini-1.5-flash`, `gemini-1.5-pro`, and `gemini-2.0-flash`.
- **Real-Time Streaming Responses**: Chunked SSE delivery displays tokens progressively as the AI reasons. Includes an instant **Stop Generating** button.
- **Intelligent Contextual Memory**: Retains relevant conversation history to effortlessly handle follow-up questions (e.g., *"What is AI?"* &rarr; *"Explain its applications"* &rarr; *"Give me some real-world examples"*).
- **Auto-Generated Conversation Titles**: Concisely synthesizes conversation intent into a 3–5 word title automatically after the first message.
- **Rich Markdown, Math & Code Rendering**:
  - Full **GitHub Flavored Markdown** (tables, blockquotes, lists).
  - Mathematical equations rendered via **KaTeX** (inline `$...$` and display blocks `$$...$$`).
  - Code blocks with syntax highlighting, language badges, line counts, and 1-click **Copy Code** button.
- **Conversation Management**:
  - Search conversation history by title in real-time.
  - Previous chats grouped by recency (*Today*, *Yesterday*, *Previous 7 Days*, *Older*).
  - Inline conversation renaming and deletion.
  - 1-Click Clear All history.
- **User Authentication**:
  - Secure registration and login using **bcryptjs** (10 salt rounds) and **JWT** (JSON Web Tokens).
  - Protected API routes and individual conversation isolation.
  - **1-Click Guest Explorer Demo** account for instant zero-friction evaluation.
- **Resilient Zero-Friction Database Architecture**:
  - Connects to **MongoDB Atlas** or local MongoDB via Mongoose.
  - Includes a built-in JSON fallback repository so the application works immediately out-of-the-box without requiring an external database installation.

---

## 🏗️ Project Architecture

```
aetheris-ai/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment configuration & DB connector
│   │   ├── controllers/     # Auth, Chat, and User controller logic
│   │   ├── middleware/      # JWT auth, rate limiter, error handlers
│   │   ├── models/          # User, Conversation, Message schemas
│   │   ├── routes/          # REST & SSE streaming route definitions
│   │   ├── services/        # Gemini API streaming & Title generator
│   │   ├── utils/           # Logger & resilient JSON store fallback
│   │   └── server.js        # Express app entry & static SPA serving
│   ├── package.json
│   ├── .env
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Glassmorphic UI components & Glowing Orb
│   │   ├── context/         # Auth, Chat, and Theme Context providers
│   │   ├── services/        # Fetch API & SSE stream reader
│   │   ├── styles/          # Tailwind CSS and KaTeX integration
│   │   ├── App.jsx          # Dashboard layout & shortcuts
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── package.json             # Root monorepo scripts
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher

### 2. Configure Environment Variables
Inside `backend/`:
```bash
cd backend
cp .env.example .env
```
Ensure your `backend/.env` file contains your credentials:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/aetheris_ai
JWT_SECRET=your_secure_random_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
MAX_HISTORY_MESSAGES=20
```

### 3. How to Obtain a Google Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google Account.
3. Click on **"Get API key"** in the top navigation.
4. Click **"Create API key in new project"** (or select an existing Google Cloud project).
5. Copy the generated key (it typically begins with `AIzaSy...`).
6. Paste the key into `backend/.env` as `GEMINI_API_KEY`, or paste it directly in the in-app **Settings (⚙️)** panel.

### 4. Running Locally

#### Development Mode (Concurrent Vite + Express)
Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
cd backend
npm run dev
# Starts backend on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Starts Vite dev server on http://localhost:5173
```

#### Production Mode (Unified Single-Port Serving)
You can serve the entire application from a single port (5000):
```bash
# 1. Build the frontend assets
cd frontend
npm run build

# 2. Start the unified server
cd ../backend
npm start
# Visit http://localhost:5000 in your browser!
```

---

## 🌐 Public Internet Deployment Guide

### Option 1: Render / Railway (Unified Full-Stack Deployment)
1. Push your repository to GitHub.
2. In [Render](https://render.com) or [Railway](https://railway.app), create a new **Web Service**.
3. Set the Root Directory to the repository root.
4. Set **Build Command**:
   ```bash
   npm --prefix frontend install && npm --prefix frontend run build && npm --prefix backend install
   ```
5. Set **Start Command**:
   ```bash
   node backend/src/server.js
   ```
6. Add your Environment Variables:
   - `GEMINI_API_KEY`: Your Google AI Studio key
   - `GEMINI_MODEL`: `gemini-1.5-flash`
   - `MONGODB_URI`: Your MongoDB Atlas URI (`mongodb+srv://...`)
   - `JWT_SECRET`: A long random secret string
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default for Railway/Render)

### Option 2: Frontend on Vercel + Backend on Render/Railway
1. **Backend Deployment**:
   - Deploy `backend/` to Render/Railway as an Express service.
   - Note the production URL (e.g. `https://aetheris-api.onrender.com`).
2. **Frontend Deployment**:
   - In [Vercel](https://vercel.com), import the repository and select the `frontend` folder as the root directory.
   - Configure a rewrite in `vercel.json` or update `API_BASE` in `frontend/src/services/api.js` to point to your deployed backend URL.

---

## 🛡️ Database Connection (MongoDB Atlas)
To connect to a managed cloud MongoDB database:
1. Create a free M0 cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Database Access**, create a user with read/write privileges.
3. Under **Network Access**, whitelist `0.0.0.0/0` (allow access from anywhere) or your server IP.
4. Click **Connect** &rarr; **Drivers** (Node.js) &rarr; Copy the connection string.
5. Replace `<password>` with your database user password and update `MONGODB_URI` in `backend/.env`.

---

## 🧪 Testing and Verification Checklist

- [x] **Backend REST API**: Health check, Auth endpoints, and Conversation endpoints verified.
- [x] **SSE Streaming**: Chunks streamed smoothly with real-time UI updates.
- [x] **Context Memory**: Multi-turn history preserved and passed to Gemini.
- [x] **Markdown & Code**: Prism code highlighting and KaTeX LaTeX rendering active.
- [x] **Stop Generating**: Streaming can be immediately aborted by the user.
- [x] **Theme Switcher**: Dark and Light modes dynamically toggleable with localStorage persistence.
- [x] **Production Build**: Vite builds minified static assets in under 6 seconds.
