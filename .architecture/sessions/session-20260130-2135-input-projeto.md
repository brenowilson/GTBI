[SESSION]
Timestamp: 2026-01-30T21:35-03:00
Solicitante: Breno
Modelo: Claude Opus 4.5

Resumo da sessao:
- Criacao do documento docs/10-input-projeto.md
- Define input minimo para geracao automatica de PRD

Conteudo principal:

## Fluxo definido
Input Usuario -> Agente Gerador -> PRD Draft -> Revisao Humana -> PRD Final

## 5 Campos Obrigatorios
1. Nome do projeto
2. Descricao em uma frase
3. Problema que resolve
4. Usuarios-alvo
5. Funcionalidades principais (3-7 itens)

## 5 Campos Opcionais
6. O que NAO e (non-goals)
7. Concorrentes/referencias
8. Diferenciais
9. Restricoes tecnicas
10. Metricas de sucesso

## Recursos do documento
- Template de input (copiar e preencher)
- Exemplo minimo (5 campos)
- Exemplo completo (10 campos)
- O que o agente infere automaticamente
- Marcadores [DECISAO] para revisao humana
- Loop de refinamento com humano
- Validacao de input incompleto
- Integracao com framework

Decisoes de design:
- Minimo de 5 campos para reduzir barreira de entrada
- Campos opcionais enriquecem mas nao bloqueiam
- [DECISAO] markers para pontos que precisam input humano
- Loop interativo para refinamento
