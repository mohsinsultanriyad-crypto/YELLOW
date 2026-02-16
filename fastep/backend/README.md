# FASTEP Backend

## Setup

1. Copy `.env.example` to `.env` and fill in your secrets:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `ADMIN_SEED_ID`
   - `ADMIN_SEED_PASSWORD`
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start development server:
   ```sh
   npm run dev
   ```

## API Endpoints

- `POST   /api/auth/login` — Login (returns JWT)
- `GET    /api/users` — List users (admin)
- `POST   /api/users` — Create user (admin)
- `GET    /api/attendance` — List attendance (admin/supervisor)
- `POST   /api/attendance` — Create attendance (worker)
- `PUT    /api/attendance/:id` — Update attendance (supervisor/admin)
- `GET    /api/advance` — List advances
- `POST   /api/advance` — Create advance
- `PUT    /api/advance/:id` — Update advance
- `GET    /api/leave` — List leaves
- `POST   /api/leave` — Create leave
- `PUT    /api/leave/:id` — Update leave
- `GET    /api/announcement` — List announcements
- `POST   /api/announcement` — Create announcement
- `GET    /api/salary/:workerId` — Get salary calculation
- `GET    /api/report/attendance` — Export attendance Excel

## Render Deployment
- Set env vars: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_SEED_ID`, `ADMIN_SEED_PASSWORD`, `FRONTEND_URL`
- Start command: `npm run start`
- Build command: `npm install`

---

See frontend README for integration steps.
