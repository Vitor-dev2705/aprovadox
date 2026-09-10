# Project structure

## Project type

AprovadoX is an authenticated React/Vite web application backed by an Express API and PostgreSQL. The existing product is a study platform with routes for contests, subjects, study sessions, revisions, questions, goals, dashboard and weekly planning.

## Functional domains

- Identity: JWT authentication, registration, password recovery and profile.
- Study execution: timer, study sessions, subjects, topics and content.
- Planning: weekly blocks, revisions and dashboard activity views.
- Competition preparation: contests, edital extraction and contest-linked subjects.
- Feedback: statistics, questions, gamification and notifications.

## Runtime layers

- `frontend/src`: React routes, UI primitives, services and Zustand stores.
- `backend/src`: Express routes/controllers, JWT middleware and PostgreSQL pool.
- `database/schema.sql`: deployable PostgreSQL schema and additive migrations.
- `prisma/schema.prisma`: relational model reference; runtime controllers currently use SQL through `pg`.

## Planning extension boundary

The intelligent planner extends the existing contest and planning domains. It does not replace authentication, timer, content extraction or existing study-session recording.
