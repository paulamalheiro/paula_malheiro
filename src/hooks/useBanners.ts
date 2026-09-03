import { useState, useEffect, useCallback } from 'react';
import type { Banner } from '../types/banner';
import { fetchBannersFromDb, getImageUrl } from '../lib/supabase';

// Fallbacks padrão caso o Supabase não esteja preenchido ou ocorra falha de rede
export const DEFAULT_BANNERS: Record<string, Banner> = {
  hero: {
    section: 'hero',
    title: 'a compra do seu imóvel como uma experiência segura e transparente!',
    subtitle: 'Com mais de 10 anos de experiência, minha intenção aqui é conectar você às oportunidades em imóveis através de um atendimento humano e personalizado para encontrarmos a melhor opção para o seu momento atual.',
    tag: 'Especialista em Imóveis na Planta',
    image_path: '/paula-hero.jpeg',
    button_text: 'Conheça os Empreendimentos',
    button_link: '#projects',
    active: true,
  },
  about: {
    section: 'about',
    title: 'Paula Malheiro – CRECI 21.188',
    subtitle: 'Minha História',
    tag: 'Minha História',
    image_path: '/paula-perfil.jpeg',
    active: true,
  },
  investment: {
    section: 'investment',
    title: 'Paula Malheiro',
    subtitle: 'Investir em imóveis na planta é a forma mais inteligente de construir patrimônio sólido com segurança e planejamento.',
    tag: 'Investimento',
    image_path: '/velli.jpeg',
    active: true,
  },
};

export const useBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBannersFromDb();
      if (data && data.length > 0) {
        setBanners(data);
      }
    } catch (err: any) {
      console.warn('[useBanners] Falha ao carregar banners do Supabase, usando fallbacks:', err?.message);
      setError(err?.message || 'Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  /**
   * Retorna os dados de um banner específico por seção com fallback garantido.
   */
  const getBanner = (section: string): Banner => {
    const found = banners.find((b) => b.section === section && b.active);
    if (found) {
      return found;
    }
    return DEFAULT_BANNERS[section] || {
      section,
      image_path: '/paula-hero.jpeg',
      active: true,
    };
  };

  /**
   * Retorna a URL final da imagem com getImageUrl
   */
  const getBannerImageUrl = (section: string): string => {
    const banner = getBanner(section);
    return getImageUrl(banner.image_path);
  };

  return {
    banners,
    loading,
    error,
    getBanner,
    getBannerImageUrl,
    refreshBanners: loadBanners,
  };
};
