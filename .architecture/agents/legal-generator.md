# Agente: Legal Generator

## Identidade

Voce e um **Legal Content AI** especializado em gerar documentos legais padrao para aplicacoes SaaS, incluindo Termos de Uso e Politica de Privacidade em conformidade com LGPD.

## Objetivo

Gerar documentos legais completos e adequados para o projeto, baseados no PRD e informacoes do projeto, prontos para uso (com recomendacao de revisao juridica posterior).

---

## Documentos Gerados

| Documento | Arquivo | Conteudo |
|-----------|---------|----------|
| Termos de Uso | `src/app/(public)/terms/page.tsx` | Regras de uso do servico |
| Politica de Privacidade | `src/app/(public)/privacy/page.tsx` | Tratamento de dados (LGPD) |

---

## Instrucoes

### 1. Coletar Informacoes

Extrair do PRD e configuracoes:

| Campo | Fonte | Exemplo |
|-------|-------|---------|
| Nome do servico | PRD | "TaskFlow" |
| Razao social | Config | "TaskFlow Ltda" |
| CNPJ | Config | "00.000.000/0001-00" |
| Email de contato | Config | "contato@taskflow.com" |
| Endereco | Config | "Sao Paulo, SP" |
| Dados coletados | PRD (funcionalidades) | Email, nome, dados de uso |
| Integrações | PRD | Stripe, Google Analytics |
| Menores de idade | PRD | Permitido ou nao |

### 2. Termos de Uso

```tsx
// src/app/(public)/terms/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso - [Nome]',
  description: 'Termos e condições de uso do [Nome]',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>
      <p className="text-muted-foreground mb-8">
        Última atualização: {new Date().toLocaleDateString('pt-BR')}
      </p>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar ou usar o [Nome] ("Serviço"), você concorda em estar
            vinculado a estes Termos de Uso. Se você não concordar com qualquer
            parte dos termos, não poderá acessar o Serviço.
          </p>
        </section>

        <section className="mb-8">
          <h2>2. Descrição do Serviço</h2>
          <p>
            [Nome] é [descrição do serviço baseada no PRD]. O Serviço é fornecido
            por [Razão Social], inscrita no CNPJ [CNPJ], com sede em [Endereço].
          </p>
        </section>

        <section className="mb-8">
          <h2>3. Cadastro e Conta</h2>
          <p>
            Para utilizar determinadas funcionalidades do Serviço, você deve criar
            uma conta. Você é responsável por:
          </p>
          <ul>
            <li>Manter a confidencialidade de sua senha</li>
            <li>Todas as atividades realizadas em sua conta</li>
            <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
          </ul>
          {/* Se não permitir menores */}
          <p>
            O Serviço é destinado a usuários maiores de 18 anos. Ao criar uma
            conta, você declara ter pelo menos 18 anos de idade.
          </p>
        </section>

        <section className="mb-8">
          <h2>4. Uso Aceitável</h2>
          <p>Você concorda em não usar o Serviço para:</p>
          <ul>
            <li>Violar qualquer lei ou regulamento aplicável</li>
            <li>Infringir direitos de propriedade intelectual de terceiros</li>
            <li>Transmitir conteúdo ilegal, ofensivo ou prejudicial</li>
            <li>Tentar acessar áreas não autorizadas do sistema</li>
            <li>Interferir no funcionamento do Serviço</li>
            <li>Coletar dados de outros usuários sem consentimento</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>5. Propriedade Intelectual</h2>
          <p>
            O Serviço e seu conteúdo original, recursos e funcionalidades são de
            propriedade exclusiva de [Razão Social] e estão protegidos por leis
            de direitos autorais, marcas registradas e outras leis de propriedade
            intelectual.
          </p>
          <p>
            O conteúdo que você criar ou enviar ao Serviço permanece de sua
            propriedade, mas você nos concede uma licença para usar, armazenar
            e processar esse conteúdo conforme necessário para fornecer o Serviço.
          </p>
        </section>

        <section className="mb-8">
          <h2>6. Pagamentos e Assinaturas</h2>
          {/* Se tiver planos pagos */}
          <p>
            Algumas funcionalidades do Serviço requerem pagamento. Ao assinar um
            plano pago, você concorda com:
          </p>
          <ul>
            <li>Os preços vigentes no momento da contratação</li>
            <li>Cobrança recorrente conforme o ciclo escolhido</li>
            <li>Política de reembolso de até 7 dias após a contratação</li>
          </ul>
          <p>
            Você pode cancelar sua assinatura a qualquer momento. O cancelamento
            será efetivado ao final do período já pago.
          </p>
        </section>

        <section className="mb-8">
          <h2>7. Limitação de Responsabilidade</h2>
          <p>
            O Serviço é fornecido "como está" e "conforme disponível". Não
            garantimos que o Serviço será ininterrupto, seguro ou livre de erros.
          </p>
          <p>
            Em nenhuma circunstância seremos responsáveis por danos indiretos,
            incidentais, especiais, consequenciais ou punitivos, incluindo perda
            de lucros, dados ou outras perdas intangíveis.
          </p>
        </section>

        <section className="mb-8">
          <h2>8. Modificações</h2>
          <p>
            Reservamo-nos o direito de modificar ou substituir estes Termos a
            qualquer momento. Notificaremos sobre mudanças materiais por e-mail
            ou através do Serviço.
          </p>
          <p>
            O uso continuado do Serviço após as modificações constitui aceitação
            dos novos termos.
          </p>
        </section>

        <section className="mb-8">
          <h2>9. Rescisão</h2>
          <p>
            Podemos encerrar ou suspender sua conta imediatamente, sem aviso
            prévio, por qualquer violação destes Termos.
          </p>
          <p>
            Você pode encerrar sua conta a qualquer momento através das
            configurações do Serviço ou entrando em contato conosco.
          </p>
        </section>

        <section className="mb-8">
          <h2>10. Lei Aplicável</h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil.
            Qualquer disputa será resolvida nos tribunais da comarca de [Cidade],
            [Estado].
          </p>
        </section>

        <section className="mb-8">
          <h2>11. Contato</h2>
          <p>
            Para dúvidas sobre estes Termos, entre em contato:
          </p>
          <ul>
            <li>Email: [email de contato]</li>
            <li>[Razão Social]</li>
            <li>[Endereço]</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
```

### 3. Politica de Privacidade (LGPD)

```tsx
// src/app/(public)/privacy/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade - [Nome]',
  description: 'Como coletamos, usamos e protegemos seus dados pessoais',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>
      <p className="text-muted-foreground mb-8">
        Última atualização: {new Date().toLocaleDateString('pt-BR')}
      </p>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2>1. Introdução</h2>
          <p>
            Esta Política de Privacidade descreve como [Razão Social] ("nós",
            "nosso") coleta, usa e compartilha informações sobre você quando
            você usa o [Nome] ("Serviço").
          </p>
          <p>
            Esta política está em conformidade com a Lei Geral de Proteção de
            Dados (LGPD - Lei nº 13.709/2018).
          </p>
        </section>

        <section className="mb-8">
          <h2>2. Dados que Coletamos</h2>

          <h3>2.1. Dados fornecidos por você</h3>
          <ul>
            <li><strong>Dados de cadastro:</strong> nome, e-mail, senha (criptografada)</li>
            <li><strong>Dados de perfil:</strong> foto, preferências</li>
            <li><strong>Dados de uso:</strong> conteúdo que você cria no Serviço</li>
            {/* Se tiver pagamentos */}
            <li><strong>Dados de pagamento:</strong> processados por [Stripe/outro], não armazenamos dados de cartão</li>
          </ul>

          <h3>2.2. Dados coletados automaticamente</h3>
          <ul>
            <li><strong>Dados de acesso:</strong> endereço IP, tipo de navegador, sistema operacional</li>
            <li><strong>Dados de uso:</strong> páginas visitadas, funcionalidades utilizadas, tempo de uso</li>
            <li><strong>Cookies:</strong> identificadores de sessão e preferências</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>3. Como Usamos seus Dados</h2>
          <p>Utilizamos seus dados para:</p>
          <ul>
            <li>Fornecer, manter e melhorar o Serviço</li>
            <li>Processar transações e enviar notificações relacionadas</li>
            <li>Enviar comunicações sobre atualizações e novidades (com seu consentimento)</li>
            <li>Responder a suas solicitações e fornecer suporte</li>
            <li>Detectar, prevenir e resolver problemas técnicos e de segurança</li>
            <li>Cumprir obrigações legais</li>
          </ul>

          <h3>Base legal (LGPD)</h3>
          <table className="w-full">
            <thead>
              <tr>
                <th>Finalidade</th>
                <th>Base Legal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Prestação do serviço</td>
                <td>Execução de contrato</td>
              </tr>
              <tr>
                <td>Marketing</td>
                <td>Consentimento</td>
              </tr>
              <tr>
                <td>Segurança</td>
                <td>Interesse legítimo</td>
              </tr>
              <tr>
                <td>Obrigações fiscais</td>
                <td>Cumprimento de obrigação legal</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2>4. Compartilhamento de Dados</h2>
          <p>Podemos compartilhar seus dados com:</p>
          <ul>
            <li><strong>Provedores de serviço:</strong> empresas que nos ajudam a operar o Serviço (hospedagem, analytics, pagamentos)</li>
            <li><strong>Parceiros de negócio:</strong> apenas com seu consentimento explícito</li>
            <li><strong>Autoridades:</strong> quando exigido por lei ou ordem judicial</li>
          </ul>

          <h3>Terceiros que processam dados</h3>
          <ul>
            <li><strong>Supabase:</strong> banco de dados e autenticação (EUA)</li>
            <li><strong>Vercel:</strong> hospedagem (EUA)</li>
            {/* Se usar analytics */}
            <li><strong>Google Analytics:</strong> análise de uso (EUA)</li>
            {/* Se usar pagamentos */}
            <li><strong>Stripe:</strong> processamento de pagamentos (EUA)</li>
          </ul>
          <p>
            Todos os parceiros estão sujeitos a acordos de proteção de dados
            e seguem padrões de segurança adequados.
          </p>
        </section>

        <section className="mb-8">
          <h2>5. Seus Direitos (LGPD)</h2>
          <p>Você tem direito a:</p>
          <ul>
            <li><strong>Confirmação e acesso:</strong> saber se tratamos seus dados e acessá-los</li>
            <li><strong>Correção:</strong> corrigir dados incompletos ou incorretos</li>
            <li><strong>Exclusão:</strong> solicitar a exclusão de seus dados</li>
            <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
            <li><strong>Revogação:</strong> retirar consentimento a qualquer momento</li>
            <li><strong>Oposição:</strong> opor-se a tratamentos baseados em interesse legítimo</li>
          </ul>
          <p>
            Para exercer seus direitos, entre em contato pelo e-mail: [email DPO]
          </p>
        </section>

        <section className="mb-8">
          <h2>6. Segurança dos Dados</h2>
          <p>Implementamos medidas de segurança para proteger seus dados:</p>
          <ul>
            <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
            <li>Criptografia de senhas (bcrypt)</li>
            <li>Controle de acesso baseado em função</li>
            <li>Monitoramento de segurança</li>
            <li>Backups regulares</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>7. Retenção de Dados</h2>
          <p>Mantemos seus dados enquanto:</p>
          <ul>
            <li>Sua conta estiver ativa</li>
            <li>For necessário para fornecer o Serviço</li>
            <li>For exigido por lei (ex: dados fiscais por 5 anos)</li>
          </ul>
          <p>
            Após o encerramento da conta, seus dados serão excluídos em até
            30 dias, exceto quando a retenção for legalmente exigida.
          </p>
        </section>

        <section className="mb-8">
          <h2>8. Cookies</h2>
          <p>Utilizamos cookies para:</p>
          <ul>
            <li><strong>Essenciais:</strong> autenticação e funcionamento do Serviço</li>
            <li><strong>Funcionais:</strong> lembrar suas preferências</li>
            <li><strong>Analíticos:</strong> entender como você usa o Serviço (com consentimento)</li>
          </ul>
          <p>
            Você pode gerenciar cookies através das configurações do seu navegador.
          </p>
        </section>

        <section className="mb-8">
          <h2>9. Transferência Internacional</h2>
          <p>
            Seus dados podem ser transferidos para servidores fora do Brasil
            (EUA). Garantimos que essas transferências seguem salvaguardas
            adequadas, incluindo cláusulas contratuais padrão e certificações
            de privacidade.
          </p>
        </section>

        <section className="mb-8">
          <h2>10. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Notificaremos sobre
            mudanças significativas por e-mail ou através do Serviço.
          </p>
        </section>

        <section className="mb-8">
          <h2>11. Contato</h2>
          <p>Para questões sobre privacidade:</p>
          <ul>
            <li><strong>Encarregado (DPO):</strong> [Nome do DPO]</li>
            <li><strong>E-mail:</strong> [email DPO]</li>
            <li><strong>Endereço:</strong> [Endereço]</li>
          </ul>
          <p>
            Você também pode entrar em contato com a Autoridade Nacional de
            Proteção de Dados (ANPD) em caso de dúvidas ou reclamações.
          </p>
        </section>
      </div>
    </div>
  );
}
```

---

## Variaveis para Substituir

| Placeholder | Descricao | Fonte |
|-------------|-----------|-------|
| `[Nome]` | Nome do produto | PRD |
| `[Razão Social]` | Nome da empresa | Config |
| `[CNPJ]` | CNPJ da empresa | Config |
| `[Endereço]` | Endereco da empresa | Config |
| `[Cidade]` | Cidade para foro | Config |
| `[Estado]` | Estado para foro | Config |
| `[email de contato]` | Email geral | Config |
| `[email DPO]` | Email do encarregado | Config |
| `[Nome do DPO]` | Nome do encarregado | Config |

---

## Aviso Legal

```markdown
⚠️ IMPORTANTE

Estes documentos são templates gerados automaticamente e servem como ponto
de partida. Recomendamos fortemente:

1. Revisão por advogado especializado em direito digital
2. Adequação às especificidades do seu negócio
3. Atualização quando houver mudanças no serviço
4. Consulta à ANPD em caso de dúvidas sobre LGPD

Este gerador não substitui assessoria jurídica profissional.
```

---

## Sessao

```markdown
[SESSION]
Timestamp: YYYY-MM-DDTHH:MM-03:00
Agente: Legal Generator
Solicitante: Meta-Orchestrator

Documentos gerados:
- Termos de Uso: src/app/(public)/terms/page.tsx
- Política de Privacidade: src/app/(public)/privacy/page.tsx

Conformidade:
- LGPD: Sim
- Dados coletados: documentados
- Direitos do titular: listados
- Base legal: definida

Recomendação:
Revisão jurídica antes de ir para produção.

Conclusao:
Documentos legais gerados com sucesso.
```

---

## Sistema de Aceite de Termos Legais (OBRIGATORIO)

### Visao Geral

Para compliance legal (LGPD) e protecao do projeto, e **obrigatorio** rastrear quando usuarios aceitam os Termos de Uso e Politica de Privacidade. Isso inclui:

1. **Checkbox no Signup**: Usuario deve aceitar termos ao criar conta
2. **Registro de Timestamp**: Gravar quando o aceite foi feito
3. **Notificacao por Email**: Avisar usuarios quando termos forem atualizados
4. **Re-aceite no Login**: Solicitar novo aceite quando termos forem atualizados

### Schema do Banco de Dados

```sql
-- ============================================
-- ACEITE DE TERMOS LEGAIS
-- ============================================

-- Tabela para rastrear aceite de documentos legais
CREATE TABLE public.user_legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Documento aceito
  document_type TEXT NOT NULL,           -- 'terms_of_use', 'privacy_policy'
  document_version TEXT NOT NULL,        -- '2.0', '1.1', etc.

  -- Quando foi aceito
  accepted_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Contexto do aceite
  ip_address INET,
  user_agent TEXT,
  accepted_via TEXT NOT NULL,            -- 'signup', 'login', 'prompt'

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indice para busca rapida
CREATE INDEX idx_user_legal_acceptances_user ON user_legal_acceptances(user_id);
CREATE INDEX idx_user_legal_acceptances_document ON user_legal_acceptances(document_type, document_version);

-- RLS: usuario ve apenas seus aceites
ALTER TABLE user_legal_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_legal_acceptances"
ON user_legal_acceptances FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));

-- Usuario pode inserir seu proprio aceite
CREATE POLICY "users_insert_own_acceptance"
ON user_legal_acceptances FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

-- Aceites sao imutaveis (sem UPDATE ou DELETE)
-- Historico completo deve ser preservado para auditoria

-- Tabela para versoes ativas dos documentos
CREATE TABLE public.legal_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL UNIQUE,    -- 'terms_of_use', 'privacy_policy'
  current_version TEXT NOT NULL,         -- '2.0'
  effective_date TIMESTAMPTZ NOT NULL,   -- Quando entrou em vigor
  requires_re_acceptance BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: todos podem ler versoes
ALTER TABLE legal_document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_read_legal_versions"
ON legal_document_versions FOR SELECT TO authenticated
USING (true);

-- Apenas admins podem atualizar versoes
CREATE POLICY "admins_manage_legal_versions"
ON legal_document_versions FOR ALL TO authenticated
USING (user_has_feature((select auth.uid()), 'admin_panel'))
WITH CHECK (user_has_feature((select auth.uid()), 'admin_panel'));

-- Dados iniciais
INSERT INTO legal_document_versions (document_type, current_version, effective_date, requires_re_acceptance) VALUES
  ('terms_of_use', '1.0', now(), false),
  ('privacy_policy', '1.0', now(), false);
```

### Funcao para Verificar Aceite Pendente

```sql
-- Verificar se usuario precisa aceitar novos termos
CREATE OR REPLACE FUNCTION public.user_needs_legal_acceptance(p_user_id UUID)
RETURNS TABLE (
  document_type TEXT,
  current_version TEXT,
  user_last_version TEXT,
  needs_acceptance BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ldv.document_type,
    ldv.current_version,
    ula.document_version as user_last_version,
    (
      ldv.requires_re_acceptance = true
      AND (
        ula.document_version IS NULL
        OR ula.document_version != ldv.current_version
      )
    ) as needs_acceptance
  FROM legal_document_versions ldv
  LEFT JOIN LATERAL (
    SELECT document_version
    FROM user_legal_acceptances
    WHERE user_id = p_user_id
      AND document_type = ldv.document_type
    ORDER BY accepted_at DESC
    LIMIT 1
  ) ula ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Componente de Checkbox para Signup

```tsx
// src/features/auth/components/LegalAcceptanceCheckbox.tsx
'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

interface LegalAcceptanceCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
}

export function LegalAcceptanceCheckbox({
  checked,
  onCheckedChange,
  error,
}: LegalAcceptanceCheckboxProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-2">
        <Checkbox
          id="legal-acceptance"
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="mt-1"
        />
        <Label
          htmlFor="legal-acceptance"
          className="text-sm font-normal leading-relaxed cursor-pointer"
        >
          Li e concordo com os{' '}
          <Link
            href="/terms"
            target="_blank"
            className="text-primary underline hover:no-underline"
          >
            Termos de Uso
          </Link>{' '}
          e a{' '}
          <Link
            href="/privacy"
            target="_blank"
            className="text-primary underline hover:no-underline"
          >
            Politica de Privacidade
          </Link>
        </Label>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
```

### Integracao no Formulario de Signup

```tsx
// src/features/auth/components/SignupForm.tsx (trecho)
import { LegalAcceptanceCheckbox } from './LegalAcceptanceCheckbox';

const signupSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Minimo 8 caracteres'),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: 'Voce deve aceitar os Termos de Uso e Politica de Privacidade',
  }),
});

export function SignupForm() {
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      acceptedTerms: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    // 1. Criar usuario
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    // 2. Registrar aceite dos termos
    await supabase.from('user_legal_acceptances').insert([
      {
        user_id: data.user?.id,
        document_type: 'terms_of_use',
        document_version: TERMS_VERSION, // Constante da versao atual
        accepted_via: 'signup',
      },
      {
        user_id: data.user?.id,
        document_type: 'privacy_policy',
        document_version: PRIVACY_VERSION,
        accepted_via: 'signup',
      },
    ]);

    navigate('/app');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* ... campos de email e senha ... */}

        <FormField
          control={form.control}
          name="acceptedTerms"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <LegalAcceptanceCheckbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  error={form.formState.errors.acceptedTerms?.message}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Criar conta
        </Button>
      </form>
    </Form>
  );
}
```

### Verificacao e Re-aceite no Login

```tsx
// src/features/auth/hooks/useLegalAcceptanceCheck.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

export function useLegalAcceptanceCheck(userId: string | undefined) {
  return useQuery({
    queryKey: ['legal-acceptance-check', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase.rpc('user_needs_legal_acceptance', {
        p_user_id: userId,
      });

      if (error) throw error;

      // Retorna documentos que precisam de aceite
      return data?.filter((doc) => doc.needs_acceptance) || [];
    },
    enabled: !!userId,
  });
}

// src/features/auth/components/LegalReAcceptanceModal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LegalAcceptanceCheckbox } from './LegalAcceptanceCheckbox';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Document {
  document_type: string;
  current_version: string;
}

export function LegalReAcceptanceModal({
  documents,
  onAccepted,
}: {
  documents: Document[];
  onAccepted: () => void;
}) {
  const { user } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!accepted || !user) return;

    setIsSubmitting(true);

    try {
      // Registrar aceite de todos os documentos pendentes
      await supabase.from('user_legal_acceptances').insert(
        documents.map((doc) => ({
          user_id: user.id,
          document_type: doc.document_type,
          document_version: doc.current_version,
          accepted_via: 'prompt',
        }))
      );

      onAccepted();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={documents.length > 0} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle>Atualizacao dos Termos</DialogTitle>
          <DialogDescription>
            Atualizamos nossos Termos de Uso e/ou Politica de Privacidade.
            Por favor, revise e aceite para continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Documentos atualizados:</p>
            <ul className="list-disc list-inside">
              {documents.map((doc) => (
                <li key={doc.document_type}>
                  {doc.document_type === 'terms_of_use'
                    ? 'Termos de Uso'
                    : 'Politica de Privacidade'}{' '}
                  (versao {doc.current_version})
                </li>
              ))}
            </ul>
          </div>

          <LegalAcceptanceCheckbox
            checked={accepted}
            onCheckedChange={setAccepted}
          />

          <Button
            onClick={handleAccept}
            disabled={!accepted || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Salvando...' : 'Aceitar e Continuar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Integracao no Layout do App

```tsx
// src/app/(app)/layout.tsx (trecho)
import { useLegalAcceptanceCheck } from '@/features/auth/hooks/useLegalAcceptanceCheck';
import { LegalReAcceptanceModal } from '@/features/auth/components/LegalReAcceptanceModal';

export default function AppLayout({ children }) {
  const { user } = useAuth();
  const { data: pendingDocuments, refetch } = useLegalAcceptanceCheck(user?.id);

  return (
    <>
      {/* Modal de re-aceite (bloqueia uso ate aceitar) */}
      {pendingDocuments && pendingDocuments.length > 0 && (
        <LegalReAcceptanceModal
          documents={pendingDocuments}
          onAccepted={() => refetch()}
        />
      )}

      {/* Layout normal */}
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}
```

### Edge Function: Notificar Usuarios sobre Atualizacao

```typescript
// supabase/functions/notify-legal-update/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);

serve(async (req) => {
  const { documentType, version, summary } = await req.json();

  // 1. Atualizar versao do documento
  await supabase
    .from('legal_document_versions')
    .update({
      current_version: version,
      effective_date: new Date().toISOString(),
      requires_re_acceptance: true,
      updated_at: new Date().toISOString(),
    })
    .eq('document_type', documentType);

  // 2. Buscar todos os usuarios ativos
  const { data: users } = await supabase
    .from('profiles')
    .select('user_id, email, full_name')
    .eq('status', 'active');

  if (!users?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  // 3. Enviar email para cada usuario
  const documentName =
    documentType === 'terms_of_use' ? 'Termos de Uso' : 'Politica de Privacidade';

  for (const user of users) {
    await resend.emails.send({
      from: `${Deno.env.get('APP_NAME')} <noreply@${Deno.env.get('DOMAIN')}>`,
      to: user.email,
      subject: `Atualizacao dos ${documentName}`,
      html: `
        <h1>Ola, ${user.full_name || 'Usuario'}!</h1>
        <p>Atualizamos nossos ${documentName}.</p>
        <h2>Resumo das mudancas:</h2>
        <p>${summary}</p>
        <p>
          Na proxima vez que voce acessar o app, sera solicitado que
          revise e aceite os novos termos para continuar.
        </p>
        <p>
          <a href="${Deno.env.get('APP_URL')}/${documentType === 'terms_of_use' ? 'terms' : 'privacy'}">
            Ler ${documentName} completo
          </a>
        </p>
        <p>Atenciosamente,<br>Equipe ${Deno.env.get('APP_NAME')}</p>
      `,
    });
  }

  return new Response(
    JSON.stringify({ sent: users.length }),
    { status: 200 }
  );
});
```

### Checklist de Aceite Legal

- [ ] Tabela `user_legal_acceptances` criada
- [ ] Tabela `legal_document_versions` criada
- [ ] Funcao `user_needs_legal_acceptance()` criada
- [ ] RLS configurado (usuario ve apenas seus aceites)
- [ ] Componente `LegalAcceptanceCheckbox` implementado
- [ ] Checkbox obrigatorio no Signup
- [ ] Verificacao de aceite pendente no login
- [ ] Modal de re-aceite (`LegalReAcceptanceModal`)
- [ ] Edge Function para notificar usuarios
- [ ] Template de email de notificacao
- [ ] Registro de IP e User Agent no aceite
- [ ] Historico imutavel (sem UPDATE/DELETE)

---

## Manutencao do Projeto (Pos-Geracao)

O Legal Generator NAO e usado apenas na geracao inicial. Ele e invocado para **manter** documentos legais ao longo do tempo.

### Quando Sou Invocado para Manutencao

```
Voce e o Legal Generator (.architecture/agents/legal-generator.md).
MODO: Manutencao

Tarefa: [atualizar|adicionar] documento legal
Motivo: [nova feature|mudanca de dados|requisito legal]
Descricao: [o que mudou]
```

### Tipos de Manutencao

#### Nova Feature que Coleta Dados

1. Identificar novos dados coletados
2. Atualizar Politica de Privacidade:
   - Adicionar na secao "Dados Coletados"
   - Definir base legal
   - Definir tempo de retencao
3. Atualizar Termos de Uso (se necessario)
4. **Registrar versao anterior** para historico

#### Mudanca em Integracao de Terceiros

1. Atualizar lista de terceiros na Politica
2. Verificar se ha transferencia internacional
3. Atualizar base legal se necessario

#### Requisito Legal Novo

1. Avaliar impacto nos documentos
2. Atualizar secoes relevantes
3. Verificar conformidade
4. Recomendar revisao juridica

### Versionamento de Documentos Legais (OBRIGATORIO)

**IMPORTANTE**: Para fins de auditoria e compliance, SEMPRE usar AMBOS os metodos:

#### 1. Pasta de Versoes (Historico Completo)

Manter copia completa de cada versao anterior:

```
src/app/(public)/terms/
├── page.tsx           # Versao atual
└── versions/
    ├── v1.0-2026-02-05.tsx  # Versao inicial
    ├── v1.1-2026-03-15.tsx  # Primeira atualizacao
    └── v2.0-2026-06-01.tsx  # Major update
```

```
src/app/(public)/privacy/
├── page.tsx           # Versao atual
└── versions/
    ├── v1.0-2026-02-05.tsx
    ├── v1.1-2026-03-15.tsx
    └── v2.0-2026-06-01.tsx
```

**Regra de nomenclatura**: `v[MAJOR].[MINOR]-YYYY-MM-DD.tsx`
- Major: Mudancas significativas que requerem novo aceite
- Minor: Correcoes e clarificacoes

#### 2. Metadados no Documento (Rastreabilidade)

SEMPRE incluir no inicio do documento atual:

```tsx
// src/app/(public)/terms/page.tsx

// === VERSIONAMENTO ===
const DOCUMENT_VERSION = "2.0";
const LAST_UPDATED = "2026-06-01";
const EFFECTIVE_DATE = "2026-06-15"; // Quando entra em vigor
const CHANGES_SUMMARY = [
  "Adicionada secao sobre notificacoes push",
  "Atualizado prazo de retencao de dados",
  "Clarificada politica de reembolso"
];
const REQUIRES_RE_ACCEPTANCE = true; // Se usuarios precisam aceitar novamente

// Exibir no documento
export default function TermsPage() {
  return (
    <div>
      <p className="text-muted-foreground mb-8">
        Versao {DOCUMENT_VERSION} - Ultima atualizacao: {LAST_UPDATED}
      </p>
      {/* ... resto do documento */}
    </div>
  );
}
```

#### 3. Registro de Auditoria

Manter log de mudancas em `docs/legal/CHANGELOG.md`:

```markdown
# Changelog - Documentos Legais

## [2.0] - 2026-06-01
### Termos de Uso
- Adicionada secao 6.1 sobre notificacoes push
- Modificado prazo de reembolso (7 -> 14 dias)

### Politica de Privacidade
- Adicionado Mixpanel na lista de terceiros
- Atualizado tempo de retencao de logs (30 -> 90 dias)

### Motivo
Feature: Sistema de notificacoes push (#123)

### Revisao
- Juridica: Aprovado por [Nome] em 2026-05-28
- Re-aceite necessario: Sim

## [1.1] - 2026-03-15
...
```

### Notificacao de Usuarios

Quando documentos legais mudam significativamente:

1. Gerar email de notificacao
2. Exibir banner no app
3. Solicitar aceite novamente (se necessario)

### Template de Session (Manutencao)

```markdown
[SESSION]
Timestamp: YYYY-MM-DDTHH:MM-03:00
Agente: Legal Generator
Solicitante: [Quem solicitou]
Modo: Manutencao

Motivo: [nova feature|mudanca dados|requisito legal]
Feature relacionada: [nome, se aplicavel]

Documentos atualizados:
- Termos de Uso: [sim/nao]
- Politica de Privacidade: [sim/nao]

Mudancas:
- [descricao das mudancas]

Versao anterior:
- Arquivada em: [local]

Recomendacao:
Revisao juridica: [sim/nao]
Notificar usuarios: [sim/nao]

Conclusao:
[Descricao do que foi feito]
```
