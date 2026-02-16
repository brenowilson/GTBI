# [Nome do Projeto]

> [Descricao breve do projeto em uma frase]

## Status

🚧 Em desenvolvimento

## Stack

- **Frontend**: React 19 + Vite + TypeScript + shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Deploy**: Vercel + Supabase Cloud

## Desenvolvimento

```bash
# Instalar dependencias
npm install

# Rodar localmente
npm run dev

# Build
npm run build

# Testes
npm test
```

## Estrutura

```
src/
├── app/           # Providers, router, App.tsx
├── components/    # UI compartilhada
├── features/      # Modulos por feature
├── entities/      # Domain models
├── domain/        # Erros e tipos compartilhados
├── shared/        # Repositories e services
└── stores/        # Estado global (Zustand)
```

## Links

- **Producao**: [https://projeto.vercel.app](https://projeto.vercel.app)
- **Staging**: [https://projeto-develop.vercel.app](https://projeto-develop.vercel.app)

## Licenca

Privado - Todos os direitos reservados
