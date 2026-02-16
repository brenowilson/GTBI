# Limites de Uso - Padroes e Especificacoes

Este documento define os padroes para implementacao do Sistema de Limites de Uso em projetos do framework.

---

## Visao Geral

O Sistema de Limites de Uso inclui:

1. Definicao de limites por plano
2. Rastreamento de uso atual
3. Alertas visuais (80% e 100%)
4. CTA de upgrade

---

## Estrutura de Pastas

```
src/features/billing/
├── components/
│   ├── UsageLimitBanner.tsx      # Barra de alerta
│   ├── UsageProgressBar.tsx      # Barra de progresso
│   └── UpgradeCTA.tsx            # Call to action de upgrade
├── hooks/
│   ├── useUsageLimits.ts         # Query uso atual vs limites
│   └── useUpgradeModal.ts
└── types.ts
```

---

## Schema SQL

```sql
-- ============================================
-- LIMITES DE USO
-- ============================================

-- Limites por plano
CREATE TABLE public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL UNIQUE,      -- 'free', 'starter', 'pro', 'enterprise'

  -- Limites (null = ilimitado)
  max_projects INTEGER,
  max_tasks_per_project INTEGER,
  max_storage_mb INTEGER,
  max_team_members INTEGER,
  max_api_calls_per_day INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rastreamento de uso
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Periodo
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Uso atual
  projects_count INTEGER DEFAULT 0,
  tasks_count INTEGER DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,
  team_members_count INTEGER DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,

  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, period_start)
);

-- Indices
CREATE INDEX idx_usage_tracking_user ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- Dados padrao de limites
INSERT INTO plan_limits (plan_id, max_projects, max_tasks_per_project, max_storage_mb, max_team_members, max_api_calls_per_day) VALUES
  ('free', 3, 50, 100, 1, 100),
  ('starter', 10, 200, 1000, 5, 1000),
  ('pro', 50, 1000, 10000, 20, 10000),
  ('enterprise', NULL, NULL, NULL, NULL, NULL);
```

---

## Padroes de Componentes

### UsageLimitBanner

- Aparece quando uso >= 80%
- Cor amarela em 80%, vermelha em 100%
- Texto dinamico: "Voce usou X% de [recurso]"
- Botao de upgrade

```tsx
// src/features/billing/components/UsageLimitBanner.tsx
interface UsageLimitBannerProps {
  resourceName: string;
  used: number;
  limit: number;
  upgradeUrl?: string;
}

export function UsageLimitBanner({ resourceName, used, limit, upgradeUrl }: UsageLimitBannerProps) {
  const percentage = Math.round((used / limit) * 100);

  if (percentage < 80) return null;

  const isAtLimit = percentage >= 100;

  return (
    <Alert variant={isAtLimit ? 'destructive' : 'warning'}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {isAtLimit ? 'Limite atingido' : 'Proximo do limite'}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          Voce usou {percentage}% de {resourceName} ({used} de {limit})
        </span>
        {upgradeUrl && (
          <Button variant="outline" size="sm" asChild>
            <Link to={upgradeUrl}>Fazer upgrade</Link>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

### UsageProgressBar

- Barra visual de progresso
- Labels: "X de Y usados"
- Cores progressivas baseadas em %

```tsx
// src/features/billing/components/UsageProgressBar.tsx
interface UsageProgressBarProps {
  label: string;
  used: number;
  limit: number | null;  // null = ilimitado
  unit?: string;
}

export function UsageProgressBar({ label, used, limit, unit }: UsageProgressBarProps) {
  // Se ilimitado
  if (limit === null) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <span className="text-muted-foreground">{used} {unit} (ilimitado)</span>
        </div>
        <Progress value={0} className="bg-muted" />
      </div>
    );
  }

  const percentage = Math.min(100, Math.round((used / limit) * 100));

  // Determinar cor baseado em %
  const getProgressColor = () => {
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {used} de {limit} {unit}
        </span>
      </div>
      <Progress
        value={percentage}
        className="h-2"
        indicatorClassName={getProgressColor()}
      />
    </div>
  );
}
```

### UpgradeCTA

- Call to action para upgrade de plano
- Mostra beneficios do proximo plano
- Botao de acao

```tsx
// src/features/billing/components/UpgradeCTA.tsx
interface UpgradeCTAProps {
  currentPlan: string;
  nextPlan: {
    name: string;
    price: number;
    benefits: string[];
  };
}

export function UpgradeCTA({ currentPlan, nextPlan }: UpgradeCTAProps) {
  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle>Faca upgrade para {nextPlan.name}</CardTitle>
        <CardDescription>
          Por apenas R$ {nextPlan.price}/mes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {nextPlan.benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm">{benefit}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <Link to="/settings/billing/upgrade">
            Fazer upgrade agora
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

## Hook useUsageLimits

```typescript
// src/features/billing/hooks/useUsageLimits.ts
interface UsageLimit {
  resource: string;
  used: number;
  limit: number | null;
  percentage: number;
  isNearLimit: boolean;  // >= 80%
  isAtLimit: boolean;    // >= 100%
}

export function useUsageLimits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['usage-limits', user?.id],
    queryFn: async () => {
      // Buscar uso atual
      const { data: usage } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .gte('period_end', new Date().toISOString())
        .single();

      // Buscar limites do plano do usuario
      const { data: limits } = await supabase
        .from('plan_limits')
        .select('*')
        .eq('plan_id', user.plan_id)
        .single();

      // Mapear recursos
      const resources: UsageLimit[] = [
        {
          resource: 'projects',
          used: usage?.projects_count ?? 0,
          limit: limits?.max_projects,
          percentage: limits?.max_projects
            ? Math.round((usage?.projects_count ?? 0) / limits.max_projects * 100)
            : 0,
          isNearLimit: limits?.max_projects
            ? (usage?.projects_count ?? 0) / limits.max_projects >= 0.8
            : false,
          isAtLimit: limits?.max_projects
            ? (usage?.projects_count ?? 0) >= limits.max_projects
            : false,
        },
        // ... outros recursos
      ];

      return {
        resources,
        hasAnyNearLimit: resources.some(r => r.isNearLimit),
        hasAnyAtLimit: resources.some(r => r.isAtLimit),
      };
    },
    enabled: !!user,
  });
}
```

---

## Edge Function: check-usage

```typescript
// supabase/functions/check-usage/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { userId, resource, action } = await req.json();

  // Buscar uso atual e limite
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .gte('period_end', new Date().toISOString())
    .single();

  const { data: user } = await supabase
    .from('profiles')
    .select('plan_id')
    .eq('id', userId)
    .single();

  const { data: limits } = await supabase
    .from('plan_limits')
    .select('*')
    .eq('plan_id', user.plan_id)
    .single();

  const resourceField = `${resource}_count`;
  const limitField = `max_${resource}`;

  const currentUsage = usage?.[resourceField] ?? 0;
  const limit = limits?.[limitField];

  // Se ilimitado, permitir
  if (limit === null) {
    return new Response(JSON.stringify({ allowed: true }), { status: 200 });
  }

  // Verificar se pode executar a acao
  const allowed = action === 'add'
    ? currentUsage < limit
    : true;

  return new Response(JSON.stringify({
    allowed,
    used: currentUsage,
    limit,
    percentage: Math.round((currentUsage / limit) * 100),
  }), { status: 200 });
});
```

---

## RLS Policies

Ver `.architecture/docs/04-seguranca.md` secao "Limites de Uso" para policies completas.

---

## Referencias

| Documento | Conteudo |
|-----------|----------|
| `docs/04-seguranca.md` | RLS policies |
| `agents/admin-panel-agent.md` | Gestao de limites no admin |
