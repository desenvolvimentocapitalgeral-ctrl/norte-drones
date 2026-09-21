# Norte Drones — Site institucional

Site institucional da Norte Drones (Next.js 14 App Router + TypeScript + Tailwind CSS), construído a partir do Manual de Identidade Visual fornecido (paleta, tipografia Montserrat e conceito de marca).

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # edite as duas variáveis abaixo
npm run dev
```

Abra http://localhost:3000.

### Variáveis de ambiente obrigatórias

| Variável | Para que serve |
|---|---|
| `ADMIN_PASSWORD` | Senha única de acesso ao painel `/admin`. |
| `ADMIN_SESSION_SECRET` | Segredo usado para assinar o cookie de sessão do admin (string aleatória longa). |
| `NEXT_PUBLIC_SITE_URL` | (opcional) URL final do site, usada no SEO/sitemap. |
| `BLOB_READ_WRITE_TOKEN` | (opcional em dev) Token do Vercel Blob, usado para persistir as imagens trocadas em `/admin`. Sem ele, o upload de imagem fica desabilitado e o site usa as imagens estáticas de `public/`. |

Gere um segredo forte, por exemplo: `openssl rand -hex 32`.

## Painel administrativo (`/admin`)

- Login único por senha em `/admin/login` (variável `ADMIN_PASSWORD`).
- Após logar, `/admin` permite editar: WhatsApp (número + mensagem padrão), telefone, e-mail, Instagram (usuário + link), área de atuação e as imagens do site (hero, foto da seção "Sobre", logo clara e logo escura).
- Essas informações alimentam o site inteiro (cabeçalho, hero, seção de contato, rodapé) — não precisa editar código para trocar um número de telefone ou uma foto.

### Persistência — Vercel Blob

Tanto os contatos (texto) quanto as imagens editadas pelo `/admin` **persistem de verdade em produção**, usando o [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) — sem banco de dados:

- Configure `BLOB_READ_WRITE_TOKEN` (crie um Blob Store em Project Settings → Storage na Vercel; em produção a variável é preenchida automaticamente ao conectar o store ao projeto).
- Cada coisa editável é salva sempre no mesmo caminho no Blob (`site/content.json` para os contatos; `site/hero.jpg`, `site/about.jpg`, `site/logo-light.png`, `site/logo-dark.png` para as imagens), sobrescrevendo o anterior — não precisa de banco de dados para lembrar "qual é o valor atual".
- Sem `BLOB_READ_WRITE_TOKEN` configurado (ex.: rodando local sem `.env.local` preenchido), os contatos caem no arquivo `data/site-content.json` e as imagens caem nos arquivos estáticos originais em `public/` — útil para rodar localmente sem depender do Blob.
- Lógica em `lib/content-store.ts` (contatos) e `lib/site-images.ts` + `app/api/admin/images/route.ts` (imagens).

## Estrutura do projeto

```
app/
  page.tsx              # Página inicial (monta todas as seções)
  layout.tsx            # Layout raiz, metadados SEO, fonte Montserrat
  admin/                # Painel administrativo (login + dashboard)
  api/admin/            # Rotas de login/logout/conteúdo do admin
components/             # Seções e componentes de UI reutilizáveis
lib/
  site-data.ts          # Conteúdo textual estático do site (serviços, diferenciais, processo)
  content-store.ts       # Leitura/escrita dos dados editáveis pelo admin
  site-images.ts          # Leitura das imagens editáveis pelo admin (Vercel Blob)
  site-image-fields.ts    # Metadados (chave/label/tipo) das imagens editáveis, usado no admin
  auth.ts                # Autenticação do painel admin (Web Crypto, compatível com Edge)
data/site-content.json  # Dados "seed" (valores iniciais/dev) do admin
middleware.ts           # Protege /admin e /api/admin por sessão
public/brand/           # Logotipos (fundo claro e fundo escuro)
public/images/          # Fotos recortadas dos materiais de marca fornecidos
```

## O que foi construído a partir dos materiais — e o que ainda falta confirmar

Seguindo a instrução de não inventar informação, os pontos abaixo ficaram como **placeholder** e precisam da sua confirmação:

1. **Contatos (WhatsApp, telefone, e-mail, Instagram, endereço)** — nenhum documento trazia esses dados. Preencha em `/admin` antes de publicar; enquanto vazios, os botões de WhatsApp aparecem desabilitados no site.
2. **Área de atuação** — "Porto Nacional, Palmas e região (Tocantins)" veio do briefing de identidade visual (documento da marca "Porto Drones", mesma operação). Confirme se é isso mesmo antes de publicar — está editável em `/admin`.
3. **Serviços** — você confirmou três serviços (não vêm dos materiais originais, foram informados diretamente por você): aplicação de defensivos agrícolas, distribuição de sólidos (adubos e afins) e adubação foliar. Estão implementados em `lib/site-data.ts` (array `services`) e renderizados em `components/Services.tsx`. Descrições e "benefícios" de cada um são redigidos de forma genérica (sem números, sem % de redução de deriva, sem promessa de resultado) — revise o texto se quiser reposicionar algum deles.
4. **Números, clientes, hectares atendidos, certificações, equipamentos, depoimentos** — nada disso está nos materiais, então nada disso está no site. Adicione você mesmo (ou peça) quando tiver esses dados confirmados.
5. **Conflito de identidade visual** — os materiais anexados descreviam duas marcas diferentes ("Norte Drones" e "Porto Drones", com paletas e logos distintos). Este projeto segue a decisão que você confirmou: nome e identidade visual **Norte Drones**. Se isso mudar, a paleta fica centralizada em `tailwind.config.ts` e os logos em `public/brand/`.
6. **Qualidade de imagem (corrigido)** — a versão anterior usava recortes ad-hoc das artes de marketing, esticados além da resolução nativa (upscaling), o que gerava desfoque visível no hero e no header/rodapé. Esta versão usa exports dedicados do kit de marca oficial (`NORTE_DRONES_KIT_COMPLETO`) sem upscaling. **Não existe arte em resolução maior ou vetorial** — confirmado no `LEIA-ME.txt` do próprio kit ("os PNGs foram derivados da prancha fornecida; para impressão em grande formato, o ideal é produzir depois uma versão vetorial/SVG"). Ou seja, o teto de nitidez atual é o teto do material-fonte, não uma escolha de corte.

## Deploy na Vercel

1. Suba este projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Importe o repositório na Vercel.
3. Configure as variáveis de ambiente (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`) em Project Settings → Environment Variables.
4. Crie um Blob Store em Project Settings → Storage e conecte ao projeto (preenche `BLOB_READ_WRITE_TOKEN` automaticamente) para os contatos e as imagens editados pelo `/admin` persistirem.

## Continuando no Claude Code

O projeto é um Next.js padrão — abra a pasta no Claude Code e siga normalmente (`npm install`, `npm run dev`). Não há build steps proprietários nem dependências fora do `package.json`.
