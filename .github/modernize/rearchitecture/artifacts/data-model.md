# Data model

## Existing entities

`users` owns `concursos`, `materias`, `sessoes_estudo`, `revisoes`, `metas`, `questoes_erradas` and weekly planning blocks. A `concurso` owns its `materias`; a `materia` owns `assuntos` and `conteudos`.

## Planner entities

- `concursos`: official and estimated dates, lifecycle status and exam metadata.
- `materias`: priority, mastery (`dominio`), estimated workload and weekly target.
- `assuntos`: topic-level completion used for content coverage.
- `preferencias_estudo`: user availability, session limits and safety margin.
- `planejamento_semanal`: generated cycle blocks; still linked to the owning subject.
- `revisoes`: contest isolation is achieved through the subject relationship.
- `resultados_questoes`: contest/subject/assunto-level accuracy history.
- `simulados`: contest-level evolution of accuracy and time.

All planner reads and writes are user-scoped. A projection is derived from the contest's subjects, topics, study sessions, revisions and question results; it is not persisted as duplicated aggregate state.
