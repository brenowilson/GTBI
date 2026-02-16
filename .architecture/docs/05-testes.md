# Testes

## Visao Geral

Este framework utiliza **Vitest** como test runner principal, com **Testing Library** para testes de componentes React. A estrategia de testes segue TDD otimizado para geracao por IA.

---

## Stack de Testes

| Ferramenta | Proposito |
|------------|-----------|
| **Vitest** | Test runner (compativel Jest, mais rapido) |
| **Testing Library** | Testes de componentes React |
| **MSW** | Mock de APIs (Mock Service Worker) |
| **Playwright** | E2E tests (opcional) |

---

## Configuracao Vitest

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### src/tests/setup.ts

```typescript
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Limpa DOM apos cada teste
afterEach(() => {
  cleanup();
});

// Mock de matchMedia (para componentes responsivos)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock de ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

---

## Cobertura Minima

| Categoria | Cobertura | Justificativa |
|-----------|-----------|---------------|
| **Geral** | 80% | Baseline para qualidade |
| **Auth/Security** | 95% | Critico - falhas sao graves |
| **Billing** | 95% | Critico - impacto financeiro |
| **Validacao de dados** | 90% | Previne corrupcao de dados |
| **UI Components** | 70% | Menos critico, mais visual |

### Configurar thresholds por pasta

```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    // Global
    lines: 80,
    // Por pasta
    'src/features/auth/**': {
      lines: 95,
      functions: 95,
    },
    'src/features/billing/**': {
      lines: 95,
      functions: 95,
    },
  },
}
```

---

## Principios Testing Library

Baseados em Kent C. Dodds:

### 1. Testar comportamento, nao implementacao

```typescript
// ERRADO: testa implementacao
expect(component.state.isOpen).toBe(true);

// CERTO: testa comportamento visivel
expect(screen.getByRole('dialog')).toBeVisible();
```

### 2. Prioridade de queries

```
getByRole > getByLabelText > getByPlaceholderText > getByText > getByTestId
```

```typescript
// MELHOR: semantico
const button = screen.getByRole('button', { name: /submit/i });

// PIOR: fragil
const button = screen.getByTestId('submit-button');
```

### 3. Preferir userEvent sobre fireEvent

```typescript
import userEvent from '@testing-library/user-event';

// CERTO: simula interacao real
await userEvent.click(button);
await userEvent.type(input, 'texto');

// EVITAR: baixo nivel
fireEvent.click(button);
```

---

## Templates de Teste

### Componente React

```typescript
// features/auth/components/__tests__/LoginForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LoginForm } from '../LoginForm';

// Mock de dependencias
vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
    },
  },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input and submit button', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });

  it('shows error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'invalid');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    expect(screen.getByText(/email invalido/i)).toBeInTheDocument();
  });

  it('submits form with valid email', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    expect(onSuccess).toHaveBeenCalled();
  });
});
```

### Hook React Query

```typescript
// features/dashboard/hooks/__tests__/useTasks.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect } from 'vitest';
import { useTasks } from '../useTasks';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useTasks', () => {
  it('fetches tasks successfully', async () => {
    const mockTasks = [{ id: '1', title: 'Task 1' }];
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTasks),
    } as Response);

    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTasks);
  });
});
```

### Validacao Zod

```typescript
// entities/user/__tests__/model.test.ts
import { describe, it, expect } from 'vitest';
import { UserSchema } from '../model';

describe('UserSchema', () => {
  it('validates correct user data', () => {
    const validUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      role: 'member',
      created_at: '2024-01-01T00:00:00Z',
    };

    expect(() => UserSchema.parse(validUser)).not.toThrow();
  });

  it('rejects invalid email', () => {
    const invalidUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'not-an-email',
      role: 'member',
      created_at: '2024-01-01T00:00:00Z',
    };

    expect(() => UserSchema.parse(invalidUser)).toThrow();
  });

  it('rejects invalid role', () => {
    const invalidUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      role: 'superadmin', // nao existe
      created_at: '2024-01-01T00:00:00Z',
    };

    expect(() => UserSchema.parse(invalidUser)).toThrow();
  });
});
```

---

## TDD para Geracao por IA

### Workflow Recomendado

1. **Escrever testes primeiro** (incluindo edge cases)
2. **IA gera testes adicionais** baseados nos exemplos
3. **IA gera codigo** para passar os testes
4. **Iterar** ate todos os testes passarem
5. **Refatorar** com assistencia de IA

### Exemplo de Prompt

```markdown
Dado os seguintes testes:

```typescript
describe('formatCurrency', () => {
  it('formats BRL correctly', () => {
    expect(formatCurrency(1234.56, 'BRL')).toBe('R$ 1.234,56');
  });
  it('handles zero', () => {
    expect(formatCurrency(0, 'BRL')).toBe('R$ 0,00');
  });
  it('handles negative', () => {
    expect(formatCurrency(-100, 'BRL')).toBe('-R$ 100,00');
  });
});
```

Implemente a funcao `formatCurrency` que passa todos os testes.
```

---

## Testes de Edge Functions (Supabase)

### Usando Deno Test

```typescript
// supabase/functions/hello-world/index.test.ts
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
);

Deno.test('hello-world returns greeting', async () => {
  const { data, error } = await supabase.functions.invoke('hello-world', {
    body: { name: 'World' },
  });

  assertEquals(error, null);
  assertEquals(data.message, 'Hello, World!');
});

Deno.test('hello-world handles missing name', async () => {
  const { data, error } = await supabase.functions.invoke('hello-world', {
    body: {},
  });

  assertEquals(error, null);
  assertEquals(data.message, 'Hello, Anonymous!');
});
```

### Rodar testes de Edge Functions

```bash
# Local
supabase functions serve hello-world --env-file .env.local &
deno test --allow-net --allow-env supabase/functions/hello-world/index.test.ts

# CI
supabase start
deno test --allow-net --allow-env supabase/functions/
```

---

## Mock Service Worker (MSW)

### Setup

```typescript
// src/tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ]);
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: '3', ...body }, { status: 201 });
  }),
];
```

```typescript
// src/tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// src/tests/setup.ts
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## Comandos

```bash
# Rodar todos os testes
npm test

# Watch mode
npm run test:watch

# Com cobertura
npm run test:coverage

# Apenas arquivos alterados
npm run test:changed

# Testes de um arquivo especifico
npm test -- src/features/auth/

# UI do Vitest
npm run test:ui
```

### package.json scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:changed": "vitest run --changed"
  }
}
```

---

## Checklist Pre-Merge

- [ ] Todos os testes passando
- [ ] Cobertura >= thresholds definidos
- [ ] Novos arquivos tem testes correspondentes
- [ ] Edge cases cobertos
- [ ] Mocks limpos (clearAllMocks em beforeEach)
- [ ] Sem testes pulados (.skip) em codigo final
