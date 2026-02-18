import type { HelpArticle } from "./index";

export const adminArticles: HelpArticle[] = [
  {
    id: "user-management",
    title: "Administração de Usuários",
    category: "admin",
    categoryLabel: "Administração",
    content: `# Administração de Usuários

O módulo de administração permite gerenciar os usuários que têm acesso ao GTBI e definir as permissões de cada um.

## Acessando a administração

1. Clique em **Admin** no menu lateral
2. Selecione a aba **Usuários**

**Nota**: Apenas usuários com o papel de **Administrador** têm acesso a esta seção.

## Papéis de usuário (RBAC)

O GTBI utiliza um sistema de controle de acesso baseado em papéis (RBAC). Os papéis disponíveis são:

### Administrador
- Acesso completo a todas as funcionalidades
- Pode gerenciar usuários e contas iFood
- Pode alterar configurações globais
- Pode visualizar logs de auditoria

### Gerente
- Acesso a todos os módulos operacionais
- Pode enviar relatórios
- Pode gerenciar ações e checklists
- Pode responder avaliações e chamados
- **Não pode** gerenciar usuários ou contas iFood

### Operador
- Acesso de leitura a performance e relatórios
- Pode responder avaliações e chamados
- Pode visualizar o catálogo e financeiro
- **Não pode** enviar relatórios ou alterar configurações

### Visualizador
- Acesso somente leitura a todos os módulos
- Pode visualizar relatórios, avaliações e métricas
- **Não pode** executar nenhuma ação

## Convidando usuários

Para convidar um novo usuário:

1. Clique em **Convidar usuário**
2. Preencha os dados:
   - **E-mail** — E-mail do novo usuário
   - **Nome** — Nome completo
   - **Papel** — Selecione o papel adequado
   - **Restaurantes** — Selecione quais restaurantes o usuário poderá acessar
3. Clique em **Enviar convite**

O usuário receberá um e-mail com um link para criar a conta e definir uma senha.

## Gerenciando usuários existentes

Na lista de usuários, você pode:

- **Alterar papel** — Mudar o nível de acesso do usuário
- **Alterar restaurantes** — Adicionar ou remover acesso a restaurantes
- **Desativar** — Impedir o acesso do usuário sem deletar a conta
- **Reenviar convite** — Enviar novamente o e-mail de convite (caso o anterior tenha expirado)

## Boas práticas

- Siga o princípio do **menor privilégio** — dê apenas as permissões necessárias
- Revise os acessos **periodicamente** (pelo menos mensalmente)
- **Desative** contas de colaboradores que saíram da equipe
- Use **Operador** para funcionários que apenas precisam responder avaliações e chamados
- Use **Visualizador** para proprietários que apenas querem acompanhar os números`,
    tags: ["usuários", "admin", "rbac", "papel", "permissão", "convite", "acesso"],
  },
  {
    id: "ifood-accounts-settings",
    title: "Contas iFood e Configurações",
    category: "admin",
    categoryLabel: "Administração",
    content: `# Contas iFood e Configurações

Gerencie as contas iFood conectadas ao GTBI e configure as opções gerais da plataforma.

## Gerenciando contas iFood

### Visualizando contas

Na aba **Contas iFood** da página Admin, você vê:

- **Lista de contas** conectadas com nome e Merchant ID
- **Status** de cada conta (Ativo, Erro, Desconectado)
- **Última sincronização** — Data e hora da última atualização de dados
- **Ações** — Editar, sincronizar manualmente ou desconectar

### Editando uma conta

1. Clique no ícone de edição da conta desejada
2. Altere os dados necessários (nome, token, etc.)
3. Salve as alterações

### Sincronização manual

Se os dados parecem desatualizados:

1. Clique em **Sincronizar** na conta desejada
2. Aguarde o processo de sincronização
3. Verifique se os dados foram atualizados

A sincronização automática ocorre periodicamente, mas você pode forçar uma atualização manual a qualquer momento.

### Desconectando uma conta

1. Clique em **Desconectar** na conta desejada
2. Confirme a ação

**Atenção**: Desconectar uma conta não apaga os dados históricos, mas impede a sincronização de novos dados.

## Logs de auditoria

O GTBI registra todas as ações importantes realizadas na plataforma:

- **Quem** — Usuário que realizou a ação
- **O que** — Descrição da ação
- **Quando** — Data e hora
- **Detalhes** — Informações adicionais (ex: campos alterados)

### Exemplos de ações registradas

- Login e logout de usuários
- Alterações em papéis de usuários
- Envio de relatórios
- Alterações em configurações
- Conexão e desconexão de contas iFood
- Alterações no catálogo

### Acessando os logs

1. Acesse **Admin**
2. Selecione a aba **Logs de auditoria**
3. Use os filtros para encontrar ações específicas

## Notificações

Configure como e quando o GTBI deve enviar notificações:

### Tipos de notificação

- **Relatório gerado** — Quando um novo relatório semanal está disponível
- **Limite operacional** — Quando um indicador entra na zona de atenção
- **Nova avaliação negativa** — Quando uma avaliação de 1-2 estrelas é recebida
- **Novo chamado** — Quando um novo ticket é aberto
- **Erro de sincronização** — Quando há problema na conexão com o iFood

### Canais de notificação

- **E-mail** — Notificações enviadas para o e-mail cadastrado
- **Push** — Notificações push no navegador (requer permissão)
- **WhatsApp** — Notificações via WhatsApp (quando configurado)

### Configurando notificações

1. Acesse **Configurações** no menu lateral
2. Selecione a aba **Notificações**
3. Ative ou desative cada tipo de notificação
4. Escolha os canais desejados
5. Salve as configurações`,
    tags: ["ifood", "conta", "configurações", "auditoria", "logs", "notificações", "sincronização"],
  },
];
