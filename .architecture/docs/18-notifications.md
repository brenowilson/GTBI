# Sistema de Notificacoes - Padroes e Especificacoes

Este documento define os padroes para implementacao do Sistema de Notificacoes em projetos do framework.

**IMPORTANTE**: Este documento trata de notificacoes do PRODUTO (sininho, email, push para usuarios). Para notificacoes operacionais sobre desenvolvimento, ver `agents/ops-telegram-agent.md`.

---

## Visao Geral

O Sistema de Notificacoes inclui:

1. Notificacoes internas (sininho no header)
2. Email transacional (via Resend)
3. Push notifications (PWA)
4. Preferencias do usuario por canal/tipo

---

## Estrutura de Pastas

```
src/features/notifications/
├── components/
│   ├── NotificationBell.tsx        # Sininho no header
│   ├── NotificationDropdown.tsx    # Lista de notificacoes
│   ├── NotificationItem.tsx        # Item individual
│   ├── NotificationSettings.tsx    # Pagina de preferencias
│   └── PushPermissionBanner.tsx    # Banner para ativar push
├── hooks/
│   ├── useNotifications.ts         # Query notificacoes
│   ├── useUnreadCount.ts           # Contador de nao lidas
│   ├── useNotificationPreferences.ts
│   └── usePushSubscription.ts      # Web Push
├── types.ts
└── index.ts
```

---

## Schema SQL

```sql
-- ============================================
-- SISTEMA DE NOTIFICACOES
-- ============================================

-- Notificacoes
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Conteudo
  type TEXT NOT NULL,           -- 'info', 'success', 'warning', 'error'
  category TEXT NOT NULL,       -- 'system', 'task', 'comment', 'mention', etc.
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,              -- URL para acao (opcional)

  -- Status
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Preferencias de notificacao por usuario
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Canais por categoria
  category TEXT NOT NULL,       -- 'system', 'task', 'comment', etc.
  internal_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,

  UNIQUE(user_id, category)
);

-- Subscriptions push (Web Push API)
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Web Push
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,

  -- Metadata
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, endpoint)
);

-- Tipos de notificacao configurados
CREATE TABLE public.notification_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,           -- 'task_assigned', 'comment_added', etc.
  category TEXT NOT NULL,              -- 'tasks', 'comments', 'billing'
  title_template TEXT NOT NULL,        -- 'Nova tarefa: {{task_title}}'
  body_template TEXT,                  -- 'Voce foi atribuido a tarefa {{task_title}}'
  default_channels TEXT[] DEFAULT '{internal}',  -- ['internal', 'email', 'push']
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
```

---

## Padroes de Componentes

### NotificationBell

- Posicao: Header, lado direito
- Badge vermelho com contador (se > 0)
- Dropdown com lista ao clicar
- Max 5 itens no dropdown, link "Ver todas"

```tsx
// src/features/notifications/components/NotificationBell.tsx
export function NotificationBell() {
  const { unreadCount } = useUnreadCount();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
```

### NotificationItem

- Icone a esquerda baseado no tipo (info, success, warning, error)
- Titulo em bold, corpo truncado
- Indicador de nao lida (bolinha azul)
- Timestamp relativo ("ha 5 min")

```tsx
// src/features/notifications/components/NotificationItem.tsx
const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const typeColors = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
};

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const Icon = typeIcons[notification.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer',
        !notification.read_at && 'bg-primary/5'
      )}
      onClick={() => onRead(notification.id)}
    >
      <Icon className={cn('h-5 w-5 mt-0.5', typeColors[notification.type])} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{notification.title}</p>
        {notification.body && (
          <p className="text-sm text-muted-foreground line-clamp-2">{notification.body}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      {!notification.read_at && (
        <div className="h-2 w-2 rounded-full bg-primary mt-2" />
      )}
    </div>
  );
}
```

### NotificationSettings

- Toggle por categoria (system, task, comment, etc.)
- Colunas: Interno | Email | Push
- Explicacao de cada canal

```tsx
// src/features/notifications/components/NotificationSettings.tsx
export function NotificationSettings() {
  const { preferences, updatePreference } = useNotificationPreferences();

  const categories = [
    { id: 'system', label: 'Sistema', description: 'Atualizacoes importantes do sistema' },
    { id: 'tasks', label: 'Tarefas', description: 'Tarefas atribuidas e atualizacoes' },
    { id: 'comments', label: 'Comentarios', description: 'Novos comentarios e mencoes' },
    { id: 'billing', label: 'Cobranca', description: 'Pagamentos e faturas' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground">
        <div>Categoria</div>
        <div className="text-center">Interno</div>
        <div className="text-center">Email</div>
        <div className="text-center">Push</div>
      </div>

      {categories.map((category) => {
        const pref = preferences?.[category.id];
        return (
          <div key={category.id} className="grid grid-cols-4 gap-4 items-center">
            <div>
              <p className="font-medium">{category.label}</p>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
            <div className="flex justify-center">
              <Switch
                checked={pref?.internal_enabled ?? true}
                onCheckedChange={(v) => updatePreference(category.id, 'internal_enabled', v)}
              />
            </div>
            <div className="flex justify-center">
              <Switch
                checked={pref?.email_enabled ?? true}
                onCheckedChange={(v) => updatePreference(category.id, 'email_enabled', v)}
              />
            </div>
            <div className="flex justify-center">
              <Switch
                checked={pref?.push_enabled ?? true}
                onCheckedChange={(v) => updatePreference(category.id, 'push_enabled', v)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

## Edge Functions

### send-notification

- Recebe: `userId`, `type`, `resourceType`, `resourceId`, `actionUrl`, `variables`
- Busca tipo de notificacao e preferencias do usuario
- Interpola templates com variaveis
- Envia para canais habilitados (interno, email, push)

### push-subscribe

- Recebe: `subscription`, `deviceName`
- Registra/atualiza subscription do usuario
- Armazena endpoint, p256dh, auth

---

## Tipos de Notificacao

| Tipo | Categoria | Default Canais |
|------|-----------|----------------|
| `task_assigned` | tasks | interno, email, push |
| `task_completed` | tasks | interno |
| `comment_added` | comments | interno, email, push |
| `mention` | comments | interno, email, push |
| `invitation_received` | team | interno, email |
| `payment_failed` | billing | interno, email |
| `usage_limit_warning` | billing | interno, email, push |

---

## RLS Policies

Ver `.architecture/docs/04-seguranca.md` secao "Notificacoes" para policies completas.

---

## Checklist Humano

Ver `.architecture/docs/12-checklist-humano.md`:
- [ ] Configurar RESEND_API_KEY se usar email
- [ ] Gerar e configurar VAPID keys se usar push
- [ ] Configurar domain de email no Resend

---

## Referencias

| Documento | Conteudo |
|-----------|----------|
| `docs/04-seguranca.md` | RLS policies |
| `docs/12-checklist-humano.md` | Pre-requisitos humanos |
| `docs/15-pwa.md` | Configuracao de PWA para push |
| `agents/notification-agent.md` | Instrucoes de execucao |
| `agents/ops-telegram-agent.md` | Notificacoes OPERACIONAIS (desenvolvimento) |
