import type { HelpArticle } from "./index";

export const performanceArticles: HelpArticle[] = [
  {
    id: "performance-dashboard",
    title: "Como usar o Dashboard de Performance",
    category: "performance",
    categoryLabel: "Performance",
    content: `# Como usar o Dashboard de Performance

O dashboard de performance mostra os principais indicadores do restaurante selecionado no iFood, permitindo acompanhar a evolução das vendas e identificar oportunidades de melhoria.

## Funil de Conversão

O funil mostra as etapas que o cliente percorre desde a busca até a compra:

1. **Visitas** — Quantas vezes o restaurante apareceu nas buscas do iFood
2. **Visualizações** — Quantas vezes os clientes abriram a página do restaurante
3. **Carrinho** — Quantas vezes adicionaram itens ao carrinho
4. **Checkout** — Quantas vezes iniciaram o processo de pagamento
5. **Concluídos** — Quantos pedidos foram finalizados com sucesso

### Como interpretar o funil

- A **taxa de conversão** entre cada etapa indica onde o restaurante está perdendo clientes
- Uma queda grande entre **Visitas** e **Visualizações** pode indicar que a foto de capa ou posição no ranking precisam melhorar
- Uma queda entre **Carrinho** e **Checkout** pode indicar problemas com preço de entrega ou tempo estimado
- Uma queda entre **Checkout** e **Concluídos** pode indicar problemas com pagamento ou cancelamentos

## Comparação com período anterior

Cada métrica exibe uma seta indicando se houve **aumento** ou **queda** em relação ao período anterior. Use essa informação para entender tendências:

- **Seta verde para cima** — Melhoria em relação ao período anterior
- **Seta vermelha para baixo** — Piora em relação ao período anterior

## Período de análise

Os dados exibidos correspondem à semana atual. A comparação é feita automaticamente com a semana anterior para que você possa acompanhar a evolução.

## Dicas práticas

- Acompanhe o funil **semanalmente** para identificar tendências
- Foque na etapa com **maior perda** de conversão
- Compare os dados com as **ações** implementadas na semana
- Use os **relatórios semanais** para ter análises mais detalhadas`,
    tags: ["funil", "conversão", "métricas", "kpi", "dashboard", "vendas", "pedidos"],
  },
  {
    id: "operational-limits",
    title: "Entendendo os Limites Operacionais",
    category: "performance",
    categoryLabel: "Performance",
    content: `# Entendendo os Limites Operacionais

Os limites operacionais são indicadores que o iFood monitora para avaliar a qualidade da operação do restaurante. Manter esses indicadores dentro dos limites recomendados é essencial para evitar penalizações.

## Indicadores monitorados

### Taxa de Cancelamento

Percentual de pedidos cancelados pelo restaurante em relação ao total de pedidos.

- **Bom**: Abaixo de 2%
- **Atenção**: Entre 2% e 5%
- **Crítico**: Acima de 5%

**Dica**: Cancelamentos por falta de insumo são os mais comuns. Mantenha o cardápio atualizado e desative itens indisponíveis.

### Taxa de Abertura

Percentual de tempo em que o restaurante esteve aberto dentro do horário programado.

- **Bom**: Acima de 95%
- **Atenção**: Entre 85% e 95%
- **Crítico**: Abaixo de 85%

**Dica**: Fechar fora do horário programado prejudica o ranking no iFood. Se necessário fechar, atualize o horário no app do iFood.

### Taxa de Chamados Abertos

Percentual de chamados (tickets) sem resposta em relação ao total.

- **Bom**: Abaixo de 3%
- **Atenção**: Entre 3% e 8%
- **Crítico**: Acima de 8%

**Dica**: Responda chamados o mais rápido possível. O GTBI pode ajudar com respostas automáticas.

### Taxa de Novos Clientes

Percentual de pedidos realizados por clientes que compraram pela primeira vez.

- **Bom**: Acima de 30%
- **Neutro**: Entre 15% e 30%
- **Atenção**: Abaixo de 15%

**Dica**: Uma taxa baixa de novos clientes pode indicar que o restaurante não está aparecendo para novas pessoas. Considere recomendar promoções ou melhorias nas fotos do cardápio.

## Alertas

Quando um indicador entra na zona de **Atenção** ou **Crítico**, o GTBI exibe um alerta visual no dashboard e pode incluir essa informação no relatório semanal.

## Como melhorar

Cada indicador está ligado a ações práticas que podem ser recomendadas ao cliente:

1. **Revise o cardápio** regularmente para evitar cancelamentos
2. **Cumpra os horários** de abertura programados
3. **Responda chamados** rapidamente (use respostas automáticas)
4. **Invista em fotos** e descrições atrativas para atrair novos clientes`,
    tags: ["limites", "operacional", "cancelamento", "abertura", "chamados", "alertas", "penalização"],
  },
];
