import type { HelpArticle } from "./index";

export const catalogArticles: HelpArticle[] = [
  {
    id: "product-catalog",
    title: "Catálogo de Produtos",
    category: "catalog",
    categoryLabel: "Catálogo",
    content: `# Catálogo de Produtos

O módulo de catálogo permite visualizar e gerenciar os produtos do seu cardápio no iFood diretamente pelo GTBI.

## Visualizando o catálogo

Na página **Catálogo**, você encontra:

- **Lista de produtos** organizados por categoria
- **Imagem** de cada produto (quando disponível)
- **Nome e descrição** do produto
- **Preço** atual
- **Status de disponibilidade** (ativo ou pausado)

## Categorias

Os produtos são organizados nas categorias definidas no iFood:

- Navegue pelas categorias usando as abas no topo da página
- Cada categoria mostra o número de produtos ativos

## Informações do produto

Ao clicar em um produto, você vê os detalhes completos:

- **Nome** — Nome do produto como aparece no iFood
- **Descrição** — Texto descritivo do produto
- **Preço** — Valor atual
- **Categoria** — Categoria do produto
- **Complementos** — Itens adicionais disponíveis (ex: adicionais, molhos)
- **Imagem** — Foto do produto
- **Status** — Se o produto está disponível para venda

## Disponibilidade

Você pode pausar e reativar produtos diretamente pelo GTBI:

1. Encontre o produto desejado
2. Clique no **toggle de disponibilidade**
3. O produto será pausado/reativado no iFood

**Importante**: Manter produtos indisponíveis ativos no cardápio pode gerar cancelamentos e afetar sua taxa de cancelamento.

## Buscando produtos

Use a **barra de busca** para encontrar produtos rapidamente:

- Busque por **nome** do produto
- Busque por **categoria**
- Os resultados são filtrados em tempo real

## Sincronização

O catálogo é sincronizado automaticamente com o iFood. Alterações feitas diretamente no iFood serão refletidas no GTBI após a próxima sincronização.

## Dicas

- Revise o catálogo **semanalmente** para garantir que todos os itens estão corretos
- **Pause produtos** que não estão disponíveis em vez de deixá-los ativos
- Mantenha **descrições completas** — elas ajudam na conversão de vendas
- Invista em **fotos de qualidade** — produtos com foto vendem mais (veja o artigo sobre geração de imagens com IA)`,
    tags: ["catálogo", "produtos", "cardápio", "preço", "categoria", "disponibilidade"],
  },
  {
    id: "ai-image-generation",
    title: "Geração de Imagens com IA",
    category: "catalog",
    categoryLabel: "Catálogo",
    content: `# Geração de Imagens com IA

O GTBI oferece uma ferramenta de geração de imagens com inteligência artificial para criar fotos profissionais dos produtos do seu cardápio.

## Por que usar imagens geradas por IA?

- Produtos com foto vendem **até 3x mais** no iFood
- Fotos profissionais aumentam a **taxa de conversão**
- Elimina a necessidade de **fotógrafo profissional** para cada item
- Permite criar imagens **padronizadas** para todo o cardápio

## Modos de geração

O GTBI oferece 5 modos de geração de imagens:

### 1. A partir do nome

Gera uma imagem baseada apenas no nome do produto. Ideal para produtos comuns e conhecidos.

**Exemplo**: "X-Burger Especial" gera uma foto de um hambúrguer completo.

### 2. A partir da descrição

Usa a descrição do produto para gerar uma imagem mais precisa com os ingredientes e características.

**Exemplo**: "Hambúrguer artesanal com queijo cheddar, bacon crocante, alface e tomate no pão brioche" gera uma imagem com todos esses elementos.

### 3. A partir de foto existente (melhoria)

Aprimora uma foto existente do produto, melhorando iluminação, fundo e apresentação.

**Como usar**: Envie a foto original e o sistema gera uma versão melhorada.

### 4. A partir de referência

Gera uma imagem no estilo de uma foto de referência que você fornece.

**Como usar**: Envie uma foto de referência (ex: do Google ou Instagram) e o sistema cria uma imagem similar com o seu produto.

### 5. Personalizado

Permite descrever exatamente como você quer a imagem, incluindo ângulo, fundo, iluminação e estilo.

**Exemplo**: "Foto aérea de pizza margherita em mesa de madeira rústica, iluminação natural, estilo editorial"

## Fluxo de aprovação

As imagens geradas passam por um fluxo de aprovação antes de serem publicadas:

1. **Geração** — A IA cria a imagem com base no modo escolhido
2. **Revisão** — Você visualiza a imagem gerada
3. **Aprovação ou rejeição**:
   - **Aprovar** — A imagem é salva e fica disponível para publicação
   - **Rejeitar** — Você pode gerar uma nova imagem ou ajustar os parâmetros
4. **Publicação** — A imagem aprovada pode ser aplicada ao produto no catálogo

## Aplicando imagens ao catálogo

Após aprovar uma imagem:

1. Acesse o produto no catálogo
2. Clique em **Alterar imagem**
3. Selecione a imagem aprovada da galeria
4. Confirme a alteração
5. A imagem será sincronizada com o iFood

## Dicas para melhores resultados

- Forneça **descrições detalhadas** para resultados mais precisos
- Use o modo **personalizado** para pratos únicos ou especiais
- Gere **2-3 variações** e escolha a melhor
- Prefira o modo **melhoria** se já tiver uma foto razoável
- Mantenha um **padrão visual** consistente para todo o cardápio`,
    tags: ["imagem", "ia", "inteligência artificial", "foto", "geração", "catálogo", "aprovação"],
  },
];
