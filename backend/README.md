# Backend Setup - Heart Disease Risk Assessment API

Follow these steps to set up and run the backend API locally.

1. Copy environment file

```bash
# copy example env into active .env
npm run setup:env
```

Then open `.env` and set any required keys (for example, `HUGGINGFACE_API_KEY`).

2. Install dependencies

```bash
npm install
```

3. Start the server in development mode

```bash
npm run dev
```

The server defaults to `PORT` from `.env` (default `5000`). The root endpoint is `GET /` and a health check is available at `GET /api/health`.

4. Quick verification

```bash
curl http://localhost:5000/api/health
# expected: { "status": "ok", "message": "Heart Disease Risk Assessment API is running" }
```

Notes
- Keep secrets out of version control; `.env` is for local development only.
- If you want to run the server in production, set `NODE_ENV=production` and use a process manager (PM2, Docker, etc.).
