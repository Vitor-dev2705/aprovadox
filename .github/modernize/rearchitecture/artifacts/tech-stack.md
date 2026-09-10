# Technology stack

- Frontend: React 18, React Router 6, Vite, Tailwind CSS, Framer Motion, Recharts, Axios, Zustand.
- Backend: Node.js, Express, Helmet, CORS, JWT, `pg`.
- Database: PostgreSQL/Neon; SQL schema is authoritative for the current controllers.
- Existing integration: edital extraction endpoint accepts URL or pasted text.
- Security boundary: authenticated API routes use `backend/src/middleware/auth.js` and every planner query filters by `req.userId`.
- Migration note: new planner tables/columns are additive and must be applied from `database/schema.sql` before enabling projection endpoints in a deployed database.
