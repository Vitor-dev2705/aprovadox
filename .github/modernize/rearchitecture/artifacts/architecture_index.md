# Implementation Guide

This index is not the full contract. Before changing a unit, implementation agents must read that unit's `behavior.yaml`, `bindings.yaml`, `unit_decomposition.yaml`, the relevant rows in `unit_graph.yaml`, and the global artifacts listed below.

## Global reading order

1. `migration_boundary.yaml` — additive scope and protected legacy behavior.
2. `project-structure.md` and `tech-stack.md` — runtime boundaries.
3. `data-model.md` — current ownership and relationships.
4. `wire_contracts.yaml`, `shared_modules.yaml`, `cross_unit_state.yaml` and `seams.yaml` — integration constraints.

## Unit implementation guide

| Unit | Read first | Filter global rows | Completion evidence |
|---|---|---|---|
| auth | `units/auth/*` | auth routes, JWT and `req.userId` | Auth flows and protected-route behavior unchanged |
| contests | `units/contests/*` | contest/date/projection contracts | Contest CRUD, no-date state and projection build |
| subjects-content | `units/subjects-content/*` | contest ownership and content relationships | Subject/topic/content CRUD and import remain functional |
| study-dashboard | `units/study-dashboard/*` | timezone and aggregate read models | Existing dashboard/statistics plus planner read models |
| weekly-planning | `units/weekly-planning/*` | generated versus manual blocks | Existing planning remains editable; adaptive generation is additive |
| study-execution | `units/study-execution/*` | session ownership and timer state | Timer/session recording and pace inputs remain correct |
| revision | `units/revision/*` | subject/content-linked review state | Existing review queue plus adaptive intervals |
| questions | `units/questions/*` | question ownership and performance history | Existing wrong-question flow plus contest performance |
| edital-extraction | `units/edital-extraction/*` | advisory extraction contract | URL/text import remains reviewable before persistence |
| gamification | `units/gamification/*` | optional reward signals | Gamification remains independent from planner calculations |
| notifications | `units/notifications/*` | informational alert boundaries | Alerts do not mutate study source records unexpectedly |

## Proposed incremental implementation boundary

1. Normalize contest and subject ownership without removing legacy rows.
2. Add user availability/preferences and a deterministic planner service.
3. Add contest-scoped Hoje and dashboard read models.
4. Add adaptive cycle scheduling and spaced reviews.
5. Add question-attempt and simulation history only where current schema lacks it.
6. Improve responsive navigation and mobile task completion using existing layout primitives.

## Cross-cutting rules

- Never expose another user's contest, subject, session, review, question or derived metrics.
- Official dates override estimated dates; unknown dates remain valid.
- Estimations and recommendations must be labeled as such.
- Planner output describes rhythm, coverage, workload, performance and risk; it never predicts approval.
- Deterministic calculations must live in backend/domain services, not inside React components.
