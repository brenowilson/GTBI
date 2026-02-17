# Progressive Web App (PWA)

Este documento define a configuracao de PWA para que o aplicativo possa ser instalado em dispositivos moveis e desktops.

---

## Visao Geral

Todo projeto gerado pelo framework deve ser uma **PWA instalavel**, permitindo:

- Instalacao no dispositivo (Add to Home Screen)
- Funcionamento offline (quando aplicavel)
- Notificacoes push (quando aplicavel)
- Icone na tela inicial
- Splash screen nativa
- Experiencia fullscreen

---

## Arquivos Obrigatorios

### Estrutura

```
public/
├── manifest.json           # Web App Manifest
├── sw.js                   # Service Worker (ou gerado pelo Vite)
├── icons/
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   └── maskable-icon-512x512.png
├── apple-touch-icon.png    # 180x180 para iOS
├── favicon.ico             # 32x32
└── favicon.svg             # SVG para browsers modernos
```

---

## Web App Manifest

### public/manifest.json

```json
{
  "name": "[Nome Completo do App]",
  "short_name": "[Nome Curto]",
  "description": "[Descricao em uma frase]",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366F1",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "pt-BR",
  "categories": ["productivity", "business"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/maskable-icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "Criar Tarefa",
      "short_name": "Nova Tarefa",
      "description": "Criar uma nova tarefa rapidamente",
      "url": "/tasks/new",
      "icons": [{ "src": "/icons/shortcut-new.png", "sizes": "96x96" }]
    }
  ]
}
```

### Campos por Contexto

| Campo | Origem | Exemplo |
|-------|--------|---------|
| `name` | PRD.md - Nome do projeto | "TaskFlow" |
| `short_name` | PRD.md - Nome curto (max 12 chars) | "TaskFlow" |
| `description` | PRD.md - Descricao em uma frase | "Gerenciador de tarefas simples" |
| `theme_color` | BRAND.md - primary color | "#6366F1" |
| `background_color` | BRAND.md - background color | "#ffffff" |

---

## Meta Tags HTML

### src/app/layout.tsx (ou index.html)

```tsx
export const metadata: Metadata = {
  // ... outras meta tags
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '[Nome do App]',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};
```

### Head adicional

```html
<!-- PWA -->
<link rel="manifest" href="/manifest.json" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="[Nome]" />

<!-- Icons -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />

<!-- Theme Color -->
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f172a" />

<!-- iOS Splash Screens -->
<link rel="apple-touch-startup-image" href="/splash/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
<link rel="apple-touch-startup-image" href="/splash/apple-splash-1668-2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
<link rel="apple-touch-startup-image" href="/splash/apple-splash-1536-2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
<link rel="apple-touch-startup-image" href="/splash/apple-splash-1290-2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
<link rel="apple-touch-startup-image" href="/splash/apple-splash-1179-2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
<link rel="apple-touch-startup-image" href="/splash/apple-splash-1170-2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
```

---

## Service Worker

### Configuracao com Vite PWA Plugin

```bash
npm install -D vite-plugin-pwa
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: '[Nome do App]',
        short_name: '[Nome Curto]',
        description: '[Descricao]',
        theme_color: '#6366F1',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 horas
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
              },
            },
          },
        ],
      },
    }),
  ],
});
```

---

## Estrategias de Cache

### Tipos de Cache

| Estrategia | Uso | Exemplo |
|------------|-----|---------|
| **CacheFirst** | Assets estaticos | Imagens, fontes, CSS |
| **NetworkFirst** | Dados dinamicos | API calls |
| **StaleWhileRevalidate** | Conteudo semi-estatico | HTML pages |
| **NetworkOnly** | Sempre atualizado | Auth, pagamentos |
| **CacheOnly** | Offline-first | App shell |

### Configuracao por Tipo

```typescript
// workbox config
runtimeCaching: [
  // API - Network First
  {
    urlPattern: /\/api\//,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      networkTimeoutSeconds: 10,
    },
  },
  // Supabase - Network First
  {
    urlPattern: /\.supabase\.co/,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'supabase-cache',
    },
  },
  // Google Fonts - Cache First
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts-cache',
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
      },
    },
  },
  // Imagens - Cache First
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'image-cache',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
      },
    },
  },
]
```

---

## Comportamento Offline

O framework NAO implementa funcionalidade offline completa. Quando o usuario esta sem conexao:

1. **Service Worker** cacheia apenas assets estaticos (JS, CSS, imagens)
2. **Indicador** mostra que o usuario esta offline
3. **Acoes** sao bloqueadas ate a conexao voltar

### Detectar Status Online/Offline

```tsx
// src/shared/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

### Indicador de Status Offline

```tsx
// src/components/common/OfflineIndicator.tsx
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50">
      <div className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">Sem conexao com a internet</span>
      </div>
    </div>
  );
}
```

### Uso

Adicionar o indicador no layout principal:

```tsx
// src/app/layout.tsx
import { OfflineIndicator } from '@/components/common/OfflineIndicator';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <OfflineIndicator />
      </body>
    </html>
  );
}
```

---

## Install Prompt

### Hook para Install

```tsx
// src/shared/hooks/useInstallPrompt.ts
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se ja esta instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstallPrompt(null);
      return true;
    }

    return false;
  };

  return {
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    promptInstall,
  };
}
```

### Componente de Install Banner

```tsx
// src/components/common/InstallBanner.tsx
import { useInstallPrompt } from '@/shared/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useState } from 'react';

export function InstallBanner() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 p-4 bg-background border-t shadow-lg z-50 safe-area-inset-bottom">
      <div className="container flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-medium">Instalar [Nome do App]</p>
            <p className="text-sm text-muted-foreground">
              Acesse rapidamente da sua tela inicial
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setDismissed(true)}>
            <X className="h-4 w-4" />
          </Button>
          <Button onClick={promptInstall}>Instalar</Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Icones

### Geracao de Icones

Usar ferramenta para gerar todos os tamanhos a partir de um icone 512x512:

```bash
# Usando pwa-asset-generator
npx pwa-asset-generator logo.png public/icons --background "#ffffff" --splash-only false --icon-only

# Ou usando sharp manualmente
```

### Script de Geracao

```typescript
// scripts/generate-icons.ts
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputPath = 'assets/logo-512.png';
const outputDir = 'public/icons';

async function generateIcons() {
  // Criar diretorio se nao existir
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const size of sizes) {
    await sharp(inputPath)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));

    console.log(`Generated: icon-${size}x${size}.png`);
  }

  // Maskable icon (com padding)
  await sharp(inputPath)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, 'maskable-icon-512x512.png'));

  console.log('Generated: maskable-icon-512x512.png');

  // Apple touch icon
  await sharp(inputPath)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');

  console.log('Generated: apple-touch-icon.png');

  // Favicon
  await sharp(inputPath)
    .resize(32, 32)
    .toFile('public/favicon.ico');

  console.log('Generated: favicon.ico');
}

generateIcons();
```

### Maskable Icon

O icone maskable deve ter:
- Conteudo importante dentro de "safe zone" (circulo central de 80%)
- Background solido
- Padding adequado

```
┌────────────────────┐
│                    │
│    ┌──────────┐    │
│    │          │    │
│    │  ICONE   │    │  <- Safe zone (80%)
│    │          │    │
│    └──────────┘    │
│                    │
└────────────────────┘
```

---

## Atualizacoes do App

### Notificar Usuario sobre Atualizacao

```tsx
// src/components/common/UpdatePrompt.tsx
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-3 bg-background border rounded-lg shadow-lg p-4">
        <RefreshCw className="h-5 w-5 text-primary" />
        <div>
          <p className="font-medium">Atualizacao disponivel</p>
          <p className="text-sm text-muted-foreground">
            Clique para atualizar o app
          </p>
        </div>
        <Button size="sm" onClick={() => updateServiceWorker(true)}>
          Atualizar
        </Button>
      </div>
    </div>
  );
}
```

---

## Checklist PWA

### Obrigatorio

- [ ] manifest.json configurado
- [ ] Service Worker registrado
- [ ] Icones em todos os tamanhos (72-512)
- [ ] Maskable icon
- [ ] Apple touch icon (180x180)
- [ ] Meta tags PWA no HTML
- [ ] theme-color configurado (light/dark)

### Recomendado

- [ ] Splash screens para iOS
- [ ] Pagina offline
- [ ] Indicador de status offline
- [ ] Banner de instalacao
- [ ] Shortcuts no manifest
- [ ] Screenshots no manifest

### Performance

- [ ] App Shell cached
- [ ] Assets estaticos cached
- [ ] API com cache strategy
- [ ] Lighthouse PWA score 100

---

## Testes

### Lighthouse PWA Audit

```bash
# Via CLI
npx lighthouse https://[url] --only-categories=pwa

# Ou via Chrome DevTools > Lighthouse > PWA
```

### Checklist Manual

1. [ ] Instalar em Android (Chrome)
2. [ ] Instalar em iOS (Safari > Add to Home Screen)
3. [ ] Instalar em Desktop (Chrome/Edge)
4. [ ] Testar offline
5. [ ] Verificar splash screen
6. [ ] Verificar icone na home
7. [ ] Verificar fullscreen mode

---

## Referencias

- [web.dev PWA](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developer.chrome.com/docs/workbox/)
- [PWA Builder](https://www.pwabuilder.com/)
