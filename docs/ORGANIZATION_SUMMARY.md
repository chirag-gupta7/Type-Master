# Organization Summary

## Repository Layout

- Monorepo with workspaces for frontend and backend apps
- Shared root scripts for dev/build/test/lint/typecheck
- Documentation in `docs/`

## Runtime Layout

- Browser/UI: Next.js frontend
- API: Express backend
- Data: PostgreSQL via Prisma

## Deployment Layout

- Live frontend at Vercel
- Backend URL currently referenced via env/fallback to Render
