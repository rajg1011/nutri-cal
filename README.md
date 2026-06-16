# NutriCal

A calorie-tracking PWA. Log meals, track macros, and chat with an AI nutrition assistant (paid feature).

## Stack

- **Backend**: Node.js, Express 5, Supabase (PostgreSQL), Upstash Redis, OpenAI (GPT-4o-mini), Razorpay, AWS Lambda (Serverless Framework)
- **Frontend**: React 19, React Router 7, Vite, Supabase JS, Razorpay Checkout, PWA

## Structure

```
backend/    Express API, deployed to AWS Lambda
frontend/   React app, deployed to Cloudflare Pages
```

## Getting Started

### Backend

```bash
cd backend
npm install
npm run dev
```

Required env vars (`backend/.env`):

```
OPENAI_API_KEY
SUPABASE_PROJECT_URL
SUPABASE_ANON_KEY
SUPABASE_SUPER_ADMIN
RAZORPAY_API_KEY
RAZORPAY_SECRET
RAZORPAY_PLAN_ID_199
RAZORPAY_WEBHOOK_SECRET
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
CRYPTO_SECRET
AI_Provider          # optional, defaults to "openai"
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Required env vars (`frontend/.env`):

```
VITE_PROJECT_URL
VITE_ANON_KEY
VITE_BACKEND_URL
VITE_RAZORPAY_API_KEY
```

## Deployment

- Backend: `npm run deploy` (Serverless → AWS Lambda, `ap-south-1`)
- Frontend: static build via `npm run build`, deployed to Cloudflare Pages

