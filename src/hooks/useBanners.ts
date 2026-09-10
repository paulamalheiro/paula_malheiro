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
    subtitle: `Sou natural de Caetité – Bahia e cheguei a Vitória da Conquista em 2012, onde concluí minha formação em Direito e iniciei minha trajetória profissional. Os imóveis, porém, sempre fizeram parte da minha vida, influenciada desde cedo pelo meu pai e sua paixão por negócios.

Em 2016, ingressei no mercado imobiliário, sempre com foco em lançamentos. Comecei por empresas que fortaleceram minha paixão pelo mercado e me fizeram ter certeza de que estava no caminho certo.

Em 2018, cheguei à VCA Construtora, responsável por grande parte do meu desenvolvimento profissional e pessoal. Também tive a oportunidade de atuar na coordenação comercial, ampliando minha visão sobre vendas, gestão e relacionamento com clientes.

Sou movida por desafios, criatividade e inovação, e adoro unir vendas e marketing. Hoje, vivo uma fase mais madura da minha carreira, priorizando oferecer um atendimento humano, personalizado e transparente.

Ao longo dos mais de 10 anos no mercado imobiliário, acompanhei de perto histórias de conquistas e bons retornos de clientes que investiram em imóveis na planta. É essa experiência que hoje coloco a serviço de quem busca não apenas comprar um imóvel, mas tomar uma decisão segura para construir um futuro mais feliz e próspero. É para isso que estou aqui!`,
    tag: 'Minha História',
    image_path: '/paula-perfil.jpeg',
    button_text: 'Fale Comigo',
    button_link: 'https://wa.me/5577991465337',
    active: true,
  },
  investment: {
    section: 'investment',
    title: 'Segurança, Rentabilidade e Conquista Patrimonial',
    subtitle: 'Investir em imóveis na planta é a forma mais inteligente de construir patrimônio sólido com segurança e planejamento.',
    tag: 'Por Que Investir na Planta?',
    image_path: '/velli.jpeg',
    button_text: 'Paula Malheiro',
    button_link: '#contact',
    active: true,
  },
  construction: {
    section: 'construction',
    title: 'Evolução das Obras',
    subtitle: 'Confira o acompanhamento real de cada etapa dos nossos empreendimentos com transparência.',
    tag: 'Acompanhamento de Obras',
    image_path: '/paula-hero.jpeg',
    button_text: 'Ver Obras',
    button_link: '#construction',
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
   * Suporta aliases em português (obras, sobre_mim, investimento) e inglês (construction, about, investment).
   */
  const getBanner = (section: string): Banner => {
    const aliases: Record<string, string[]> = {
      hero: ['hero', 'principal'],
      construction: ['construction', 'obras', 'acompanhamento_obras'],
      about: ['about', 'sobre_mim', 'perfil'],
      investment: ['investment', 'investimento', 'vantagens'],
    };

    // Descobre as chaves equivalentes para busca
    const targetKeys = Object.entries(aliases).find(([canonical, alts]) => 
      canonical === section || alts.includes(section)
    )?.[1] || [section];

    const canonicalKey = Object.entries(aliases).find(([canonical, alts]) => 
      canonical === section || alts.includes(section)
    )?.[0] || section;

    const found = banners.find((b) => targetKeys.includes(b.section) && b.active);
    if (found) {
      return found;
    }

    return (
      DEFAULT_BANNERS[canonicalKey] ||
      DEFAULT_BANNERS[section] || {
        section,
        image_path: '/paula-hero.jpeg',
        active: true,
      }
    );
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
