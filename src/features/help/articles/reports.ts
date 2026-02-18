import type { HelpArticle } from "./index";

export const reportsArticles: HelpArticle[] = [
  {
    id: "weekly-reports",
    title: "Relatórios Semanais",
    category: "reports",
    categoryLabel: "Relatórios",
    content: `# Relatórios Semanais

O GTBI gera relatórios semanais automaticamente com uma análise completa da performance do restaurante no iFood.

## O que contém o relatório

Cada relatório semanal inclui:

### Resumo executivo
Uma visão geral dos principais números da semana, incluindo:
- Total de pedidos e variação em relação à semana anterior
- Faturamento estimado
- Nota média das avaliações
- Taxa de cancelamento

### Análise do funil
Detalhamento de cada etapa do funil de conversão com comparação semanal e identificação dos pontos de maior perda.

### Limites operacionais
Status de cada indicador operacional com alertas caso algum esteja fora do limite recomendado.

### Avaliações da semana
Resumo das avaliações recebidas, distribuição por nota e principais temas mencionados pelos clientes.

### Ações recomendadas
Lista de ações práticas sugeridas com base na análise dos dados. Essas ações são adicionadas ao checklist semanal do restaurante.

## Quando o relatório é gerado

Os relatórios são gerados automaticamente toda **segunda-feira** com os dados da semana anterior (segunda a domingo).

## Acessando relatórios

1. Clique em **Relatórios** no menu lateral
2. Você verá a lista de relatórios ordenados por data (mais recente primeiro)
3. Clique em um relatório para ver o conteúdo completo

## Relatórios em PDF

Você pode visualizar e enviar o relatório em formato PDF. O PDF é gerado com o layout otimizado para leitura e compartilhamento.`,
    tags: ["relatório", "semanal", "análise", "pdf", "resumo", "métricas"],
  },
  {
    id: "sending-reports",
    title: "Enviando Relatórios",
    category: "reports",
    categoryLabel: "Relatórios",
    content: `# Enviando Relatórios

Você pode enviar os relatórios semanais para os responsáveis pelo restaurante via e-mail ou WhatsApp.

## Enviando por e-mail

1. Abra o relatório desejado
2. Clique no botão **Enviar por e-mail**
3. Insira o e-mail do destinatário (ou selecione da lista de contatos)
4. O relatório será enviado em formato PDF anexado ao e-mail

## Enviando por WhatsApp

1. Abra o relatório desejado
2. Clique no botão **Enviar por WhatsApp**
3. Selecione o contato ou insira o número de telefone
4. O sistema enviará o PDF do relatório via WhatsApp

## Confirmação obrigatória de leitura

Para garantir que o destinatário recebeu e leu o relatório, o sistema solicita uma **confirmação de leitura**:

- Após receber o relatório, o destinatário deve clicar em **Confirmar leitura**
- O status do envio aparecerá como:
  - **Enviado** — O relatório foi enviado mas ainda não foi confirmado
  - **Lido** — O destinatário confirmou a leitura
  - **Pendente** — Ainda não foi enviado

## Histórico de envios

Na página do relatório, você pode ver o histórico completo de envios, incluindo:
- Data e hora do envio
- Canal utilizado (e-mail ou WhatsApp)
- Destinatário
- Status da confirmação

## Dicas

- Envie os relatórios no início da semana para que a equipe possa agir sobre as recomendações
- Use a confirmação de leitura para garantir o engajamento da equipe
- Combine o envio com uma breve reunião para discutir as ações da semana`,
    tags: ["envio", "email", "whatsapp", "pdf", "confirmação", "leitura"],
  },
  {
    id: "actions-checklist",
    title: "Ações e Checklist",
    category: "reports",
    categoryLabel: "Relatórios",
    content: `# Ações e Checklist

Cada relatório semanal gera um conjunto de ações recomendadas. O GTBI organiza essas ações em um checklist que você pode gerenciar ao longo da semana.

## Como funcionam as ações

As ações são geradas automaticamente com base na análise dos dados da semana. Cada ação inclui:

- **Título** — Descrição clara do que precisa ser feito
- **Prioridade** — Alta, média ou baixa
- **Categoria** — Área relacionada (operacional, marketing, atendimento, etc.)
- **Status** — Pendente, concluída ou descartada

## Concluindo uma ação

Para marcar uma ação como concluída:

1. Clique na ação desejada
2. Clique em **Marcar como concluída**
3. Adicione uma **evidência** (obrigatório):
   - Foto (ex: foto do cardápio atualizado)
   - Texto descritivo (ex: "Horário de funcionamento ajustado no iFood")
   - Print de tela
4. Confirme a conclusão

A evidência é importante para manter o histórico e comprovar que a ação foi executada.

## Descartando uma ação

Se uma ação não se aplica ao restaurante:

1. Clique na ação desejada
2. Clique em **Descartar**
3. Informe o **motivo** (obrigatório):
   - Ex: "Já foi feito na semana anterior"
   - Ex: "Não se aplica ao modelo de negócio do restaurante"
4. Confirme o descarte

## Checklist semanal

O checklist reúne todas as ações da semana atual em uma visualização prática:

- **Filtrar por status** — Veja apenas pendentes, concluídas ou descartadas
- **Filtrar por prioridade** — Foque nas ações de alta prioridade primeiro
- **Progresso** — Barra de progresso mostra o percentual de conclusão

## Boas práticas

- Revise as ações logo no início da semana
- Priorize ações de **alta prioridade** e que afetam os limites operacionais
- Documente as evidências com fotos sempre que possível
- Discuta as ações pendentes com a equipe em reuniões semanais`,
    tags: ["ações", "checklist", "evidência", "prioridade", "conclusão", "descarte", "semanal"],
  },
];
