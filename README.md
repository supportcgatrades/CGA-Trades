# Tavari Wave - Production Deployment Guide

This application is a full-stack React (Vite) + Express application, prepared for deployment on modern cloud platforms.

## 🚀 Netlify Deployment (Frontend)

This project contains a `netlify.toml` file configured for automated deployments.

1. **Connect to GitHub**: Push this codebase to a GitHub repository.
2. **Deploy to Netlify**: Import the repository into Netlify.
3. **Build Settings**:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. **Environment Variables**: Add the following to Netlify's UI:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `JWT_SECRET`: A secure random string for authentication.
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `NODE_ENV`: `production`

> **Note**: As an Express + Vite full-stack app, Netlify will serve the static frontend. For the backend API to function, you should deploy the compiled `dist/server.cjs` to a Node-capable environment (like Heroku, Render, or Google Cloud Run) and update the frontend fetch URLs if they are not relative.

## ☁️ Google Cloud / Cloud Run Deployment

The project is optimized for containerized environments like Google Cloud Run.

1. **Build**: `npm run build`
2. **Start**: The `npm start` command runs the bundled CommonJS server (`dist/server.cjs`), which is highly efficient for production.
3. **Environment**: Ensure `DATABASE_URL`, `JWT_SECRET`, and `GEMINI_API_KEY` are set in the service environment.

## 🔑 Environment Variables (.env)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string. |
| `JWT_SECRET` | Secret key for JWT signing. |
| `GEMINI_API_KEY` | Google AI API key. |
| `NODE_ENV` | Environment mode (`production` / `development`). |
| `VITE_FIREBASE_API_KEY` | Firebase API Key. |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID. |
| `VITE_FIREBASE_APP_ID` | Firebase App ID. |
| `VITE_FIREBASE_DATABASE_ID` | Specific Firestore Database ID. |

## 🤖 Wave Assistance (AI Chat)
The chatbot relies on the `GEMINI_API_KEY`. In production, this must be set on the server environment. The frontend proxies all chat requests through `/api/ai/chat` to keep your API key secure.

- **Authentication**: Fully integrated with JWT and PostgreSQL.
- **Transactions**: Securely handled via PostgreSQL transactions.
- **Transfers**: Internal wallet-to-wallet and user-to-user protocols are live.
- **AI Support**: Powered by Google Gemini via server-side secure proxy.
- **Withdrawals**: Comprehensive settlement flow with institutional audit logs.
