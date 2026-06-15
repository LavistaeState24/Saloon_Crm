# Property Management CRM

Premium MERN property management and real estate inventory CRM with JWT auth, role-based access, smart inventory filtering, lead management, follow-up tracking, and client-safe sharing.

## Apps

- `client/`: React + Vite + Tailwind frontend
- `server/`: Express + MongoDB backend

## Quick Start

1. Install dependencies in `client/` and `server/`
2. Copy `server/.env.example` to `server/.env`
3. Copy `client/.env.example` to `client/.env`
4. Keep both `.env` files local only. They are ignored by git.
5. Do not commit production secrets. Set production variables in Vercel and Render dashboards.
6. For optional machine-specific overrides, use untracked files like `server/.env.local` or `client/.env.local`
7. Set `VITE_API_URL` in `client/.env`
8. Set `MONGODB_URI` to your MongoDB Atlas cluster
9. Set Cloudinary credentials:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
10. Run `npm run dev` in each app or use the package scripts from the repo root

## Environment Strategy

- Local development:
  - `server/.env`
  - `client/.env`
- Optional local overrides:
  - `server/.env.local`
  - `client/.env.local`
- Production:
  - No committed `.env` file
  - Configure variables directly in Render and Vercel

The server loads env files in this order, without overriding real platform variables:
- `.env.[NODE_ENV].local`
- `.env.local`
- `.env.[NODE_ENV]`
- `.env`

## Example Local Variables

### Client

```bash
VITE_API_URL=http://localhost:5000
```

### Server

```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/property-management-crm
JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Deployment

### Frontend on Vercel

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Production environment variable:
  - `VITE_API_URL=https://your-render-backend.onrender.com/api`

### Backend on Render

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Production environment variables:
  - `NODE_ENV=production`
  - `MONGODB_URI=...`
  - `JWT_SECRET=...`
  - `JWT_EXPIRES_IN=7d`
  - `CLIENT_URL=https://your-vercel-frontend.vercel.app`
  - `CLOUDINARY_CLOUD_NAME=...`
  - `CLOUDINARY_API_KEY=...`
  - `CLOUDINARY_API_SECRET=...`

## Upload Storage

- Files upload to Cloudinary
- MongoDB stores public Cloudinary URLs
- No local `/uploads` storage is required in production
