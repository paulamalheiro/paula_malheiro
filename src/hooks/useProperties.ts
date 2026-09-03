import { useState, useEffect, useCallback } from 'react';
import type { Property } from '../types/property';
import { fetchPropertiesFromDb, savePropertyToDb, deletePropertyFromDb } from '../lib/supabase';
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
      if (data && data.length > 0) {
        setProperties(data);
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
