# Design System

## Visao Geral

Este framework utiliza **shadcn/ui** como base de componentes, com **Tailwind CSS** para styling. A filosofia e de componentes como codigo aberto no codebase, nao como dependencia.

---

## Geracao a partir de Brand Manual

O Design System pode ser gerado automaticamente a partir de um brand manual estruturado.

### Fluxo

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│  Brand Manual   │ ──> │ Design System Agent │ ──> │  Design Tokens  │
│    (input)      │     │    (processador)    │     │    (output)     │
└─────────────────┘     └─────────────────────┘     └─────────────────┘
```

### Como Usar

1. **Preencher brand manual**: Copie `.architecture/examples/BRAND.md` e preencha com as definicoes da marca

2. **Gerar design system**:
   ```bash
   claude "Gere Design System a partir de BRAND.md"
   ```

3. **Arquivos gerados**:
   - `src/styles/globals.css` - CSS variables (light/dark)
   - `tailwind.config.js` - Configuracao Tailwind
   - `src/styles/tokens/*.ts` - Tokens tipados

### Documentos Relacionados

- [`.architecture/examples/BRAND.md`](../examples/BRAND.md) - Template de input (unico arquivo BRAND)
- [`agents/design-system-generator.md`](../agents/design-system-generator.md) - Agente gerador

---

## Stack de UI

| Ferramenta | Proposito |
|------------|-----------|
| **shadcn/ui** | Componentes base (Button, Input, Dialog, etc) |
| **Tailwind CSS** | Utility-first CSS |
| **Radix UI** | Primitivos de acessibilidade (usado pelo shadcn) |
| **Lucide React** | Icones |
| **clsx + tailwind-merge** | Class name utilities |

---

## Estrutura de Pastas

```
src/components/
├── ui/                    # shadcn/ui (auto-gerado)
│   ├── button.tsx         # NAO MODIFICAR DIRETAMENTE
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   └── ...
│
├── common/                # Componentes customizados
│   ├── Logo.tsx
│   ├── Avatar.tsx
│   ├── EmptyState.tsx
│   ├── LoadingSpinner.tsx
│   └── ErrorBoundary.tsx
│
└── layout/                # Layouts reutilizaveis
    ├── DashboardLayout.tsx
    ├── AuthLayout.tsx
    ├── Sidebar.tsx
    ├── Header.tsx
    └── Footer.tsx
```

### Regras

| Pasta | Conteudo | Modificavel? |
|-------|----------|--------------|
| `ui/` | Componentes shadcn | NAO (reinstalar se precisar) |
| `common/` | Componentes customizados | SIM |
| `layout/` | Layouts de pagina | SIM |

---

## Instalando Componentes shadcn/ui

### Comando

```bash
# Instalar um componente
npx shadcn@latest add button

# Instalar multiplos
npx shadcn@latest add button input dialog

# Listar disponiveis
npx shadcn@latest add
```

### Componentes Recomendados

```bash
# Core UI
npx shadcn@latest add button input label textarea

# Forms
npx shadcn@latest add form select checkbox radio-group switch

# Feedback
npx shadcn@latest add alert dialog toast sonner

# Navigation
npx shadcn@latest add dropdown-menu navigation-menu tabs

# Data Display
npx shadcn@latest add table card avatar badge

# Layout
npx shadcn@latest add separator sheet scroll-area
```

---

## Configuracao Tailwind

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

### CSS Variables (globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

---

## Utility: cn()

### shared/lib/cn.ts

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Uso

```tsx
import { cn } from '@/shared/lib/cn';

function Component({ className, variant }) {
  return (
    <div
      className={cn(
        'base-classes here',
        variant === 'primary' && 'bg-primary text-primary-foreground',
        variant === 'secondary' && 'bg-secondary',
        className
      )}
    />
  );
}
```

---

## Criando Componentes Customizados

### Template

```tsx
// components/common/EmptyState.tsx
import { cn } from '@/shared/lib/cn';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      {Icon && (
        <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

### Uso

```tsx
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { FileX } from 'lucide-react';

<EmptyState
  icon={FileX}
  title="Nenhum arquivo encontrado"
  description="Comece criando seu primeiro arquivo."
  action={<Button>Criar arquivo</Button>}
/>
```

---

## Acessibilidade

### Checklist por Componente

- [ ] Navegacao por teclado funcional
- [ ] Focus visible em elementos interativos
- [ ] Labels associados a inputs
- [ ] Aria labels em icones interativos
- [ ] Contraste de cores adequado (4.5:1 texto, 3:1 UI)
- [ ] Tamanho de toque minimo 44x44px em mobile

### Padroes

```tsx
// CERTO: Label associado
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// CERTO: Icone com aria-label
<Button size="icon" aria-label="Fechar">
  <X className="h-4 w-4" />
</Button>

// CERTO: Loading state acessivel
<Button disabled aria-busy="true">
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Carregando...
</Button>
```

---

## Dark Mode

### ThemeProvider

```tsx
// app/providers/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: 'system',
  setTheme: () => null,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### Toggle

```tsx
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/app/providers/ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Alternar tema"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

---

## Icones (Lucide)

### Instalacao

```bash
npm install lucide-react
```

### Uso

```tsx
import { Search, Plus, ChevronRight, Loader2 } from 'lucide-react';

// Tamanhos padrao
<Search className="h-4 w-4" />   // sm
<Search className="h-5 w-5" />   // default
<Search className="h-6 w-6" />   // lg

// Em botoes
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Adicionar
</Button>
```

---

## Patterns de Componentes

### Compound Components

```tsx
// Bom para componentes complexos com partes relacionadas
<Card>
  <Card.Header>
    <Card.Title>Titulo</Card.Title>
    <Card.Description>Descricao</Card.Description>
  </Card.Header>
  <Card.Content>Conteudo</Card.Content>
  <Card.Footer>Acoes</Card.Footer>
</Card>
```

### Render Props

```tsx
// Bom para componentes que precisam de controle externo
<Combobox
  items={items}
  renderItem={(item) => (
    <div className="flex items-center gap-2">
      <Avatar src={item.avatar} />
      <span>{item.name}</span>
    </div>
  )}
/>
```

---

## Anti-Patterns

### NAO FAZER

```tsx
// ERRADO: Modificar componente em ui/
// src/components/ui/button.tsx
// Adicionar className customizado diretamente

// ERRADO: Inline styles
<Button style={{ backgroundColor: 'red' }}>

// ERRADO: Classes Tailwind longas e repetidas
<div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-md border border-gray-200">
<div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-md border border-gray-200">
```

### FAZER

```tsx
// CERTO: Criar variante em common/
// src/components/common/PrimaryButton.tsx
export function PrimaryButton(props) {
  return <Button className="bg-brand-500" {...props} />;
}

// CERTO: Usar cn() para merge
<Button className={cn('custom-class', className)}>

// CERTO: Extrair para componente reutilizavel
<Card>...</Card>
<Card>...</Card>
```

---

## Checklist de Qualidade

### Novo Componente

- [ ] Props tipadas com interface
- [ ] className aceito e mergeado com cn()
- [ ] Acessibilidade verificada
- [ ] Dark mode funcionando
- [ ] Responsivo (mobile-first)
- [ ] Documentado com exemplo de uso
- [ ] Testado

### Modificacao de UI

- [ ] NAO modificar arquivos em `ui/`
- [ ] Criar wrapper em `common/` se necessario
- [ ] Usar CSS variables para cores
- [ ] Manter consistencia com design system

---

## Design Tokens

### Estrutura

```
src/styles/
├── globals.css           # CSS variables (light/dark)
├── tokens/
│   ├── colors.ts         # Paleta de cores tipada
│   ├── typography.ts     # Fontes e tamanhos
│   ├── spacing.ts        # Escala de espacamento
│   └── index.ts          # Export unificado
```

### Uso de Tokens

```tsx
// Via Tailwind (preferido)
<div className="bg-primary text-primary-foreground p-4" />

// Via CSS variable (quando necessario)
<div style={{ color: 'hsl(var(--primary))' }} />

// Via import direto (para logica JS)
import { colors } from '@/styles/tokens';
const primaryHex = colors.primary.DEFAULT; // #2563EB
```

### Tokens Disponiveis

#### Cores

| Token | Uso |
|-------|-----|
| `primary` | CTAs, links, acoes principais |
| `secondary` | Acoes secundarias, backgrounds |
| `destructive` | Erros, acoes destrutivas |
| `success` | Confirmacoes, sucesso |
| `warning` | Alertas |
| `muted` | Backgrounds e texto secundario |
| `accent` | Destaques |
| `border` | Bordas |
| `input` | Fundo de inputs |
| `ring` | Focus ring |

#### Tipografia

| Token | Tamanho | Uso |
|-------|---------|-----|
| `text-xs` | 12px | Labels pequenos |
| `text-sm` | 14px | Texto secundario |
| `text-base` | 16px | Texto padrao |
| `text-lg` | 18px | Texto destacado |
| `text-xl` | 20px | Subtitulos |
| `text-2xl` | 24px | Titulos secao |
| `text-3xl` | 30px | Titulos pagina |
| `text-4xl` | 36px | Hero |

### Regenerar Tokens

Se o brand manual mudar:

```bash
claude "Regenere Design System a partir de BRAND.md"
```

O agente ira:
1. Ler o novo brand manual
2. Regenerar CSS variables
3. Atualizar tokens TypeScript
4. Validar contraste WCAG
5. Documentar mudancas
