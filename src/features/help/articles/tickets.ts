import type { HelpArticle } from "./index";

export const ticketsArticles: HelpArticle[] = [
  {
    id: "managing-tickets",
    title: "Gerenciando Chamados",
    category: "tickets",
    categoryLabel: "Chamados",
    content: `# Gerenciando Chamados

O módulo de chamados permite acompanhar e responder aos tickets abertos no iFood relacionados ao seu restaurante.

## O que são chamados

Chamados (tickets) são solicitações ou reclamações abertas por clientes ou pelo próprio iFood. Podem incluir:

- **Reclamações de pedidos** — Itens errados, faltantes ou com problemas de qualidade
- **Problemas de entrega** — Atraso, pedido não entregue, embalagem danificada
- **Solicitações de reembolso** — Pedidos de estorno parcial ou total
- **Questões operacionais** — Restaurante fechado fora do horário, cardápio desatualizado

## Visualizando chamados

Na página de **Chamados**, você encontra:

- **Lista de tickets** com título, data e status
- **Filtros** por status (aberto, em andamento, resolvido, fechado)
- **Contador** de chamados por status

## Detalhes do chamado

Ao clicar em um chamado, você vê:

- **Histórico completo** da conversa (thread)
- **Informações do pedido** relacionado
- **Dados do cliente** (quando disponível)
- **Status atual** e histórico de mudanças

## Respondendo chamados

Para responder um chamado:

1. Abra o chamado desejado
2. Leia o histórico completo da conversa
3. Digite sua resposta no campo de texto
4. Clique em **Enviar**

## Resposta automática de chamados

Assim como nas avaliações, você pode configurar respostas automáticas para chamados:

1. Acesse as configurações de chamados
2. Ative **Resposta automática**
3. Defina templates por tipo de chamado
4. O sistema responderá automaticamente os chamados que se encaixam nos templates

### Quando usar resposta automática

- **Recomendado**: Para chamados simples e recorrentes (ex: "Pedido atrasado — já estamos verificando")
- **Não recomendado**: Para chamados complexos que exigem análise individual

## Gerenciando status

Os chamados passam pelos seguintes status:

1. **Aberto** — Novo chamado que precisa de atenção
2. **Em andamento** — Chamado sendo tratado pela equipe
3. **Resolvido** — Solução aplicada, aguardando confirmação
4. **Fechado** — Chamado finalizado

Para alterar o status:
1. Abra o chamado
2. Clique no botão de status
3. Selecione o novo status
4. Adicione um comentário (opcional)

## Métricas importantes

- **Tempo médio de resposta** — Quanto tempo leva para dar a primeira resposta
- **Tempo médio de resolução** — Quanto tempo leva para resolver completamente
- **Taxa de chamados abertos** — Indicador operacional monitorado pelo iFood

## Dicas

- Responda chamados **o mais rápido possível** — o iFood monitora o tempo de resposta
- Use **respostas automáticas** para acusar recebimento enquanto analisa o caso
- Mantenha a taxa de chamados abertos **abaixo de 3%** para evitar penalizações
- Documente as soluções para criar um histórico útil`,
    tags: ["chamados", "tickets", "reclamação", "resposta", "status", "thread", "automático"],
  },
];
