# Arquitetura de Codigo

## Visao Geral

Este framework combina **Feature-Sliced Design** com principios de **Clean Architecture**, adaptado para as limitacoes de React + Supabase + Vercel.

### Principios

1. **Regra de Dependencia**: Dependencias apontam para dentro (UI → Use Cases → Domain)
2. **Separacao de Concerns**: Cada camada tem responsabilidade unica
3. **Testabilidade**: Logica de negocio isolada e testavel
4. **Independencia de Framework**: Core desacoplado de React/Supabase

---

## Camadas da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION                            │
│   app/ (routing, providers) + components/ (UI) + features/ui/   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         APPLICATION                             │
│              features/*/useCases/ (orchestration)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                           DOMAIN                                │
│         entities/ (models, rules) + domain/errors/              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       INFRASTRUCTURE                            │
│    shared/repositories/ + shared/services/ + shared/lib/        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Pastas

### Frontend (src/)

```
src/
├── app/                          # PRESENTATION: Composition root
│   ├── providers/                # React contexts
│   │   ├── AuthProvider.tsx
│   │   ├── QueryProvider.tsx
│   │   └── index.tsx
│   ├── router/                   # Routing
│   │   ├── routes.tsx
│   │   └── ProtectedRoute.tsx
│   └── App.tsx
│
├── components/                   # PRESENTATION: UI compartilhada
│   ├── ui/                       # shadcn/ui (NAO modificar)
│   ├── common/                   # Componentes customizados
│   └── layout/                   # Layouts
│
├── features/                     # Modulos por feature
│   ├── auth/
│   │   ├── components/           # PRESENTATION: UI da feature
│   │   │   ├── LoginForm.tsx
│   │   │   └── MagicLinkSent.tsx
│   │   ├── hooks/                # PRESENTATION: React hooks
│   │   │   └── useAuth.ts
│   │   ├── useCases/             # APPLICATION: Logica de aplicacao
│   │   │   ├── signInWithMagicLink.ts
│   │   │   ├── signOut.ts
│   │   │   └── getCurrentUser.ts
│   │   ├── types.ts              # DTOs da feature
│   │   └── index.ts              # Public API
│   │
│   ├── tasks/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── useCases/
│   │   │   ├── createTask.ts
│   │   │   ├── updateTask.ts
│   │   │   ├── deleteTask.ts
│   │   │   └── listTasks.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── billing/
│       ├── components/
│       ├── hooks/
│       ├── useCases/
│       ├── types.ts
│       └── index.ts
│
├── entities/                     # DOMAIN: Modelos e regras
│   ├── user/
│   │   ├── model.ts              # Zod schema + tipo
│   │   ├── rules.ts              # Regras de negocio
│   │   └── index.ts
│   ├── task/
│   │   ├── model.ts
│   │   ├── rules.ts              # Ex: canAssign, isOverdue
│   │   └── index.ts
│   └── organization/
│       ├── model.ts
│       ├── rules.ts
│       └── index.ts
│
├── domain/                       # DOMAIN: Shared domain logic
│   ├── errors/                   # Erros de dominio
│   │   ├── DomainError.ts
│   │   ├── ValidationError.ts
│   │   ├── NotFoundError.ts
│   │   ├── UnauthorizedError.ts
│   │   └── index.ts
│   └── types/                    # Tipos de dominio
│       └── Result.ts             # Result<T, E> pattern
│
├── shared/                       # INFRASTRUCTURE
│   ├── repositories/             # Data access abstraction
│   │   ├── interfaces/           # Contratos
│   │   │   ├── IUserRepository.ts
│   │   │   ├── ITaskRepository.ts
│   │   │   └── index.ts
│   │   ├── supabase/             # Implementacao Supabase
│   │   │   ├── UserRepository.ts
│   │   │   ├── TaskRepository.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── services/                 # Servicos externos
│   │   ├── interfaces/
│   │   │   ├── IEmailService.ts
│   │   │   └── IStorageService.ts
│   │   ├── resend/               # Implementacao Resend
│   │   │   └── EmailService.ts
│   │   └── supabase/
│   │       └── StorageService.ts
│   ├── api/                      # Cliente HTTP
│   │   └── client.ts
│   ├── config/                   # Environment
│   │   └── env.ts
│   ├── hooks/                    # Hooks globais
│   │   ├── useDebounce.ts
│   │   └── useMediaQuery.ts
│   ├── lib/                      # Utilitarios
│   │   ├── cn.ts
│   │   ├── supabase.ts
│   │   └── utils.ts
│   └── types/                    # Tipos globais
│       └── index.ts
│
└── stores/                       # Estado global (Zustand)
    ├── uiStore.ts
    └── index.ts
```

### Backend (supabase/)

```
supabase/
├── functions/
│   ├── _shared/                  # INFRASTRUCTURE: Compartilhado
│   │   ├── cors.ts
│   │   ├── response.ts
│   │   ├── supabaseAdmin.ts
│   │   └── errors/
│   │       └── HttpError.ts
│   │
│   ├── _domain/                  # DOMAIN: Regras (compartilhado)
│   │   ├── user/
│   │   │   └── rules.ts
│   │   └── billing/
│   │       └── rules.ts
│   │
│   ├── user-management/          # Edge Function
│   │   ├── index.ts              # Entry point (routing)
│   │   ├── handlers/             # PRESENTATION: Request handlers
│   │   │   ├── createUser.ts
│   │   │   └── updateUser.ts
│   │   ├── useCases/             # APPLICATION: Logica
│   │   │   ├── createUserUseCase.ts
│   │   │   └── updateUserUseCase.ts
│   │   └── repositories/         # INFRASTRUCTURE: Data access
│   │       └── userRepository.ts
│   │
│   └── billing/
│       ├── index.ts
│       ├── handlers/
│       ├── useCases/
│       └── repositories/
│
├── migrations/
└── seed.sql
```

---

## Camada: Domain (entities/ + domain/)

### Model com Zod

```typescript
// entities/task/model.ts
import { z } from 'zod';

export const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: TaskStatusSchema,
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Task = z.infer<typeof TaskSchema>;

// DTO para criacao (sem campos auto-gerados)
export const CreateTaskSchema = TaskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateTaskDTO = z.infer<typeof CreateTaskSchema>;
```

### Regras de Dominio

```typescript
// entities/task/rules.ts
import { Task, TaskStatus } from './model';

export const TaskRules = {
  canTransitionTo(task: Task, newStatus: TaskStatus): boolean {
    const transitions: Record<TaskStatus, TaskStatus[]> = {
      pending: ['in_progress'],
      in_progress: ['pending', 'completed'],
      completed: ['in_progress'],
    };
    return transitions[task.status].includes(newStatus);
  },

  isOverdue(task: Task): boolean {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
  },

  canAssign(task: Task, userId: string): boolean {
    // Nao pode atribuir tarefa completada
    return task.status !== 'completed';
  },

  canDelete(task: Task): boolean {
    // Nao pode deletar tarefa em progresso
    return task.status !== 'in_progress';
  },
};
```

### Erros de Dominio

```typescript
// domain/errors/DomainError.ts
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

// domain/errors/ValidationError.ts
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

// domain/errors/NotFoundError.ts
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
  }
}

// domain/errors/UnauthorizedError.ts
export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;

  constructor(message = 'Unauthorized') {
    super(message);
  }
}

// domain/errors/BusinessRuleError.ts
export class BusinessRuleError extends DomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
  readonly statusCode = 422;

  constructor(message: string) {
    super(message);
  }
}
```

### Result Pattern

```typescript
// domain/types/Result.ts
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export const Result = {
  ok<T>(data: T): Result<T, never> {
    return { success: true, data };
  },

  fail<E>(error: E): Result<never, E> {
    return { success: false, error };
  },

  isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
    return result.success;
  },

  isFail<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return !result.success;
  },
};
```

---

## Camada: Infrastructure (shared/repositories/)

### Interface do Repository

```typescript
// shared/repositories/interfaces/ITaskRepository.ts
import { Task, CreateTaskDTO } from '@/entities/task';
import { Result } from '@/domain/types/Result';
import { NotFoundError } from '@/domain/errors';

export interface ITaskRepository {
  findById(id: string): Promise<Result<Task, NotFoundError>>;
  findByAssignee(userId: string): Promise<Result<Task[], Error>>;
  findAll(): Promise<Result<Task[], Error>>;
  create(data: CreateTaskDTO): Promise<Result<Task, Error>>;
  update(id: string, data: Partial<Task>): Promise<Result<Task, NotFoundError>>;
  delete(id: string): Promise<Result<void, NotFoundError>>;
}
```

### Implementacao Supabase

```typescript
// shared/repositories/supabase/TaskRepository.ts
import { supabase } from '@/shared/lib/supabase';
import { Task, TaskSchema, CreateTaskDTO } from '@/entities/task';
import { ITaskRepository } from '../interfaces/ITaskRepository';
import { Result } from '@/domain/types/Result';
import { NotFoundError } from '@/domain/errors';

export class TaskRepository implements ITaskRepository {
  async findById(id: string): Promise<Result<Task, NotFoundError>> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return Result.fail(new NotFoundError('Task', id));
    }

    const task = TaskSchema.parse(data);
    return Result.ok(task);
  }

  async findByAssignee(userId: string): Promise<Result<Task[], Error>> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assignee_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return Result.fail(new Error(error.message));
    }

    const tasks = data.map((row) => TaskSchema.parse(row));
    return Result.ok(tasks);
  }

  async create(dto: CreateTaskDTO): Promise<Result<Task, Error>> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: dto.title,
        description: dto.description,
        status: dto.status,
        assignee_id: dto.assigneeId,
        due_date: dto.dueDate,
      })
      .select()
      .single();

    if (error) {
      return Result.fail(new Error(error.message));
    }

    const task = TaskSchema.parse(data);
    return Result.ok(task);
  }

  async update(id: string, dto: Partial<Task>): Promise<Result<Task, NotFoundError>> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: dto.title,
        description: dto.description,
        status: dto.status,
        assignee_id: dto.assigneeId,
        due_date: dto.dueDate,
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return Result.fail(new NotFoundError('Task', id));
    }

    const task = TaskSchema.parse(data);
    return Result.ok(task);
  }

  async delete(id: string): Promise<Result<void, NotFoundError>> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      return Result.fail(new NotFoundError('Task', id));
    }

    return Result.ok(undefined);
  }
}

// Singleton para uso na app
export const taskRepository = new TaskRepository();
```

---

## Camada: Application (features/*/useCases/)

### Use Case Pattern

```typescript
// features/tasks/useCases/createTask.ts
import { CreateTaskDTO, TaskSchema } from '@/entities/task';
import { TaskRules } from '@/entities/task/rules';
import { ITaskRepository } from '@/shared/repositories/interfaces';
import { Result } from '@/domain/types/Result';
import { ValidationError, BusinessRuleError } from '@/domain/errors';

interface CreateTaskInput {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
}

export class CreateTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(input: CreateTaskInput): Promise<Result<Task, Error>> {
    // 1. Validar input
    const validation = CreateTaskSchema.safeParse({
      ...input,
      status: 'pending',
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return Result.fail(
        new ValidationError(firstError.message, firstError.path.join('.'))
      );
    }

    // 2. Aplicar regras de negocio
    if (input.dueDate && new Date(input.dueDate) < new Date()) {
      return Result.fail(
        new BusinessRuleError('Due date cannot be in the past')
      );
    }

    // 3. Persistir
    const result = await this.taskRepository.create(validation.data);

    return result;
  }
}

// Factory function para injecao de dependencia
import { taskRepository } from '@/shared/repositories/supabase';

export const createTask = (input: CreateTaskInput) => {
  const useCase = new CreateTaskUseCase(taskRepository);
  return useCase.execute(input);
};
```

### Use Case com Regras de Dominio

```typescript
// features/tasks/useCases/updateTaskStatus.ts
import { Task, TaskStatus } from '@/entities/task';
import { TaskRules } from '@/entities/task/rules';
import { ITaskRepository } from '@/shared/repositories/interfaces';
import { Result } from '@/domain/types/Result';
import { BusinessRuleError, NotFoundError } from '@/domain/errors';

interface UpdateTaskStatusInput {
  taskId: string;
  newStatus: TaskStatus;
}

export class UpdateTaskStatusUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(input: UpdateTaskStatusInput): Promise<Result<Task, Error>> {
    // 1. Buscar task
    const findResult = await this.taskRepository.findById(input.taskId);
    if (!findResult.success) {
      return findResult;
    }

    const task = findResult.data;

    // 2. Validar transicao de status (regra de dominio)
    if (!TaskRules.canTransitionTo(task, input.newStatus)) {
      return Result.fail(
        new BusinessRuleError(
          `Cannot transition from ${task.status} to ${input.newStatus}`
        )
      );
    }

    // 3. Atualizar
    const updateResult = await this.taskRepository.update(input.taskId, {
      status: input.newStatus,
    });

    return updateResult;
  }
}
```

---

## Camada: Presentation (hooks que usam Use Cases)

```typescript
// features/tasks/hooks/useCreateTask.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask } from '../useCases/createTask';
import { Result } from '@/domain/types/Result';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    },
  });
}

// Uso no componente
function TaskForm() {
  const createTask = useCreateTask();

  const handleSubmit = async (data: FormData) => {
    const result = await createTask.mutateAsync({
      title: data.title,
      description: data.description,
    });

    if (result.success) {
      toast.success('Task created');
    } else {
      // Erro tipado!
      if (result.error instanceof ValidationError) {
        form.setError(result.error.field, { message: result.error.message });
      } else {
        toast.error(result.error.message);
      }
    }
  };
}
```

---

## Regras de Dependencia

### Hierarquia Atualizada

```
PRESENTATION (app/, components/, features/*/components/, features/*/hooks/)
      │
      ▼
APPLICATION (features/*/useCases/)
      │
      ▼
DOMAIN (entities/, domain/)
      │
      ▼
INFRASTRUCTURE (shared/repositories/, shared/services/, shared/lib/)
```

### Matriz de Dependencias

| Camada | Pode importar de | NAO pode importar de |
|--------|------------------|----------------------|
| `app/` | Tudo exceto infra direta | `shared/repositories/supabase/` |
| `features/*/components/` | hooks, entities, domain | useCases, repositories |
| `features/*/hooks/` | useCases, entities, domain | repositories direto |
| `features/*/useCases/` | entities, domain, interfaces | implementacoes concretas* |
| `entities/` | domain | features, shared, app |
| `domain/` | Nada (core) | Tudo |
| `shared/repositories/interfaces/` | entities, domain | implementacoes |
| `shared/repositories/supabase/` | interfaces, entities, lib | features |

*Use Cases recebem repositories via injecao de dependencia

---

## Injecao de Dependencia

### Simples (Factory Functions)

```typescript
// features/tasks/useCases/index.ts
import { taskRepository } from '@/shared/repositories/supabase';
import { CreateTaskUseCase } from './createTask';
import { UpdateTaskStatusUseCase } from './updateTaskStatus';

// Exporta instancias pre-configuradas
export const createTask = (input) => new CreateTaskUseCase(taskRepository).execute(input);
export const updateTaskStatus = (input) => new UpdateTaskStatusUseCase(taskRepository).execute(input);
```

### Com Container (projetos maiores)

```typescript
// shared/di/container.ts
import { TaskRepository } from '@/shared/repositories/supabase';
import { CreateTaskUseCase } from '@/features/tasks/useCases/createTask';

class Container {
  private instances = new Map();

  get taskRepository(): ITaskRepository {
    if (!this.instances.has('taskRepository')) {
      this.instances.set('taskRepository', new TaskRepository());
    }
    return this.instances.get('taskRepository');
  }

  get createTaskUseCase(): CreateTaskUseCase {
    return new CreateTaskUseCase(this.taskRepository);
  }
}

export const container = new Container();
```

---

## Testes

### Testando Use Cases (sem Supabase)

```typescript
// features/tasks/useCases/__tests__/createTask.test.ts
import { describe, it, expect, vi } from 'vitest';
import { CreateTaskUseCase } from '../createTask';
import { ITaskRepository } from '@/shared/repositories/interfaces';
import { Result } from '@/domain/types/Result';

describe('CreateTaskUseCase', () => {
  const mockRepository: ITaskRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findByAssignee: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  it('creates task with valid input', async () => {
    const mockTask = { id: '1', title: 'Test', status: 'pending' };
    mockRepository.create.mockResolvedValue(Result.ok(mockTask));

    const useCase = new CreateTaskUseCase(mockRepository);
    const result = await useCase.execute({ title: 'Test' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockTask);
  });

  it('fails with past due date', async () => {
    const useCase = new CreateTaskUseCase(mockRepository);
    const result = await useCase.execute({
      title: 'Test',
      dueDate: '2020-01-01T00:00:00Z',
    });

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('past');
  });
});
```

---

## Checklist de Implementacao

### Nova Feature

1. [ ] Criar entity em `entities/[nome]/`
   - [ ] `model.ts` com Zod schema
   - [ ] `rules.ts` com regras de dominio
2. [ ] Criar repository interface em `shared/repositories/interfaces/`
3. [ ] Criar repository implementation em `shared/repositories/supabase/`
4. [ ] Criar use cases em `features/[nome]/useCases/`
5. [ ] Criar hooks em `features/[nome]/hooks/`
6. [ ] Criar componentes em `features/[nome]/components/`
7. [ ] Exportar public API em `features/[nome]/index.ts`
8. [ ] Adicionar rotas em `app/router/`
9. [ ] Escrever testes para use cases

### Novo Erro de Dominio

1. [ ] Criar classe em `domain/errors/`
2. [ ] Definir `code` e `statusCode`
3. [ ] Exportar em `domain/errors/index.ts`
4. [ ] Tratar nos use cases
5. [ ] Mapear para UI nos hooks/componentes
