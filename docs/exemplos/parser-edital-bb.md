# Exemplo de hierarquia de edital

O parser do AprovadoX preserva a estrutura do edital sem transformar atividades em conteúdos:

```text
MATEMÁTICA FINANCEIRA:
1 - Juros simples - Cálculo do montante, dos juros, da taxa de juros, do principal e do prazo.
2 - Sistemas de amortização - Sistema Price; Sistema SAC.
```

Resultado esperado:

```text
Matéria: Matemática Financeira
└── Conteúdo: Juros simples
    ├── Subconteúdo: Montante
    ├── Subconteúdo: Juros
    ├── Subconteúdo: Taxa de juros
    ├── Subconteúdo: Principal
    └── Subconteúdo: Prazo
└── Conteúdo: Sistemas de amortização
    ├── Subconteúdo: Sistema Price
    └── Subconteúdo: Sistema SAC
```

`Teoria`, `Exercícios`, `Questões` e `Revisão` continuam sendo atividades do
planejamento. O parser só cria subconteúdos que aparecem explicitamente no edital.
