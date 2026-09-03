import { useState, useEffect, useCallback } from 'react';
import type { Campaign } from '../types/property';
import { fetchCampaignsFromDb, saveCampaignToDb, deleteCampaignFromDb } from '../lib/supabase';

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCampaignsFromDb();
      setCampaigns(data);
    } catch (err: any) {
      console.warn('[useCampaigns] Erro ao carregar campanhas:', err.message);
      setError(err.message || 'Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
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
