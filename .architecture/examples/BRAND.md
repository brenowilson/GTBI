# Brand Manual

Preencha as informacoes abaixo. Campos marcados com (opcional) podem ser deixados em branco.

---

## 1. Identidade

**Nome do produto:**
>

**Tagline:** (opcional)
>

**Personalidade da marca** (escolha de 3 a 10):
- [ ] Moderno
- [ ] Minimalista
- [ ] Profissional
- [ ] Divertido
- [ ] Acolhedor
- [ ] Ousado
- [ ] Premium
- [ ] Acessivel
- [ ] Tecnico
- [ ] Jovem
- [ ] Sofisticado
- [ ] Corporativo
- [ ] Criativo
- [ ] Confiavel
- [ ] Inovador
- [ ] Outros: _______________ (separar por virgula)

---

## 2. Logo

Os arquivos devem estar na pasta `assets/`:
- `assets/logo.png` (fundo transparente)
- `assets/logo-bg.png` (com fundo solido)
- `assets/og-image.png` (1200x630, para redes sociais)

**Dimensoes minimas da logo:**
| Propriedade | Valor |
|-------------|-------|
| Largura minima | _____ px |
| Altura minima | _____ px |

---

## 3. Cores

### Cores Principais

| Cor | Nome | Hex |
|-----|------|-----|
| **Background** | | # |
| **Titulos** | | # |
| **Paragrafos** | | # |
| **Destaques** | | # |
| **Highlights** | | # |

### Gradient (opcional)

**Tem gradient?**
- [ ] Sim
- [ ] Nao

Se sim, preencha:

| Campo | Valor |
|-------|-------|
| Hex inicio | # |
| Hex fim | # |
| Tipo | linear / radial / conic |
| Direcao | to right / to bottom / 45deg / etc. |

---

## 4. Tipografia

### Fontes

| Uso | Nome da Fonte |
|-----|---------------|
| **Primaria** (titulos) | |
| **Secundaria** (corpo) | |

### Hierarquia

#### H1 (Titulo Principal)

| Propriedade | Valor |
|-------------|-------|
| Tamanho | _____ px |
| Peso (weight) | 400 / 500 / 600 / 700 / 800 / 900 |
| Tracking | _____ % (pode ser negativo) |
| Line-height | _____ |
| Letter-spacing | _____ em |

#### H2 (Subtitulo)

| Propriedade | Valor |
|-------------|-------|
| Tamanho | _____ px |
| Peso (weight) | 400 / 500 / 600 / 700 / 800 / 900 |
| Tracking | _____ % |
| Line-height | _____ |
| Letter-spacing | _____ em |

#### Body (Texto Corrido)

| Propriedade | Valor |
|-------------|-------|
| Tamanho | _____ px |
| Peso (weight) | 400 / 500 / 600 |
| Tracking | _____ % |
| Line-height | _____ |
| Letter-spacing | _____ em |

---

## 5. Bordas e Linhas

### Cores de Borda

| Estado | Cor (RGBA) |
|--------|------------|
| Padrao | rgba( , , , ) |
| Ativa/Focus | rgba( , , , ) |

### Espessura

| Propriedade | Valor |
|-------------|-------|
| Espessura padrao | _____ px |

### Divisor (opcional)

| Propriedade | Valor |
|-------------|-------|
| Espessura | _____ px |
| Opacidade | _____ (0 a 1, opcional - usa cor de destaque) |

### Border Radius Padrao

- [ ] 0px (quadrado)
- [ ] 4px (leve)
- [ ] 8px (moderado)
- [ ] 12px (arredondado)
- [ ] 16px (bem arredondado)
- [ ] 9999px (pill/circular)
- [ ] Outro: _____ px

---

## 6. Sombras

### Sombra Padrao

| Propriedade | Valor |
|-------------|-------|
| Offset X | _____ px |
| Offset Y | _____ px |
| Blur | _____ px |
| Spread | _____ px |
| Cor | rgba( , , , ) |

### Sombra Elevada (cards, modals)

| Propriedade | Valor |
|-------------|-------|
| Offset X | _____ px |
| Offset Y | _____ px |
| Blur | _____ px |
| Spread | _____ px |
| Cor | rgba( , , , ) |

---

## 7. Cards e Superficies

| Propriedade | Valor |
|-------------|-------|
| Background | rgba( , , , ) |
| Blur (glass effect) | _____ px (opcional) |
| Border Radius | _____ px (se vazio, usa radius padrao) |

---

## 8. Tom de Voz

**Como a marca se comunica:**
- [ ] Semi-formal (claro e amigavel)
- [ ] Formal (profissional)
- [ ] Casual (descontraido)
- [ ] Tecnico (preciso)
- [ ] Outros: _______________ (separar por virgula)

**Uso de emojis:**
- [ ] Nunca
- [ ] Raramente (so em celebracoes)
- [ ] Moderado

---

## Pronto!

O agente vai gerar automaticamente:
- Paleta completa com variacoes (light/dark mode)
- Cores de feedback (erro, sucesso, alerta) baseadas no contexto
- Mensagens de erro adequadas ao tom de voz e personalidade
- Escala completa de tipografia (h3, h4, h5, h6, small, etc.)
- Espacamentos padronizados
- Tokens para Tailwind CSS
- Analise da logo para validacao de cores

Todas as cores de UI (muted, input, ring, etc.) serao derivadas das cores principais informadas, seguindo boas praticas de acessibilidade (contraste WCAG AA).
