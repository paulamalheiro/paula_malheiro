-- ==============================================================================
-- SCHEMA SQL DE MIGRAÇÃO COMPLETO - SUPABASE (COOLIFY / HOSTINGER VPS)
-- Projeto: Landing Page Paula Malheiro (Corretora de Imóveis)
-- ==============================================================================

-- 1. TABELA DE BANNERS PRINCIPAIS (Hero, Sobre Mim, Investimento)
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section VARCHAR(50) NOT NULL UNIQUE,       -- 'hero', 'about', 'investment', etc.
    title VARCHAR(255),                        -- Título ou chamada principal
    subtitle TEXT,                             -- Descrição ou subtítulo
    tag VARCHAR(100),                          -- Tag / badge superior
    image_path TEXT NOT NULL,                  -- Caminho relativo no bucket ou URL
    button_text VARCHAR(100),                  -- Texto do botão de ação
    button_link TEXT,                          -- Link do botão
    active BOOLEAN DEFAULT true NOT NULL,      -- Status de exibição
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. TABELA DE EMPREENDIMENTOS (Properties)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    tag TEXT DEFAULT 'LANÇAMENTO',
    location TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT true,          -- Exibir em "Empreendimentos em Destaque"
    is_construction BOOLEAN DEFAULT false,     -- Exibir em "Evolução das Obras"
    action_type TEXT DEFAULT 'dates_modal',    -- 'instagram', 'gallery', 'video', 'dates_modal', 'empty'
    action_url TEXT,                           -- Link do Instagram ou rota externa
    media_type TEXT DEFAULT 'photos' CHECK (media_type IN ('photos', 'videos')), -- Fotos (até 10) ou Vídeos (até 2)
    gallery_images TEXT[] DEFAULT '{}',        -- Array de URLs para galeria de fotos da obra (até 10)
    gallery_videos TEXT[] DEFAULT '{}',        -- Array de URLs para vídeos da obra (até 2)
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Migração incremental para properties existentes:
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'photos' CHECK (media_type IN ('photos', 'videos')),
ADD COLUMN IF NOT EXISTS gallery_videos TEXT[] DEFAULT '{}';

-- 3. TABELA DE CAMPANHAS / POP-UP PROMOCIONAL (Campaigns)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')), -- Imagem/Panfleto ou Vídeo
    image_url TEXT NOT NULL,                  -- Imagem principal ou poster do vídeo
    video_url TEXT,                           -- URL do vídeo hospedado no Storage ou link
    video_duration NUMERIC,                   -- Duração do vídeo em segundos (máximo 40s)
    target_link TEXT,                         -- Link opcional ao clicar no pop-up
    is_active BOOLEAN DEFAULT false,          -- Apenas 1 ativa por vez
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Migração incremental para campaigns existentes:
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_duration NUMERIC;

-- 4. HABILITAÇÃO DO ROW LEVEL SECURITY (RLS)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE SEGURANÇA (RLS) - BANNERS
DROP POLICY IF EXISTS "Allow public read access to banners" ON public.banners;
CREATE POLICY "Allow public read access to banners" ON public.banners FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow authenticated users all banners" ON public.banners;
CREATE POLICY "Allow authenticated users all banners" ON public.banners FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. POLÍTICAS DE SEGURANÇA (RLS) - EMPREENDIMENTOS (PROPERTIES)
DROP POLICY IF EXISTS "Public Read Properties" ON public.properties;
CREATE POLICY "Public Read Properties" ON public.properties FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin All Properties" ON public.properties;
CREATE POLICY "Admin All Properties" ON public.properties FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. POLÍTICAS DE SEGURANÇA (RLS) - CAMPANHAS (CAMPAIGNS)
DROP POLICY IF EXISTS "Public Read Campaigns" ON public.campaigns;
CREATE POLICY "Public Read Campaigns" ON public.campaigns FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin All Campaigns" ON public.campaigns;
CREATE POLICY "Admin All Campaigns" ON public.campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. TRIGGER PARA ATUALIZAR 'updated_at'
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_banners_updated_at ON public.banners;
CREATE TRIGGER set_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_properties_updated_at ON public.properties;
CREATE TRIGGER set_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. CONFIGURAÇÃO DO BUCKET NO STORAGE ('images')
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'images', 
    'images', 
    true, 
    15728640, -- 15MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access to images bucket" ON storage.objects;
CREATE POLICY "Public Access to images bucket" ON storage.objects FOR SELECT TO public USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Authenticated users all storage" ON storage.objects;
CREATE POLICY "Authenticated users all storage" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'images') WITH CHECK (bucket_id = 'images');

-- 10. INSERÇÃO DOS BANNERS PADRÃO INICIAIS
INSERT INTO public.banners (section, title, subtitle, tag, image_path, button_text, button_link, active)
VALUES 
  (
    'hero',
    'a compra do seu imóvel como uma experiência segura e transparente!',
    'Com mais de 10 anos de experiência, minha intenção aqui é conectar você às oportunidades em imóveis através de um atendimento humano e personalizado para encontrarmos a melhor opção para o seu momento atual.',
    'Especialista em Imóveis na Planta',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
    'Conheça os Empreendimentos',
    '#projects',
    true
  ),
  (
    'about',
    'Paula Malheiro – CRECI 21.188',
    'Minha História',
    'Minha História',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
    NULL,
    NULL,
    true
  ),
  (
    'investment',
    'Paula Malheiro',
    'Investir em imóveis na planta é a forma mais inteligente de construir patrimônio sólido com segurança e planejamento.',
    'Investimento',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
    NULL,
    NULL,
    true
  )
ON CONFLICT (section) DO UPDATE 
SET 
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  image_path = EXCLUDED.image_path,
  updated_at = now();

-- 11. INSERÇÃO DOS EMPREENDIMENTOS PADRÃO INICIAIS
INSERT INTO public.properties (title, tag, location, description, image_url, is_featured, is_construction, action_type, action_url, gallery_images, order_index)
VALUES
  (
    'DUQUE Lavenir Residence', 
    'LANÇAMENTO', 
    'Próximo a Olívia Flores', 
    'Casas soltas com duas opções de planta: térrea com 3 suítes ou duplex com 4 suítes. Lazer de clube completo.', 
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80', 
    true, 
    false, 
    'dates_modal', 
    NULL, 
    '{}', 
    1
  ),
  (
    'UNI House', 
    'LANÇAMENTO', 
    'Região do Terras Alphaville', 
    'Condomínio de casas soltas com quintais de 30 a 130m², lazer de clube e muito verde.', 
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80', 
    true, 
    true, 
    'instagram', 
    'https://www.instagram.com/reel/DWWQfOYDuAn/?igsh=MXFlamt6aGZlZWFndQ==', 
    '{}', 
    2
  ),
  (
    'Baron Prime', 
    'LANÇAMENTO', 
    'Região do Boa Vista', 
    'Condomínio exclusivo de casas soltas com 3 suítes, pé direito duplo e área gourmet.', 
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80', 
    true, 
    true, 
    'dates_modal', 
    NULL, 
    '{}', 
    3
  ),
  (
    'Bellator Residence', 
    'EM OBRAS', 
    'Área Nobre', 
    'Casas de alto padrão com suíte master, closet e clube privativo integrado.', 
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=80', 
    true, 
    true, 
    'dates_modal', 
    NULL, 
    '{}', 
    4
  ),
  (
    'Amado Bahia', 
    'SUCESSO DE VENDAS', 
    'Vitória da Conquista', 
    'Condomínio fechado de lotes residenciais com infraestrutura completa e segurança 24h.', 
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80', 
    true, 
    true, 
    'dates_modal', 
    NULL, 
    '{}', 
    5
  ),
  (
    'Verso Residence', 
    'ÚLTIMAS UNIDADES', 
    'Localização Estratégica', 
    'Apartamentos modernos e planejados com varanda gourmet, ideais para moradia ou locação.', 
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80', 
    true, 
    true, 
    'instagram', 
    'https://www.instagram.com/reel/DT8XsQojhti/?igsh=MThyOHU0eWQ4ajNhaw==', 
    '{}', 
    6
  ),
  (
    'Sculptor', 
    'EM OBRAS', 
    'Bairro Candeias', 
    'Empreendimento inovador com arquitetura autoral e localização nobre.', 
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1000&q=80', 
    false, 
    true, 
    'dates_modal', 
    NULL, 
    '{}', 
    7
  ),
  (
    'Vila Imperial', 
    'EM OBRAS', 
    'Vitória da Conquista', 
    'Acompanhe a evolução de cada etapa da construção das casas e da área de lazer.', 
    'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1000&q=80', 
    false, 
    true, 
    'gallery', 
    NULL, 
    ARRAY[
      'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80'
    ], 
    8
  );
