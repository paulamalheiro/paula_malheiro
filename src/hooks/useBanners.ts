import { useState, useEffect, useCallback } from 'react';
import type { Banner } from '../types/banner';
import { fetchBannersFromDb, getImageUrl, pb, isPocketBaseConfigured } from '../lib/supabase';

// Fallbacks padrão caso o PocketBase ainda não possua banners salvos
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
    image_path: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
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
      if (Array.isArray(data)) {
        setBanners(data);
      }
    } catch (err: any) {
      console.warn('[useBanners] Falha ao carregar banners:', err?.message);
      setError(err?.message || 'Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();

    // 1. Ouvintes de eventos locais e foco de janela
    const handleRevalidate = () => {
      loadBanners();
    };

    window.addEventListener('focus', handleRevalidate);
    window.addEventListener('online', handleRevalidate);
    window.addEventListener('paula_banners_updated', handleRevalidate);

    // 2. Subscrição em tempo real via Server-Sent Events (SSE) do PocketBase
    let isSubscribed = false;
    if (isPocketBaseConfigured) {
      try {
        pb.collection('banners')
          .subscribe('*', () => {
            loadBanners();
          })
          .then(() => {
            isSubscribed = true;
          })
          .catch((subErr) => {
            console.warn('[useBanners] SSE subscribe aviso:', subErr?.message);
          });
      } catch (err) {
        console.warn('[useBanners] Falha ao iniciar SSE em banners:', err);
      }
    }

    return () => {
      window.removeEventListener('focus', handleRevalidate);
      window.removeEventListener('online', handleRevalidate);
      window.removeEventListener('paula_banners_updated', handleRevalidate);
      if (isSubscribed && isPocketBaseConfigured) {
        try {
          pb.collection('banners').unsubscribe('*');
        } catch {}
      }
    };
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
