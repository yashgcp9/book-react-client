# React Client for Book API (MongoDB + JWT)

A minimal React app (Vite) to consume the MongoDB+JWT Books API.

## Setup

```bash
npm install
cp .env.example .env
# set VITE_API_BASE (e.g. http://localhost:3000 or https://api.yourdomain.com)
npm run dev
# http://localhost:5173
```

## Build & Preview

```bash
npm run build
npm run preview
```

## Notes
- Token is stored in localStorage.
- Register/Login via the API, then create/delete books.
