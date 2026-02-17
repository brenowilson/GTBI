# Responsividade e Mobile

Este documento define os padroes de responsividade e mobile-first do framework.

---

## Filosofia: Mobile-First

Todo o desenvolvimento de UI segue a abordagem **mobile-first**:

1. **Escrever CSS para mobile primeiro** (base styles)
2. **Adicionar breakpoints para telas maiores** (enhancements)
3. **Testar em dispositivos reais** (nao apenas resize do browser)

```tsx
// CORRETO: Mobile-first
<div className="flex flex-col md:flex-row">
  <div className="w-full md:w-1/3">Sidebar</div>
  <div className="w-full md:w-2/3">Content</div>
</div>

// ERRADO: Desktop-first
<div className="flex flex-row md:flex-col">
  ...
</div>
```

---

## Breakpoints

### Definicao

| Token | Valor | Dispositivo | Uso |
|-------|-------|-------------|-----|
| `sm` | 640px | Mobile landscape, phablets | Ajustes pequenos |
| `md` | 768px | Tablets | Layout 2 colunas |
| `lg` | 1024px | Desktop pequeno, tablets landscape | Sidebar visivel |
| `xl` | 1280px | Desktop | Layout completo |
| `2xl` | 1536px | Desktop grande | Max-width containers |

### Uso no Tailwind

```tsx
// Esconder em mobile, mostrar em desktop
<Sidebar className="hidden lg:flex" />

// Texto menor em mobile
<h1 className="text-2xl md:text-3xl lg:text-4xl">Titulo</h1>

// Grid responsivo
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// Padding responsivo
<main className="p-4 md:p-6 lg:p-8">
  {children}
</main>
```

### Orientacao

```tsx
// Detectar orientacao (usar com moderacao)
@media (orientation: portrait) { ... }
@media (orientation: landscape) { ... }

// Tailwind custom (adicionar ao tailwind.config.js se necessario)
screens: {
  'portrait': { 'raw': '(orientation: portrait)' },
  'landscape': { 'raw': '(orientation: landscape)' },
}
```

---

## Layouts Responsivos

### 1. Dashboard Layout

```tsx
// src/components/layout/DashboardLayout.tsx
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar: bottom nav em mobile, lateral em desktop */}
      <Sidebar className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0" />

      {/* Mobile header */}
      <MobileHeader className="lg:hidden" />

      {/* Main content */}
      <main className="flex-1 lg:pl-64">
        <div className="py-4 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <BottomNavigation className="lg:hidden" />
    </div>
  );
}
```

### 2. Auth Layout

```tsx
// src/components/layout/AuthLayout.tsx
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Logo className="mx-auto h-12 w-auto" />
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### 3. Landing Layout

```tsx
// src/components/layout/LandingLayout.tsx
export function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Header fixo */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-sm">
        <nav className="container flex h-16 items-center justify-between px-4">
          <Logo />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLinks />
            <AuthButtons />
          </div>

          {/* Mobile menu trigger */}
          <MobileMenuButton className="md:hidden" />
        </nav>
      </header>

      {/* Mobile menu (drawer) */}
      <MobileMenu className="md:hidden" />

      {/* Content */}
      <main className="pt-16">
        {children}
      </main>

      <Footer />
    </div>
  );
}
```

---

## Componentes Mobile-Specific

### 1. Bottom Navigation

Para navegacao principal em mobile (substitui sidebar):

```tsx
// src/components/layout/BottomNavigation.tsx
import { Home, ListTodo, Settings, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/shared/lib/cn';

const items = [
  { href: '/dashboard', icon: Home, label: 'Inicio' },
  { href: '/tasks', icon: ListTodo, label: 'Tarefas' },
  { href: '/profile', icon: User, label: 'Perfil' },
  { href: '/settings', icon: Settings, label: 'Config' },
];

export function BottomNavigation({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn(
      'fixed bottom-0 inset-x-0 z-50 bg-background border-t',
      'safe-area-inset-bottom', // Para iPhones com notch
      className
    )}>
      <div className="flex items-center justify-around h-16">
        {items.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-full h-full',
                'text-muted-foreground hover:text-foreground',
                'min-h-[44px] min-w-[44px]', // Touch target
                isActive && 'text-primary'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### 2. Mobile Menu (Drawer)

Para navegacao secundaria em mobile:

```tsx
// src/components/layout/MobileMenu.tsx
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export function MobileMenu({ className }: { className?: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('min-h-[44px] min-w-[44px]', className)}
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <nav className="flex flex-col gap-4 mt-8">
          <NavLinks />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

### 3. Drawer vs Dialog

| Componente | Mobile | Desktop | Quando Usar |
|------------|--------|---------|-------------|
| **Sheet (Drawer)** | Full height, side | Side panel | Navegacao, filtros, forms longos |
| **Dialog (Modal)** | Full screen | Centered | Confirmacoes, forms curtos |
| **Popover** | Sheet/Drawer | Popover | Menus contextuais, tooltips |

```tsx
// Drawer em mobile, Dialog em desktop
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';

export function ResponsiveDialog({ children, ...props }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return <Dialog {...props}>{children}</Dialog>;
  }

  return <Sheet {...props}>{children}</Sheet>;
}
```

### 4. Hook: useMediaQuery

```tsx
// src/shared/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Uso
const isMobile = useMediaQuery('(max-width: 767px)');
const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
const isDesktop = useMediaQuery('(min-width: 1024px)');
```

---

## Touch Targets

### Tamanho Minimo

Todos os elementos interativos devem ter no minimo **44x44px** de area tocavel:

```tsx
// CORRETO: Touch target adequado
<Button className="min-h-[44px] min-w-[44px] p-3">
  <Icon className="h-5 w-5" />
</Button>

// CORRETO: Padding para aumentar area
<Link className="inline-flex items-center gap-2 py-3 px-4">
  <span>Ver mais</span>
  <ChevronRight className="h-4 w-4" />
</Link>

// ERRADO: Touch target muito pequeno
<button className="p-1">
  <Icon className="h-4 w-4" />
</button>
```

### Espacamento entre Elementos

Manter espaco suficiente entre elementos tocaveis para evitar toques acidentais:

```tsx
// CORRETO: Gap adequado
<div className="flex gap-3">
  <Button>Cancelar</Button>
  <Button>Confirmar</Button>
</div>

// ERRADO: Elementos muito proximos
<div className="flex gap-1">
  <Button>Cancelar</Button>
  <Button>Confirmar</Button>
</div>
```

---

## Tipografia Responsiva

### Escala

| Token | Mobile | Desktop | Uso |
|-------|--------|---------|-----|
| `text-xs` | 12px | 12px | Badges, labels pequenos |
| `text-sm` | 14px | 14px | Texto secundario |
| `text-base` | 16px | 16px | Texto padrao |
| `text-lg` | 18px | 18px | Texto destacado |
| `text-xl` | 18px | 20px | Subtitulos |
| `text-2xl` | 20px | 24px | Titulos secao |
| `text-3xl` | 24px | 30px | Titulos pagina |
| `text-4xl` | 30px | 36px | Hero |

### Implementacao

```tsx
// Titulo de pagina responsivo
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Bem-vindo ao TaskFlow
</h1>

// Paragrafo com line-height responsivo
<p className="text-base md:text-lg leading-relaxed md:leading-loose">
  Descricao do produto...
</p>
```

---

## Imagens Responsivas

### Srcset e Sizes

```tsx
// src/components/common/ResponsiveImage.tsx
interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ResponsiveImage({ src, alt, className }: ResponsiveImageProps) {
  // Extrair nome base e extensao
  const [base, ext] = src.split('.');

  return (
    <picture>
      <source
        media="(min-width: 1024px)"
        srcSet={`${base}-lg.${ext} 1x, ${base}-lg@2x.${ext} 2x`}
      />
      <source
        media="(min-width: 768px)"
        srcSet={`${base}-md.${ext} 1x, ${base}-md@2x.${ext} 2x`}
      />
      <img
        src={`${base}-sm.${ext}`}
        srcSet={`${base}-sm.${ext} 1x, ${base}-sm@2x.${ext} 2x`}
        alt={alt}
        className={cn('w-full h-auto', className)}
        loading="lazy"
      />
    </picture>
  );
}
```

### Aspect Ratio

```tsx
// Manter proporcao em diferentes tamanhos
<div className="aspect-video rounded-lg overflow-hidden">
  <img src={thumbnail} alt={title} className="object-cover w-full h-full" />
</div>

// Aspect ratios disponiveis no Tailwind
// aspect-auto, aspect-square, aspect-video (16/9)
```

---

## Formularios Mobile

### Input com Teclado Correto

```tsx
// Teclado numerico para telefone
<Input type="tel" inputMode="tel" />

// Teclado numerico para valores
<Input type="text" inputMode="decimal" />

// Teclado de email
<Input type="email" inputMode="email" />

// Teclado de URL
<Input type="url" inputMode="url" />

// Desabilitar autocorrect/autocapitalize quando necessario
<Input
  autoCorrect="off"
  autoCapitalize="none"
  spellCheck={false}
/>
```

### Labels e Placeholders

```tsx
// CORRETO: Label sempre visivel
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="seu@email.com" />
</div>

// ERRADO: Usar apenas placeholder como label
<Input placeholder="Email" />
```

### Botoes de Acao

```tsx
// Botao principal em full-width no mobile
<div className="flex flex-col sm:flex-row gap-3">
  <Button variant="outline" className="w-full sm:w-auto order-2 sm:order-1">
    Cancelar
  </Button>
  <Button className="w-full sm:w-auto order-1 sm:order-2">
    Confirmar
  </Button>
</div>
```

---

## Gestos e Interacoes

### Swipe Actions

```tsx
// Para listas com acoes de swipe (use biblioteca como react-swipeable)
import { useSwipeable } from 'react-swipeable';

export function SwipeableCard({ onDelete, onEdit, children }) {
  const handlers = useSwipeable({
    onSwipedLeft: onDelete,
    onSwipedRight: onEdit,
    trackMouse: false, // Apenas touch
  });

  return (
    <div {...handlers} className="relative">
      {children}
    </div>
  );
}
```

### Pull to Refresh

```tsx
// Implementar com react-pull-to-refresh ou similar
// Ou usar nativo do browser quando disponivel
```

### Long Press

```tsx
// Para menus contextuais em mobile
import { useLongPress } from '@/shared/hooks/useLongPress';

export function TaskCard({ task }) {
  const longPressProps = useLongPress(() => {
    // Abrir menu de contexto
  }, 500); // 500ms

  return (
    <div {...longPressProps}>
      {/* Conteudo */}
    </div>
  );
}
```

---

## Safe Areas (iPhone Notch)

### CSS

```css
/* src/styles/globals.css */
@supports (padding: env(safe-area-inset-bottom)) {
  .safe-area-inset-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .safe-area-inset-top {
    padding-top: env(safe-area-inset-top);
  }
}
```

### Tailwind Plugin

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
};
```

### Uso

```tsx
// Bottom navigation com safe area
<nav className="fixed bottom-0 inset-x-0 pb-safe-bottom bg-background border-t">
  ...
</nav>

// Header com safe area
<header className="fixed top-0 inset-x-0 pt-safe-top bg-background">
  ...
</header>
```

---

## Performance Mobile

### Lazy Loading

```tsx
// Componentes pesados
const HeavyChart = lazy(() => import('./HeavyChart'));

// Imagens
<img loading="lazy" src={image} alt={alt} />

// Componentes abaixo da dobra
import dynamic from 'next/dynamic';
const BelowFold = dynamic(() => import('./BelowFold'), { ssr: false });
```

### Reducao de Bundle

```tsx
// Importar apenas o necessario
import { Button } from '@/components/ui/button'; // BOM
import * as UI from '@/components/ui'; // EVITAR

// Tree shaking de icones
import { Search } from 'lucide-react'; // BOM
import * as Icons from 'lucide-react'; // EVITAR
```

### Conexoes Lentas

```tsx
// Detectar conexao lenta
const isSlowConnection = navigator.connection?.effectiveType === '2g'
  || navigator.connection?.effectiveType === 'slow-2g';

// Carregar versao simplificada
{isSlowConnection ? <SimplifiedView /> : <FullView />}
```

---

## Testes de Responsividade

### Checklist Manual

- [ ] iPhone SE (375px) - menor tela comum
- [ ] iPhone 14/15 (390px) - tamanho padrao
- [ ] iPhone 14 Pro Max (430px) - maior iPhone
- [ ] iPad Mini (768px) - tablet pequeno
- [ ] iPad Pro 11" (834px) - tablet medio
- [ ] iPad Pro 12.9" (1024px) - tablet grande
- [ ] Laptop (1280px) - desktop padrao
- [ ] Desktop (1920px) - tela grande
- [ ] Ultrawide (2560px+) - max-width testado

### Testes Automatizados

```typescript
// e2e/responsive.spec.ts
import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
];

for (const viewport of viewports) {
  test(`renders correctly on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');

    // Verificar elementos visiveis/ocultos por viewport
    if (viewport.name === 'mobile') {
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="desktop-nav"]')).toBeHidden();
    } else {
      await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
    }

    // Screenshot para comparacao visual
    await expect(page).toHaveScreenshot(`home-${viewport.name}.png`);
  });
}
```

### Ferramentas

| Ferramenta | Uso |
|------------|-----|
| Chrome DevTools | Simulacao de dispositivos |
| BrowserStack | Testes em dispositivos reais |
| Playwright | Testes automatizados multi-viewport |
| Lighthouse | Performance mobile |
| WebPageTest | Simulacao de conexoes lentas |

---

## Checklist de Responsividade

### Por Componente

- [ ] Layout funciona em mobile (375px)
- [ ] Touch targets >= 44px
- [ ] Texto legivel (min 14px)
- [ ] Imagens responsivas
- [ ] Nenhum overflow horizontal
- [ ] Formularios com teclado adequado

### Por Pagina

- [ ] Navegacao acessivel em todos os tamanhos
- [ ] Conteudo principal visivel sem scroll horizontal
- [ ] CTAs acessiveis e visiveis
- [ ] Loading states funcionam em mobile
- [ ] Modals/Dialogs adaptados para mobile

### Por Feature

- [ ] Fluxo completo testado em mobile
- [ ] Gestos implementados onde apropriado
- [ ] Performance adequada em 3G
- [ ] Funciona offline (se aplicavel)

---

## Referencias

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [shadcn/ui](https://ui.shadcn.com/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design - Responsive Layout](https://m3.material.io/foundations/layout/understanding-layout)
- [WCAG 2.1 - Mobile Accessibility](https://www.w3.org/WAI/standards-guidelines/mobile/)
