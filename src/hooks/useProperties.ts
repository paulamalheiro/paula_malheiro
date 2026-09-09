import { useState, useEffect, useCallback } from 'react';
import type { Property } from '../types/property';
import { fetchPropertiesFromDb, savePropertyToDb, deletePropertyFromDb, pb, isPocketBaseConfigured } from '../lib/supabase';
import { INITIAL_PROPERTIES } from '../lib/propertiesData';

export const useProperties = () => {
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPropertiesFromDb();
      if (Array.isArray(data)) {
        setProperties(data.length > 0 ? data : INITIAL_PROPERTIES);
      }
    } catch (err: any) {
      console.warn('[useProperties] Erro ao carregar empreendimentos:', err.message);
      setError(err.message || 'Erro ao carregar empreendimentos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();

    // 1. Revalidação ao retomar o foco da janela ou recuperar conexão
    const handleRevalidate = () => {
      loadProperties();
    };

    window.addEventListener('focus', handleRevalidate);
    window.addEventListener('online', handleRevalidate);

    // 2. Subscrição em tempo real via Server-Sent Events (SSE) do PocketBase
    let isSubscribed = false;
    if (isPocketBaseConfigured) {
      try {
        pb.collection('properties')
          .subscribe('*', () => {
            loadProperties();
          })
          .then(() => {
            isSubscribed = true;
          })
          .catch((subErr) => {
            console.warn('[useProperties] SSE subscribe aviso:', subErr?.message);
          });
      } catch (err) {
        console.warn('[useProperties] Falha ao iniciar SSE em properties:', err);
      }
    }

    return () => {
      window.removeEventListener('focus', handleRevalidate);
      window.removeEventListener('online', handleRevalidate);
      if (isSubscribed && isPocketBaseConfigured) {
        try {
          pb.collection('properties').unsubscribe('*');
        } catch {}
      }
    };
  }, [loadProperties]);

  const featuredProperties = properties
    .filter((p) => p.is_featured)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const constructionProperties = properties
    .filter((p) => p.is_construction)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const saveProperty = async (property: Partial<Property>) => {
    const saved = await savePropertyToDb(property);
    await loadProperties();
    return saved;
  };

  const deleteProperty = async (id: string) => {
    await deletePropertyFromDb(id);
    await loadProperties();
  };

  return {
    properties,
    featuredProperties,
    constructionProperties,
    loading,
    error,
    saveProperty,
    deleteProperty,
    refreshProperties: loadProperties,
  };
};
