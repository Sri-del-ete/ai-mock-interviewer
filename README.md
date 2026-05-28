# AI Mock Interviewer

AI-powered mock interview app with:
- **Frontend:** React + Vite
- **Backend:** Flask + Gemini API

## Project structure

- `/tmp/workspace/Sri-del-ete/ai-mock-interviewer/frontend` – web app
- `/tmp/workspace/Sri-del-ete/ai-mock-interviewer/backend` – API server

## Environment variables

### Frontend (`frontend/.env`)

Use `/tmp/workspace/Sri-del-ete/ai-mock-interviewer/frontend/.env.example` as reference:

```bash
VITE_API_URL=https://your-backend-service.onrender.com
```

### Backend (hosting provider env vars)

```bash
GEMINI_API_KEY=your_gemini_api_key
ALLOWED_ORIGINS=https://your-frontend.vercel.app
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=30
```

`ALLOWED_ORIGINS` supports comma-separated values.

## Local development

### Backend

```bash
cd /tmp/workspace/Sri-del-ete/ai-mock-interviewer/backend
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
cd /tmp/workspace/Sri-del-ete/ai-mock-interviewer/frontend
npm install
npm run dev
```

## Deployment

### Backend (Render)

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app`

### Frontend (Vercel)

- Root directory: `frontend`
- Framework preset: `Vite`
- Environment variable: `VITE_API_URL` = your backend URL

After setup, each GitHub push triggers automatic redeploy on both services.
