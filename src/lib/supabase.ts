import { createClient } from '@supabase/supabase-js';
import type { Banner } from '../types/banner';
import type { Property, Campaign } from '../types/property';
import { INITIAL_PROPERTIES } from './propertiesData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const BUCKET_NAME = import.meta.env.VITE_SUPABASE_BUCKET_NAME || 'images';

const LOCAL_STORAGE_BANNERS_KEY = 'paula_banners_local_db';
const LOCAL_STORAGE_PROPERTIES_KEY = 'paula_properties_local_db';
const LOCAL_STORAGE_CAMPAIGNS_KEY = 'paula_campaigns_local_db';

// Check if credentials are properly provided (and not placeholders)
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('sua_url_do_supabase') &&
  !supabaseAnonKey.includes('sua_chave_anon') &&
  supabaseAnonKey.trim().length > 10
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Constrói a URL pública da imagem/vídeo respeitando o Supabase Storage ou fallbacks locais.
 * Suporta URLs absolutas, blob/data URIs e paths relativos do bucket.
 */
export const getImageUrl = (imagePath?: string | null): string => {
  if (!imagePath) return '';
  
  // Se já for uma URL completa ou URI temporária (blob, base64, https://)
  if (
    imagePath.startsWith('http://') || 
    imagePath.startsWith('https://') || 
    imagePath.startsWith('blob:') || 
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }

  // Se o Supabase estiver configurado e o path não for estático local
  if (supabase) {
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(cleanPath);
    if (data?.publicUrl) {
      return data.publicUrl;
    }
  }

  // Fallback para arquivo local em /public
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
};

/* ==============================================================================
   SERVIÇOS DE BANNERS
   ============================================================================== */

export const fetchBannersFromDb = async (): Promise<Banner[]> => {
  if (supabase) {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      return data as Banner[];
    }
    console.warn('[Supabase] Erro ao carregar banners:', error?.message);
  }

  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_BANNERS_KEY);
    if (localData) {
      return JSON.parse(localData) as Banner[];
    }
  } catch (e) {
    console.error('Erro ao ler banners locais:', e);
  }

  return [];
};

export const upsertBannerToDb = async (banner: Banner): Promise<Banner> => {
  const payload: Banner = {
    section: banner.section,
    title: banner.title,
    subtitle: banner.subtitle,
    tag: banner.tag,
    image_path: banner.image_path,
    button_text: banner.button_text,
    button_link: banner.button_link,
    active: banner.active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('banners')
      .upsert(payload, { onConflict: 'section' })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar banner no Supabase: ${error.message}`);
    }

    return data as Banner;
  }

  try {
    const currentList = await fetchBannersFromDb();
    const existingIndex = currentList.findIndex((b) => b.section === banner.section);
    
    if (existingIndex >= 0) {
      currentList[existingIndex] = { ...currentList[existingIndex], ...payload };
    } else {
      currentList.push({ id: `local-${Date.now()}`, ...payload });
    }

    localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(currentList));
    return payload;
  } catch (e: any) {
    throw new Error(`Erro ao salvar localmente: ${e?.message}`);
  }
};

/* ==============================================================================
   SERVIÇOS DE EMPREENDIMENTOS (PROPERTIES)
   ============================================================================== */

export const fetchPropertiesFromDb = async (): Promise<Property[]> => {
  if (supabase) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as Property[];
    }
  }

  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_PROPERTIES_KEY);
    if (localData) {
      const parsed = JSON.parse(localData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as Property[];
      }
    }
  } catch (e) {
    console.error('Erro ao ler properties locais:', e);
  }

  // Inicializa com os dados iniciais padrão
  localStorage.setItem(LOCAL_STORAGE_PROPERTIES_KEY, JSON.stringify(INITIAL_PROPERTIES));
  return INITIAL_PROPERTIES;
};

export const savePropertyToDb = async (property: Partial<Property>): Promise<Property> => {
  const payload = {
    title: property.title || '',
    tag: property.tag || 'LANÇAMENTO',
    location: property.location || '',
    description: property.description || '',
    image_url: property.image_url || '',
    is_featured: property.is_featured ?? true,
    is_construction: property.is_construction ?? false,
    action_type: property.action_type || 'dates_modal',
    action_url: property.action_url || '',
    media_type: property.media_type || 'photos',
    gallery_images: property.gallery_images || [],
    gallery_videos: property.gallery_videos || [],
    order_index: property.order_index ?? 0,
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    if (property.id && !property.id.startsWith('prop-') && !property.id.startsWith('local-')) {
      const { data, error } = await supabase
        .from('properties')
        .update(payload)
        .eq('id', property.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Property;
    } else {
      const { data, error } = await supabase
        .from('properties')
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Property;
    }
  }

  // Local Storage fallback
  const list = await fetchPropertiesFromDb();
  const id = property.id || `prop-${Date.now()}`;
  const fullProperty: Property = {
    id,
    title: payload.title,
    tag: payload.tag,
    location: payload.location,
    description: payload.description,
    image_url: payload.image_url,
    is_featured: payload.is_featured,
    is_construction: payload.is_construction,
    action_type: payload.action_type,
    action_url: payload.action_url,
    media_type: payload.media_type,
    gallery_images: payload.gallery_images,
    gallery_videos: payload.gallery_videos,
    order_index: payload.order_index,
    created_at: property.created_at || new Date().toISOString(),
    updated_at: payload.updated_at,
  };

  const existingIndex = list.findIndex((p) => p.id === id);
  if (existingIndex >= 0) {
    list[existingIndex] = fullProperty;
  } else {
    list.push(fullProperty);
  }

  localStorage.setItem(LOCAL_STORAGE_PROPERTIES_KEY, JSON.stringify(list));
  return fullProperty;
};

export const deletePropertyFromDb = async (id: string): Promise<void> => {
  if (supabase && !id.startsWith('prop-') && !id.startsWith('local-')) {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  const list = await fetchPropertiesFromDb();
  const filtered = list.filter((p) => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_PROPERTIES_KEY, JSON.stringify(filtered));
};

/* ==============================================================================
   SERVIÇOS DE CAMPANHAS / POP-UP (CAMPAIGNS)
   ============================================================================== */

export const fetchCampaignsFromDb = async (): Promise<Campaign[]> => {
  if (supabase) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as Campaign[];
    }
  }

  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_CAMPAIGNS_KEY);
    if (localData) {
      return JSON.parse(localData) as Campaign[];
    }
  } catch (e) {
    console.error('Erro ao ler campanhas locais:', e);
  }

  return [];
};

export const saveCampaignToDb = async (campaign: Partial<Campaign>): Promise<Campaign> => {
  const payload = {
    title: campaign.title || '',
    media_type: campaign.media_type || 'image',
    image_url: campaign.image_url || '',
    video_url: campaign.video_url || null,
    video_duration: campaign.video_duration || null,
    target_link: campaign.target_link || '',
    is_active: campaign.is_active ?? false,
  };

  if (supabase) {
    if (payload.is_active) {
      await supabase.from('campaigns').update({ is_active: false }).neq('id', campaign.id || '00000000-0000-0000-0000-000000000000');
    }

    if (campaign.id && !campaign.id.startsWith('camp-') && !campaign.id.startsWith('local-')) {
      const { data, error } = await supabase
        .from('campaigns')
        .update(payload)
        .eq('id', campaign.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Campaign;
    } else {
      const { data, error } = await supabase
        .from('campaigns')
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Campaign;
    }
  }

  // Local Storage fallback
  const list = await fetchCampaignsFromDb();
  if (payload.is_active) {
    list.forEach((c) => { c.is_active = false; });
  }

  const id = campaign.id || `camp-${Date.now()}`;
  const fullCampaign: Campaign = {
    id,
    title: payload.title,
    media_type: payload.media_type,
    image_url: payload.image_url,
    video_url: payload.video_url,
    video_duration: payload.video_duration,
    target_link: payload.target_link,
    is_active: payload.is_active,
    created_at: campaign.created_at || new Date().toISOString(),
  };

  const existingIndex = list.findIndex((c) => c.id === id);
  if (existingIndex >= 0) {
    list[existingIndex] = fullCampaign;
  } else {
    list.unshift(fullCampaign);
  }

  localStorage.setItem(LOCAL_STORAGE_CAMPAIGNS_KEY, JSON.stringify(list));
  return fullCampaign;
};

export const deleteCampaignFromDb = async (id: string): Promise<void> => {
  if (supabase && !id.startsWith('camp-') && !id.startsWith('local-')) {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  const list = await fetchCampaignsFromDb();
  const filtered = list.filter((c) => c.id !== id);
  localStorage.setItem(LOCAL_STORAGE_CAMPAIGNS_KEY, JSON.stringify(filtered));
};

/* ==============================================================================
   UPLOAD DE ARQUIVOS (STORAGE - IMAGENS & VÍDEOS)
   ============================================================================== */

export const uploadBannerFile = async (
  file: File, 
  prefix = 'banners'
): Promise<{ path: string; publicUrl: string }> => {
  if (supabase) {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `${cleanPrefix}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || undefined,
      });

    if (error) {
      throw new Error(`Falha no upload do arquivo: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      publicUrl: urlData.publicUrl,
    };
  }

  // Modo Local de Testes: Converte arquivo para Data URI ou Blob URL
  if (file.type.startsWith('video/')) {
    const blobUrl = URL.createObjectURL(file);
    return {
      path: blobUrl,
      publicUrl: blobUrl,
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      resolve({
        path: base64Url,
        publicUrl: base64Url,
      });
    };
    reader.onerror = () => reject(new Error('Erro ao processar arquivo para teste local.'));
    reader.readAsDataURL(file);
  });
};
