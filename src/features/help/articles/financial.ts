import type { HelpArticle } from "./index";

export const financialArticles: HelpArticle[] = [
  {
    id: "financial-data",
    title: "Dados Financeiros",
    category: "financial",
    categoryLabel: "Financeiro",
    content: `# Dados Financeiros

O módulo financeiro permite visualizar os repasses e transações do iFood, além de exportar os dados para controle contábil.

## Visão geral

Na página **Financeiro**, você encontra:

- **Resumo do período** — Totais de faturamento, taxas, repasses e descontos
- **Lista de transações** — Detalhamento de cada movimentação financeira
- **Gráfico de evolução** — Visualização da evolução dos valores ao longo do tempo

## Tipos de transação

As transações financeiras podem ser:

- **Repasse** — Valor transferido pelo iFood para a conta do restaurante
- **Taxa de serviço** — Percentual cobrado pelo iFood sobre cada pedido
- **Taxa de entrega** — Valor cobrado pela entrega (quando aplicável)
- **Promoções** — Descontos subsidiados por promoções do iFood
- **Cancelamentos** — Estornos de pedidos cancelados
- **Ajustes** — Correções manuais feitas pelo iFood

## Filtros

Você pode filtrar as transações por:

- **Período** — Selecione datas específicas
- **Tipo** — Filtre por tipo de transação
- **Valor** — Filtre por faixa de valores

## Exportando dados

O GTBI permite exportar os dados financeiros para planilhas:

### Exportar como CSV

1. Aplique os filtros desejados
2. Clique em **Exportar**
3. Selecione **CSV**
4. O arquivo será baixado automaticamente

### Exportar como XLS (Excel)

1. Aplique os filtros desejados
2. Clique em **Exportar**
3. Selecione **XLS**
4. O arquivo será baixado automaticamente

## Dados exportados

O arquivo exportado inclui as seguintes colunas:

| Coluna | Descrição |
|--------|-----------|
| Data | Data da transação |
| Tipo | Tipo da transação |
| Descrição | Detalhes da transação |
| Pedido | Número do pedido relacionado |
| Valor bruto | Valor antes das taxas |
| Taxas | Total de taxas cobradas |
| Valor líquido | Valor após taxas |

## Resumo financeiro

O resumo no topo da página mostra:

- **Faturamento bruto** — Soma de todos os pedidos
- **Taxas totais** — Soma de todas as taxas (serviço + entrega)
- **Repasse líquido** — Valor efetivamente recebido
- **Ticket médio** — Valor médio por pedido

## Dicas

- Exporte os dados **mensalmente** para manter o controle contábil em dia
- Compare o **repasse líquido** com o **faturamento bruto** para entender o impacto das taxas
- Acompanhe os **cancelamentos** — eles afetam diretamente o faturamento do restaurante
- Use os filtros para analisar períodos específicos (ex: fins de semana vs dias úteis)`,
    tags: ["financeiro", "repasse", "taxa", "exportar", "csv", "xls", "faturamento", "transação"],
  },
];
