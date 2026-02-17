import type { HelpArticle } from "./index";

export const reviewsArticles: HelpArticle[] = [
  {
    id: "managing-reviews",
    title: "Gerenciando Avaliações",
    category: "reviews",
    categoryLabel: "Avaliações",
    content: `# Gerenciando Avaliações

O módulo de avaliações permite visualizar e responder às avaliações que os clientes deixam no iFood sobre o seu restaurante.

## Visualizando avaliações

Na página de **Avaliações**, você encontra:

- **Lista de avaliações** ordenadas por data (mais recente primeiro)
- **Nota em estrelas** (1 a 5) de cada avaliação
- **Comentário do cliente** (quando disponível)
- **Status da resposta** — Se já foi respondida ou não

## Filtros disponíveis

Você pode filtrar as avaliações por:

- **Nota** — Selecione uma nota específica (1 a 5 estrelas)
- **Status** — Respondidas, não respondidas ou todas
- **Período** — Última semana, último mês ou período personalizado

## Respondendo avaliações

Para responder uma avaliação manualmente:

1. Clique na avaliação desejada
2. Digite sua resposta no campo de texto
3. Clique em **Enviar resposta**

### Dicas para boas respostas

- **Avaliações positivas (4-5 estrelas)**: Agradeça e incentive o cliente a voltar
- **Avaliações negativas (1-2 estrelas)**: Peça desculpas, reconheça o problema e informe a solução
- **Avaliações neutras (3 estrelas)**: Agradeça o feedback e pergunte como melhorar

## Indicadores

Na parte superior da página, você encontra um resumo com:

- **Nota média** do período
- **Total de avaliações** recebidas
- **Distribuição por nota** (quantas de cada estrela)
- **Taxa de resposta** (percentual de avaliações respondidas)

## Importância das respostas

Responder avaliações é importante porque:

- Demonstra **cuidado** com o cliente
- Pode **reverter** uma experiência negativa
- Melhora o **ranking** do restaurante no iFood
- Aumenta a **confiança** de novos clientes`,
    tags: ["avaliações", "estrelas", "nota", "resposta", "feedback", "cliente"],
  },
  {
    id: "auto-reply-reviews",
    title: "Resposta Automática de Avaliações",
    category: "reviews",
    categoryLabel: "Avaliações",
    content: `# Resposta Automática de Avaliações

O GTBI permite configurar respostas automáticas para avaliações, economizando tempo e garantindo que nenhuma avaliação fique sem resposta.

## Modos de resposta automática

Existem dois modos disponíveis:

### 1. Template fixo

Você define modelos de resposta para cada faixa de nota:

- **5 estrelas** — Ex: "Obrigado pela avaliação! Ficamos felizes que gostou. Esperamos você novamente!"
- **4 estrelas** — Ex: "Obrigado pelo feedback! Estamos sempre buscando melhorar."
- **3 estrelas** — Ex: "Agradecemos o feedback. Vamos trabalhar para melhorar sua experiência."
- **1-2 estrelas** — Ex: "Sentimos muito pela experiência. Entre em contato para resolvermos."

### 2. Resposta com IA

A inteligência artificial gera respostas personalizadas com base no conteúdo da avaliação:

- Analisa o **comentário do cliente** para entender o contexto
- Gera uma resposta **personalizada** e empática
- Mantém o **tom** profissional definido nas configurações
- Pode ser revisada antes do envio (modo semi-automático)

## Configurando respostas automáticas

1. Acesse **Avaliações**
2. Clique em **Configurações** (ícone de engrenagem)
3. Ative a opção **Respostas automáticas**
4. Escolha o modo: **Template** ou **IA**
5. Configure as opções do modo escolhido
6. Salve as configurações

## Opções avançadas

- **Atraso no envio** — Defina um tempo mínimo antes de enviar (ex: 30 minutos) para parecer mais natural
- **Filtro por nota** — Ative apenas para determinadas notas (ex: apenas 4 e 5 estrelas, respondendo manualmente as negativas)
- **Revisão manual** — Ative para revisar as respostas antes do envio automático
- **Palavras-chave** — Defina palavras que, quando detectadas, bloqueiam o envio automático e pedem revisão manual

## Boas práticas

- Use **IA** para avaliações positivas (maior volume)
- Responda **manualmente** avaliações negativas (mais sensíveis)
- Revise as respostas automáticas periodicamente
- Ajuste os templates conforme o feedback dos clientes`,
    tags: ["automática", "resposta", "template", "ia", "inteligência artificial", "configuração"],
  },
];
