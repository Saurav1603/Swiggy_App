# Swiggy Concierge — Manual Proxy Ordering Platform

A production-ready web app where customers upload Swiggy cart screenshots, an admin calculates the price, customer pays via UPI, and admin places the order manually.

## Tech Stack
- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Prisma ORM
- **Image Storage**: Cloudinary (client-side unsigned upload)
- **Auth**: JWT for admin

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and fill in:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/swiggy_concierge"
JWT_SECRET="a-random-secret-string"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your-unsigned-preset"
NEXT_PUBLIC_UPI_ID="merchant@upi"
NEXT_PUBLIC_UPI_QR_URL="/upi-qr.png"
```

### 3. Database setup
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Seed admin user
```bash
npm run seed
```
Default credentials: `admin@example.com` / `admin123`

### 5. Run dev server
```bash
npm run dev
```
Open http://localhost:3000

---

## Cloudinary Setup
1. Create a free Cloudinary account.
2. Go to Settings → Upload → Add upload preset.
3. Set **Signing Mode** to **Unsigned**.
4. Copy the preset name to `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
5. Copy your cloud name to `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.

---

## API Documentation

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requests` | Create order request |
| GET | `/api/requests/[id]` | Get request by ID |
| POST | `/api/requests/[id]/payment` | Submit UTR |

### Admin Endpoints (JWT required in `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/requests` | List all requests |
| GET | `/api/admin/requests/[id]` | Get request detail |
| PATCH | `/api/admin/requests/[id]` | Update status |
| POST | `/api/admin/requests/[id]/pricing` | Set pricing |
| POST | `/api/admin/requests/[id]/verify-payment` | Verify payment |
| POST | `/api/admin/requests/[id]/tracking` | Add tracking info |

---

## Deployment

### Vercel
1. Push to GitHub.
2. Import in Vercel.
3. Add environment variables.
4. Deploy.

### Render / Railway
1. Create a PostgreSQL database.
2. Deploy as Node.js service.
3. Set `DATABASE_URL` and other env vars.
4. Run build command: `npm run build`
5. Start command: `npm start`

---

## Project Structure
```
├── components/       # React components
├── lib/              # Prisma client, JWT, auth helpers
├── pages/
│   ├── api/          # API routes
│   ├── admin/        # Admin pages
│   ├── status/       # Customer status page
│   ├── create.js     # Create request form
│   └── index.js      # Landing page
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── styles/
│   └── globals.css
└── .env.example
```

---

## Security Notes
- Image upload limited to 5 MB, images only (client-side validation).
- Rate limiting on request creation (5 req/min per IP).
- Admin routes protected via JWT middleware.
- Input validation on all forms.

---

## License
MIT
