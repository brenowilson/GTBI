import type { HelpArticle } from "./index";

export const gettingStartedArticles: HelpArticle[] = [
  {
    id: "first-access",
    title: "Primeiro acesso ao GTBI",
    category: "getting-started",
    categoryLabel: "Primeiros Passos",
    content: `# Primeiro acesso ao GTBI

Bem-vindo ao GTBI! Este guia vai te ajudar a dar os primeiros passos na plataforma de gestão do seu restaurante no iFood.

## Como fazer login

1. Acesse a plataforma pelo link fornecido pela sua equipe
2. Na tela de login, insira seu **e-mail** e **senha**
3. Clique em **Entrar**

Se você recebeu um convite por e-mail, clique no link do convite para criar sua conta e definir uma senha.

## Navegação principal

Após o login, você verá o menu lateral (no desktop) ou o menu inferior (no celular) com as seguintes seções:

- **Performance** — Dashboard com funil de vendas e limites operacionais
- **Relatórios** — Relatórios semanais com análises e ações
- **Avaliações** — Gerenciamento de avaliações dos clientes
- **Chamados** — Acompanhamento de chamados do iFood
- **Financeiro** — Dados financeiros e exportações
- **Catálogo** — Cardápio, produtos e geração de imagens com IA
- **Configurações** — Preferências da conta
- **Admin** — Gestão de usuários e contas (apenas administradores)

## Selecionando um restaurante

Se você gerencia mais de um restaurante, use o **seletor de restaurante** no topo da tela para alternar entre eles. Todos os dados exibidos na plataforma serão do restaurante selecionado.

## Tema claro e escuro

Clique no ícone de sol/lua no canto superior direito para alternar entre o tema claro e o tema escuro.

## Esqueceu a senha?

Na tela de login, clique em **Esqueci minha senha**. Você receberá um e-mail com um link para redefinir sua senha. O link expira em 24 horas.`,
    tags: ["login", "acesso", "navegação", "primeiro acesso", "senha", "tema"],
  },
  {
    id: "connecting-ifood",
    title: "Conectando sua conta iFood",
    category: "getting-started",
    categoryLabel: "Primeiros Passos",
    content: `# Conectando sua conta iFood

Para que o GTBI possa exibir os dados do seu restaurante, é necessário conectar sua conta do iFood à plataforma.

## Pré-requisitos

- Ter uma conta ativa no iFood com pelo menos um restaurante
- Ter permissão de **administrador** no GTBI
- Ter os dados de acesso da API do iFood (fornecidos pelo suporte)

## Passo a passo

1. Acesse **Admin** no menu lateral
2. Clique na aba **Contas iFood**
3. Clique em **Adicionar conta**
4. Preencha os dados solicitados:
   - **Nome da loja** — Nome para identificação interna
   - **Merchant ID** — ID do restaurante no iFood
   - **Token de acesso** — Token fornecido pelo suporte
5. Clique em **Salvar**

## Sincronização de dados

Após conectar a conta, o sistema iniciará a sincronização automática dos dados. Esse processo pode levar alguns minutos na primeira vez. Os dados sincronizados incluem:

- **Pedidos** — Histórico de pedidos e métricas
- **Avaliações** — Avaliações dos clientes com notas e comentários
- **Chamados** — Tickets abertos no iFood
- **Financeiro** — Repasses e transações financeiras
- **Catálogo** — Produtos, categorias e preços

## Verificando a conexão

Na tela de **Admin > Contas iFood**, verifique se o status da conta está como **Ativo**. Se houver erro na sincronização, o status mostrará **Erro** com detalhes.

## Múltiplos restaurantes

Você pode conectar quantos restaurantes quiser. Cada restaurante terá seus dados separados e poderá ser selecionado no seletor do topo da tela.`,
    tags: ["ifood", "conexão", "conta", "sincronização", "merchant", "api", "restaurante"],
  },
];
