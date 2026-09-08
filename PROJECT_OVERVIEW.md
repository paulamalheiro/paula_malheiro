# 📋 Visão Geral do Projeto: Landing Page & Painel Admin — Paula Malheiro

Este documento serve como referência técnica e de produto para contextualizar qualquer modelo de IA (como o Gemini) e desenvolvedores sobre a arquitetura, regras de negócio e funcionalidades deste projeto.

---

## 1. Visão Geral & Propósito do Projeto
O projeto é um **ecossistema web imobiliário de alta conversão** desenvolvido para **Paula Malheiro** (Corretora de Imóveis, CRECI 21.188), especialista em lançamentos e imóveis na planta em **Vitória da Conquista – Bahia**, com forte atuação em parceria com construtoras de renome (como VCA Construtora, Alphaville, Gráfico Empreendimentos).

O sistema é dividido em duas partes fundamentais:
1. **Landing Page Pública (`/`)**: Focada em posicionamento de autoridade, experiência premium, exibição de empreendimentos, simulação rápida de crédito e conversão direta via WhatsApp.
2. **Painel Administrativo Restrito (`/admin`)**: Sistema de gerenciamento de conteúdo (CMS) protegido por autenticação, permitindo à corretora ou equipe atualizar banners, cadastrar/editar empreendimentos, gerenciar galerias de evolução de obras (fotos e vídeos) e ativar campanhas pop-up sazonais.

---

## 2. Stack Tecnológica

| Camada | Tecnologia / Biblioteca | Função |
| :--- | :--- | :--- |
| **Linguagem & Core** | **TypeScript (~5.8)** + **React 19** | Tipagem estrita e interface declarativa moderna |
| **Bundler & Dev Server** | **Vite 6** | Build ultrarrápido, HMR e otimização de bundle |
| **Estilização** | **TailwindCSS v4** | Design responsivo, moderno e utility-first |
| **Animações** | **Motion (`motion/react`)** | Transições suaves, animações de entrada (scroll/view) e modais |
| **Roteamento** | **React Router DOM v7** | Rotas públicas, rotas protegidas e navegação client-side |
| **Ícones** | **Lucide React** | Conjunto de ícones vetoriais leves e consistentes |
| **Banco & Storage** | **Supabase (Self-hosted / VPS Coolify)** | PostgreSQL, Auth JWT, Row Level Security (RLS) e Storage Bucket |
| **Resiliência** | **LocalStorage + Dados Mockados** | Fallback automático caso o banco de dados não esteja configurado |

---

## 3. Estrutura de Pastas e Arquitetura

```text
site paula/
├── public/                     # Imagens estáticas, logos locais e fallbacks
├── src/
│   ├── assets/                 # Recursos gráficos estáticos
│   ├── components/
│   │   ├── admin/              # Componentes do Painel Administrativo
│   │   │   ├── AdminDashboard.tsx              # Shell principal e tabs do admin
│   │   │   ├── AdminLogin.tsx                  # Tela de autenticação com e-mail/senha
│   │   │   ├── CampaignsManager.tsx            # Gestão de pop-ups (imagem/vídeo até 40s)
│   │   │   ├── ConstructionProgressManager.tsx # Gestão de fotos (até 10) e vídeos (até 2) da obra
│   │   │   ├── ImageUploader.tsx               # Componente de upload com preview e drag-and-drop
│   │   │   ├── PropertiesManager.tsx           # CRUD completo de empreendimentos
│   │   │   └── ProtectedRoute.tsx              # Guarda de rota para páginas restritas
│   │   ├── common/             # Componentes reutilizáveis
│   │   │   ├── CampaignPopup.tsx               # Pop-up promocional na entrada do site
│   │   │   └── SmartImage.tsx                  # Imagem inteligente com fallback automático
│   │   └── landing/            # Componentes da Landing Page Pública
│   │       └── LandingPage.tsx                 # Composição de todas as seções públicas
│   ├── context/
│   │   └── AuthContext.tsx     # Estado global de autenticação (Supabase Auth / Local Dev)
│   ├── hooks/
│   │   ├── useBanners.ts       # Hook de carregamento e mutação de banners
│   │   ├── useCampaigns.ts     # Hook de gestão de campanhas promocionais ativas
│   │   └── useProperties.ts    # Hook de empreendimentos (destaques e obras)
│   ├── lib/
│   │   ├── propertiesData.ts   # Catálogo inicial de dados estáticos para fallback
│   │   └── supabase.ts         # Cliente Supabase, helpers de storage e chamadas CRUD
│   ├── types/
│   │   ├── banner.ts           # Interfaces de tipagem para banners e seções
│   │   └── property.ts         # Interfaces de tipagem para empreendimentos e campanhas
│   ├── App.tsx                 # Configuração de rotas da aplicação
│   ├── index.css               # Importação Tailwind e estilos globais
│   └── main.tsx                # Ponto de entrada React
├── supabase_schema.sql         # Script SQL de criação de tabelas, RLS e dados padrão
├── .env.example                # Template de variáveis de ambiente do Supabase
├── package.json
└── vite.config.ts
```

---

## 4. Módulos & Funcionalidades

### 4.1. Landing Page Pública (`/`)

1. **Navbar Fixa**:
   - Logotipo da corretora com badge do CRECI e logotipo da VCA Construtora.
   - Navegação ancorada suave: *Início*, *Empreendimentos*, *Simulação*, *Evolução das Obras*, *Sobre Mim*, *Contato*.
   - Acesso rápido às redes (Instagram oficial e WhatsApp com CTA em destaque).
   - Menu hambúrguer animado no mobile com atalho para o painel administrativo.

2. **Hero Section (Topo)**:
   - Apresentação de impacto ("a compra do seu imóvel como uma experiência segura e transparente!").
   - Tag de destaque personalizável (ex: *Especialista em Imóveis na Planta*).
   - Fotografia profissional de destaque com tratamento visual elegante.
   - Botão de ação para rolagem suave até os empreendimentos e link direto de agendamento via WhatsApp.

3. **Empreendimentos em Destaque (`#projects`)**:
   - Grade responsiva com cards elegantes dos lançamentos imobiliários.
   - Tags dinâmicas (*LANÇAMENTO*, *ÚLTIMAS UNIDADES*, *SUCESSO DE VENDAS*).
   - Efeito interativo ao passar o cursor ou clicar para expandir e ler a descrição completa do imóvel.
   - Botão **"Saiba Mais"** gerando automaticamente uma mensagem contextualizada no WhatsApp com o título e localização do empreendimento clicado.

4. **Simulador de Financiamento Interativo (`#simulation`)**:
   - Formulário em etapas/modal coletando: Nome, Data de Nascimento, Estado Civil, Profissão, Renda Mensal (R$), Dependentes, Posse de imóveis e Local de Residência.
   - **Fluxo Direto**: Não exige envio para servidor backend intermediário; formata uma mensagem completa com os dados do lead e abre o WhatsApp da corretora para atendimento humanizado e validação bancária.

5. **Benefícios de Investir na Planta (`Benefits`)**:
   - Seção persuasiva destacando valorização patrimonial, inovação nos projetos e condições flexíveis de pagamento.
   - Bloco com citação inspiradora e foto configurável.

6. **Evolução das Obras (`#construction`)**:
   - Grade visual dos empreendimentos em fase construtiva.
   - Suporte a múltiplas ações ao clicar:
     - **Galeria de Fotos da Obra**: Modal com carrossel deslizante em alta resolução (até 10 fotos).
     - **Vídeos de Acompanhamento**: Modal com player de vídeo embutido e seletor entre vídeos (até 2 vídeos por empreendimento).
     - **Instagram Reels**: Redirecionamento direto para reels de vistoria/obras.
     - **Modal "Aguardem"**: Exibido amigavelmente caso o empreendimento ainda não possua mídia de obras cadastrada.

7. **Sobre Mim (`#about`)**:
   - Biografia profissional de Paula Malheiro (transição do Direito para o mercado imobiliário em 2016, atuação em grandes marcas como Alphaville, Gráfico e VCA).
   - Elementos de reforço de autoridade e confiança.

8. **Pop-up de Campanha Promocional (`CampaignPopup`)**:
   - Componente inteligente exibido no topo da página quando há uma campanha marcada como ativa no admin.
   - Suporta formatos de panfleto (imagem) ou vídeo promocional curto (máximo 40 segundos) com link opcional para ação externa.

9. **Rodapé & Botão Flutuante**:
   - Informações completas de contato, localização em Vitória da Conquista - BA, link discreto para login administrativo e botão flutuante permanente do WhatsApp no canto inferior direito.

---

### 4.2. Painel Administrativo (`/admin`)

- **Autenticação (`/admin/login`)**:
  - Login seguro via Supabase Auth (`signInWithPassword`).
  - Modo fallback de desenvolvimento para testes locais.
  - Redirecionamento automático através de `ProtectedRoute`.

- **Aba 1: Empreendimentos & Obras (`PropertiesManager`)**:
  - Cadastro de novos empreendimentos com título, localização, descrição, tag e ordem de exibição.
  - Upload de imagem de capa/card.
  - Seleção de exibição: Se aparece em *Destaques* e/ou *Evolução das Obras*.
  - Exclusão e edição em tempo real.

- **Aba 2: Evolução das Obras (`ConstructionProgressManager`)**:
  - Seleção do empreendimento para gestão de mídias de acompanhamento da obra.
  - Alternância do formato de mídia:
    - **Galeria de Fotos**: Upload de até 10 fotos em lote com contagem de slots restantes e exclusão individual.
    - **Vídeos da Obra**: Cadastro de até 2 vídeos via upload de arquivo de vídeo ou link direto.

- **Aba 3: Banners do Site (`AdminDashboard`)**:
  - Customização visual das seções *Hero*, *Sobre Mim* e *Investimento*.
  - Edição de títulos, subtítulos, tags e botões.
  - Upload direto de novas fotos com proporções recomendadas para cada seção.

- **Aba 4: Campanhas & Pop-up (`CampaignsManager`)**:
  - Criação de campanhas promocionais com opção de mídia: imagem ou vídeo (validação de até 40s).
  - Controle de ativação/desativação (apenas uma ativa por vez na landing page).

---

## 5. Modelo de Banco de Dados (Supabase / PostgreSQL)

O arquivo [supabase_schema.sql](file:///c:/Users/IrvynNascimento/Documents/Mccley/AntiGravity/site%20paula/supabase_schema.sql) define o banco de dados:

1. **`banners`**:
   - `id` (UUID, PK)
   - `section` (VARCHAR, UNIQUE) — Ex: `'hero'`, `'about'`, `'investment'`
   - `title`, `subtitle`, `tag`, `image_path`, `button_text`, `button_link`
   - `active` (BOOLEAN)
   - `created_at`, `updated_at`

2. **`properties`**:
   - `id` (UUID, PK)
   - `title`, `tag`, `location`, `description`, `image_url`
   - `is_featured` (BOOLEAN) — Exibe em "Empreendimentos em Destaque"
   - `is_construction` (BOOLEAN) — Exibe em "Evolução das Obras"
   - `action_type` (TEXT) — `'dates_modal'`, `'gallery'`, `'video'`, `'instagram'`, `'empty'`
   - `action_url` (TEXT) — Link para Instagram ou vídeo externo
   - `media_type` (TEXT) — `'photos'` ou `'videos'`
   - `gallery_images` (TEXT[]) — Array de URLs de fotos da obra (até 10)
   - `gallery_videos` (TEXT[]) — Array de URLs de vídeos da obra (até 2)
   - `order_index` (INT)
   - `created_at`, `updated_at`

3. **`campaigns`**:
   - `id` (UUID, PK)
   - `title` (TEXT)
   - `media_type` (TEXT) — `'image'` ou `'video'`
   - `image_url` (TEXT) — Imagem principal ou poster do vídeo
   - `video_url` (TEXT) — URL do vídeo
   - `video_duration` (NUMERIC) — Duração em segundos (máx 40s)
   - `target_link` (TEXT) — Redirecionamento ao clicar
   - `is_active` (BOOLEAN) — Define se o pop-up abre para os visitantes
   - `created_at`

4. **Storage Bucket**:
   - Bucket `images` público para fotos dos banners, imóveis e campanhas.

5. **Segurança (RLS)**:
   - Visitantes não autenticados têm permissão apenas de **SELECT** em banners, properties e campaigns ativas.
   - Usuários autenticados (Admin) têm permissão de **INSERT, UPDATE, DELETE** em todas as tabelas e no Storage.

---

## 6. Mecanismos de Tolerância a Falhas e Resiliência
- **Zero Downtime / Modo Offline**: O código possui a flag `isSupabaseConfigured` em `src/lib/supabase.ts`. Caso o Supabase não esteja provisionado ou haja instabilidade na conexão, o site entra automaticamente em modo fallback usando dados de `src/lib/propertiesData.ts` e `localStorage`, garantindo que o visitante nunca se depare com tela branca ou erros quebrados.
- **Sanitização de Uploads**: O sistema remove caracteres especiais e acentos dos nomes dos arquivos enviados ao storage para evitar problemas de compatibilidade com servidores Linux/Coolify.

---

## 7. Informações de Contato e Conversão Integradas
- **Corretora**: Paula Malheiro
- **CRECI**: 21.188 (Bahia)
- **WhatsApp de Atendimento**: `+55 (77) 99146-5337`
- **Instagram**: `https://www.instagram.com/paulamalheiro_vca`
- **Cidade**: Vitória da Conquista – Bahia
