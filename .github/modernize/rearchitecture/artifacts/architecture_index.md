# Implementation Guide

This index is not the full contract. Before changing a unit, implementation agents must read the unit source and the relevant global artifacts in this directory.

## Contest planning

- Read `unit_graph.yaml`, `migration_boundary.yaml` and `data-model.md`.
- Read `backend/src/controllers/concursos.controller.js`, `backend/src/controllers/projecao.controller.js` and `frontend/src/pages/ConcursoDashboard.jsx`.
- Preserve official-date precedence over estimated date, user scoping and projection language.
- Completion evidence: frontend build passes; backend syntax checks pass; schema contains additive planner columns/tables.

## Existing study flows

- Subjects/topics: preserve `materia_id` ownership and existing topic toggles.
- Sessions/revisions: preserve current `user_id` filters; projections may aggregate them but must not duplicate records.
- Weekly planning: preserve drag/drop behavior; generated cycle blocks remain contest-linked through subjects.

## Cross-cutting rules

- Never expose another user's contest or derived metrics.
- Estimated dates must remain visibly marked and must never be presented as official.
- Projection output describes preparation rhythm, coverage and risk; it never predicts approval.
