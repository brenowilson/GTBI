# Barras Promocionais - Padroes e Especificacoes

Este documento define os padroes para implementacao de Barras Promocionais em projetos do framework.

---

## Visao Geral

O Sistema de Barras Promocionais permite ao admin criar barras customizaveis no topo da aplicacao:

1. Editor com preview em tempo real
2. Agendamento por data inicio/fim
3. Segmentacao por plano/role
4. Opcao de fechar (closeable)

---

## Estrutura de Pastas

```
src/features/admin/
├── pages/
│   └── AdminPromotionalBars.tsx
├── components/
│   ├── PromotionalBarEditor.tsx
│   └── PromotionalBarPreview.tsx

src/components/layout/
└── PromotionalBar.tsx
```

---

## Schema SQL

```sql
-- ============================================
-- BARRAS PROMOCIONAIS
-- ============================================

CREATE TABLE public.promotional_bars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Conteudo
  text TEXT NOT NULL,                -- Texto da barra
  cta_text TEXT,                     -- Texto do botao (opcional)
  cta_url TEXT,                      -- URL destino do CTA

  -- Estilo
  background_color TEXT DEFAULT '#3B82F6',  -- Cor de fundo (hex)
  text_color TEXT DEFAULT '#FFFFFF',        -- Cor do texto (hex)

  -- Comportamento
  closeable BOOLEAN DEFAULT true,    -- Usuario pode fechar (x)
  is_active BOOLEAN DEFAULT false,   -- Barra ativa

  -- Agendamento
  starts_at TIMESTAMPTZ,             -- Data inicio (null = imediato)
  ends_at TIMESTAMPTZ,               -- Data fim (null = indefinido)

  -- Segmentacao (opcional)
  target_plans TEXT[],               -- Planos alvo (null = todos)
  target_roles TEXT[],               -- Roles alvo (null = todos)

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Registro de fechamentos por usuario
CREATE TABLE public.promotional_bar_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID REFERENCES promotional_bars(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(bar_id, user_id)
);
```

---

## Padroes de Componentes

### PromotionalBar (Layout Principal)

- Posicao: Topo do app, acima do header
- Full width, padding vertical minimo
- Cor de fundo e texto configuraveis
- Botao X para fechar (se closeable)
- CTA opcional (link ou botao)

```tsx
// src/components/layout/PromotionalBar.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PromotionalBarData {
  id: string;
  text: string;
  cta_text?: string;
  cta_url?: string;
  background_color: string;
  text_color: string;
  closeable: boolean;
}

export function PromotionalBar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar barra ativa (respeitando dismissals)
  const { data: bar } = useQuery({
    queryKey: ['promotional-bar', user?.id],
    queryFn: async () => {
      // Buscar barras ativas
      const { data: bars } = await supabase
        .from('promotional_bars')
        .select('*')
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`)
        .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!bars?.length) return null;

      const bar = bars[0];

      // Verificar se usuario fechou esta barra
      if (user) {
        const { data: dismissal } = await supabase
          .from('promotional_bar_dismissals')
          .select('id')
          .eq('bar_id', bar.id)
          .eq('user_id', user.id)
          .single();

        if (dismissal) return null;
      }

      return bar as PromotionalBarData;
    },
  });

  // Fechar barra
  const dismissMutation = useMutation({
    mutationFn: async (barId: string) => {
      if (!user) return;
      await supabase.from('promotional_bar_dismissals').insert({
        bar_id: barId,
        user_id: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-bar'] });
    },
  });

  if (!bar) return null;

  return (
    <div
      className="relative py-2 px-4 text-center text-sm"
      style={{
        backgroundColor: bar.background_color,
        color: bar.text_color,
      }}
    >
      <span>{bar.text}</span>

      {bar.cta_text && bar.cta_url && (
        <a
          href={bar.cta_url}
          className="ml-4 underline font-medium hover:no-underline"
          style={{ color: bar.text_color }}
        >
          {bar.cta_text}
        </a>
      )}

      {bar.closeable && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
          style={{ color: bar.text_color }}
          onClick={() => dismissMutation.mutate(bar.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

### PromotionalBarEditor (Admin)

- Form com preview em tempo real ao lado
- Color picker para cores
- Date pickers para agendamento
- Toggle de ativo/inativo

```tsx
// src/features/admin/components/PromotionalBarEditor.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const barSchema = z.object({
  text: z.string().min(1, 'Texto obrigatorio').max(200),
  cta_text: z.string().max(30).optional(),
  cta_url: z.string().url().optional().or(z.literal('')),
  background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  closeable: z.boolean(),
  is_active: z.boolean(),
  starts_at: z.date().optional().nullable(),
  ends_at: z.date().optional().nullable(),
});

export function PromotionalBarEditor({ initialData, onSave, isLoading }) {
  const form = useForm({
    resolver: zodResolver(barSchema),
    defaultValues: {
      text: '',
      cta_text: '',
      cta_url: '',
      background_color: '#3B82F6',
      text_color: '#FFFFFF',
      closeable: true,
      is_active: false,
      starts_at: null,
      ends_at: null,
      ...initialData,
    },
  });

  const watchedValues = form.watch();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulario */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Configurar Barra</h3>
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
          {/* Campos do formulario */}
        </form>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="border rounded-lg overflow-hidden">
          <PromotionalBarPreview bar={watchedValues} />
          <div className="h-40 bg-muted/30 flex items-center justify-center text-muted-foreground">
            Conteudo do app
          </div>
        </div>
      </div>
    </div>
  );
}
```

### PromotionalBarPreview

```tsx
// src/features/admin/components/PromotionalBarPreview.tsx
interface PromotionalBarPreviewProps {
  bar: {
    text: string;
    cta_text?: string;
    cta_url?: string;
    background_color: string;
    text_color: string;
    closeable: boolean;
  };
}

export function PromotionalBarPreview({ bar }: PromotionalBarPreviewProps) {
  return (
    <div
      className="relative py-2 px-4 text-center text-sm"
      style={{
        backgroundColor: bar.background_color,
        color: bar.text_color,
      }}
    >
      <span>{bar.text || 'Texto da barra...'}</span>

      {bar.cta_text && (
        <span
          className="ml-4 underline font-medium"
          style={{ color: bar.text_color }}
        >
          {bar.cta_text}
        </span>
      )}

      {bar.closeable && (
        <span
          className="absolute right-2 top-1/2 -translate-y-1/2"
          style={{ color: bar.text_color }}
        >
          <X className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
```

---

## Integracao no Layout Principal

```tsx
// src/components/layout/AppLayout.tsx
import { PromotionalBar } from './PromotionalBar';

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PromotionalBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

---

## RLS Policies

Ver `.architecture/docs/04-seguranca.md` secao "Barras Promocionais" para policies completas.

---

## Referencias

| Documento | Conteudo |
|-----------|----------|
| `docs/04-seguranca.md` | RLS policies |
| `docs/16-admin-panel.md` | Admin Panel |
| `agents/admin-panel-agent.md` | Instrucoes de execucao |
