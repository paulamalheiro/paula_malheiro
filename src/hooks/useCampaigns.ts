import { useState, useEffect, useCallback } from 'react';
import type { Campaign } from '../types/property';
import { fetchCampaignsFromDb, saveCampaignToDb, deleteCampaignFromDb, pb, isPocketBaseConfigured } from '../lib/supabase';

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCampaignsFromDb();
      if (Array.isArray(data)) {
        setCampaigns(data);
      }
    } catch (err: any) {
      console.warn('[useCampaigns] Erro ao carregar campanhas:', err.message);
      setError(err.message || 'Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();

    // 1. Revalidação ao retomar o foco da janela ou recuperar conexão
    const handleRevalidate = () => {
      loadCampaigns();
    };

    window.addEventListener('focus', handleRevalidate);
    window.addEventListener('online', handleRevalidate);
    window.addEventListener('paula_campaigns_updated', handleRevalidate);

    // 2. Subscrição em tempo real via Server-Sent Events (SSE) do PocketBase
    let isSubscribed = false;
    if (isPocketBaseConfigured) {
      try {
        pb.collection('campaigns')
          .subscribe('*', () => {
            loadCampaigns();
          })
          .then(() => {
            isSubscribed = true;
          })
          .catch((subErr) => {
            console.warn('[useCampaigns] SSE subscribe aviso:', subErr?.message);
          });
      } catch (err) {
        console.warn('[useCampaigns] Falha ao iniciar SSE em campaigns:', err);
      }
    }

    return () => {
      window.removeEventListener('focus', handleRevalidate);
      window.removeEventListener('online', handleRevalidate);
      window.removeEventListener('paula_campaigns_updated', handleRevalidate);
      if (isSubscribed && isPocketBaseConfigured) {
        try {
          pb.collection('campaigns').unsubscribe('*');
        } catch {}
      }
    };
  }, [loadCampaigns]);

  const activeCampaign = campaigns.find((c) => c.is_active) || null;

  const saveCampaign = async (campaign: Partial<Campaign>) => {
    const saved = await saveCampaignToDb(campaign);
    await loadCampaigns();
    return saved;
  };

  const deleteCampaign = async (id: string) => {
    await deleteCampaignFromDb(id);
    await loadCampaigns();
  };

  return {
    campaigns,
    activeCampaign,
    loading,
    error,
    saveCampaign,
    deleteCampaign,
    refreshCampaigns: loadCampaigns,
  };
};
