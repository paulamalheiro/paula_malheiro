import PocketBase from 'pocketbase';
import type { Banner } from '../types/banner';
import type { Property, Campaign } from '../types/property';
import { INITIAL_PROPERTIES } from './propertiesData';

export const POCKETBASE_URL = (
  import.meta.env.VITE_POCKETBASE_URL || 'https://pb-paula.janagencia.com.br'
).replace(/\/$/, '');

export const isPocketBaseConfigured = Boolean(
  POCKETBASE_URL && !POCKETBASE_URL.includes('sua_url')
);

// Instância única do PocketBase com sincronização automática de auth via localStorage
export const pb = new PocketBase(POCKETBASE_URL);

const LOCAL_STORAGE_BANNERS_KEY = 'paula_banners_local_db';
const LOCAL_STORAGE_PROPERTIES_KEY = 'paula_properties_local_db';
const LOCAL_STORAGE_CAMPAIGNS_KEY = 'paula_campaigns_local_db';

/**
 * Constrói a URL pública da imagem/vídeo respeitando o PocketBase ou fallbacks locais.
 * Suporta URLs absolutas, URLs de arquivos do PocketBase, blob/data URIs e paths relativos.
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

  // Se for um caminho de arquivo do PocketBase (/api/files/...)
  if (imagePath.startsWith('/api/files/')) {
    return `${POCKETBASE_URL}${imagePath}`;
  }

  // Fallback para arquivo local em /public
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
};

/* ==============================================================================
   SERVIÇOS DE BANNERS (POCKETBASE)
   ============================================================================== */

export const fetchBannersFromDb = async (): Promise<Banner[]> => {
  if (isPocketBaseConfigured) {
    try {
      const records = await pb.collection('banners').getFullList({
        sort: 'created',
        requestKey: null,
      });

      if (records && records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          section: r.section,
          title: r.title || null,
          subtitle: r.subtitle || null,
          tag: r.tag || null,
          image_path: r.image_path || '',
          button_text: r.button_text || null,
          button_link: r.button_link || null,
          active: r.active ?? true,
          created_at: r.created || r.created_at,
          updated_at: r.updated || r.updated_at,
        })) as Banner[];
      }
    } catch (error: any) {
      console.warn('[PocketBase] Erro ao carregar banners:', error?.message);
    }
  }

  // Fallback para LocalStorage se o PocketBase estiver offline
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
  const payload = {
    section: banner.section,
    title: banner.title,
    subtitle: banner.subtitle,
    tag: banner.tag,
    image_path: banner.image_path,
    button_text: banner.button_text,
    button_link: banner.button_link,
    active: banner.active ?? true,
  };

  if (isPocketBaseConfigured) {
    try {
      let existingId = banner.id;

      // Se não tiver ID válido de 15 caracteres do PocketBase, busca por seção
      if (!existingId || existingId.startsWith('local-') || existingId.startsWith('banner-')) {
        try {
          const existing = await pb
            .collection('banners')
            .getFirstListItem(`section="${banner.section}"`, { requestKey: null });
          if (existing) {
            existingId = existing.id;
          }
        } catch {}
      }

      let record;
      if (existingId && !existingId.startsWith('local-') && !existingId.startsWith('banner-')) {
        record = await pb.collection('banners').update(existingId, payload);
      } else {
        record = await pb.collection('banners').create(payload);
      }

      return {
        id: record.id,
        ...payload,
        created_at: record.created,
        updated_at: record.updated,
      } as Banner;
    } catch (error: any) {
      console.warn('[PocketBase] Erro ao salvar banner no PocketBase:', error?.message);
    }
  }

  // Fallback Local Storage
  try {
    const currentList = await fetchBannersFromDb();
    const existingIndex = currentList.findIndex((b) => b.section === banner.section);
    const fullBanner: Banner = { id: banner.id || `local-${Date.now()}`, ...payload };

    if (existingIndex >= 0) {
      currentList[existingIndex] = fullBanner;
    } else {
      currentList.push(fullBanner);
    }

    localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(currentList));
    return fullBanner;
  } catch (e: any) {
    throw new Error(`Erro ao salvar localmente: ${e?.message}`);
  }
};

/* ==============================================================================
   SERVIÇOS DE EMPREENDIMENTOS (PROPERTIES)
   ============================================================================== */

export const fetchPropertiesFromDb = async (): Promise<Property[]> => {
  if (isPocketBaseConfigured) {
    try {
      const records = await pb.collection('properties').getFullList({
        sort: 'order_index,-created',
        requestKey: null,
      });

      if (records && records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          title: r.title,
          tag: r.tag || null,
          location: r.location,
          description: r.description || null,
          image_url: r.image_url,
          is_featured: r.is_featured ?? true,
          is_construction: r.is_construction ?? false,
          action_type: r.action_type || 'dates_modal',
          action_url: r.action_url || null,
          media_type: r.media_type || 'photos',
          gallery_images: Array.isArray(r.gallery_images) ? r.gallery_images : [],
          gallery_videos: Array.isArray(r.gallery_videos) ? r.gallery_videos : [],
          order_index: r.order_index ?? 0,
          created_at: r.created || r.created_at,
          updated_at: r.updated || r.updated_at,
        })) as Property[];
      }
    } catch (error: any) {
      console.warn('[PocketBase] Erro ao carregar empreendimentos:', error?.message);
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
  };

  if (isPocketBaseConfigured) {
    try {
      let record;
      if (property.id && !property.id.startsWith('prop-') && !property.id.startsWith('local-')) {
        record = await pb.collection('properties').update(property.id, payload);
      } else {
        record = await pb.collection('properties').create(payload);
      }

      return {
        id: record.id,
        ...payload,
        created_at: record.created,
        updated_at: record.updated,
      } as Property;
    } catch (error: any) {
      console.warn('[PocketBase] Erro ao salvar empreendimento no PocketBase:', error?.message);
    }
  }

  // Fallback Local Storage
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
    action_type: payload.action_type as any,
    action_url: payload.action_url,
    media_type: payload.media_type as any,
    gallery_images: payload.gallery_images,
    gallery_videos: payload.gallery_videos,
    order_index: payload.order_index,
    created_at: property.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
  if (isPocketBaseConfigured && !id.startsWith('prop-') && !id.startsWith('local-')) {
    try {
      await pb.collection('properties').delete(id);
    } catch (error: any) {
      console.warn('[PocketBase] Erro ao excluir empreendimento no PocketBase:', error?.message);
    }
  }

  const list = await fetchPropertiesFromDb();
  const filtered = list.filter((p) => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_PROPERTIES_KEY, JSON.stringify(filtered));
};

/* ==============================================================================
   SERVIÇOS DE CAMPANHAS / POP-UP (CAMPAIGNS)
   ============================================================================== */

export const fetchCampaignsFromDb = async (): Promise<Campaign[]> => {
  if (isPocketBaseConfigured) {
    try {
      const records = await pb.collection('campaigns').getFullList({
        sort: '-created',
        requestKey: null,
      });

      if (records && records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          title: r.title,
          media_type: r.media_type || 'image',
          image_url: r.image_url,
          video_url: r.video_url || null,
          video_duration: r.video_duration || null,
          target_link: r.target_link || '',
          is_active: r.is_active ?? false,
          created_at: r.created || r.created_at,
        })) as Campaign[];
      }
    } catch (error: any) {
      console.warn('[PocketBase] Erro ao carregar campanhas:', error?.message);
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

  if (isPocketBaseConfigured) {
    try {
      if (payload.is_active) {
        // Desativa outras campanhas ativas
        try {
          const activeList = await pb.collection('campaigns').getFullList({
            filter: 'is_active = true',
            requestKey: null,
          });
          for (const item of activeList) {
            if (item.id !== campaign.id) {
              await pb.collection('campaigns').update(item.id, { is_active: false });
            }
          }
        } catch {}
      }

      let record;
      if (campaign.id && !campaign.id.startsWith('camp-') && !campaign.id.startsWith('local-')) {
        record = await pb.collection('campaigns').update(campaign.id, payload);
      } else {
        record = await pb.collection('campaigns').create(payload);
      }

      return {
        id: record.id,
        ...payload,
        created_at: record.created,
      } as Campaign;
    } catch (error: any) {
      console.warn('[PocketBase] Erro ao salvar campanha no PocketBase:', error?.message);
    }
  }

  // Fallback Local Storage
  const list = await fetchCampaignsFromDb();
  if (payload.is_active) {
    list.forEach((c) => {
      c.is_active = false;
    });
  }

  const id = campaign.id || `camp-${Date.now()}`;
  const fullCampaign: Campaign = {
    id,
    title: payload.title,
    media_type: payload.media_type as any,
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
  if (isPocketBaseConfigured && !id.startsWith('camp-') && !id.startsWith('local-')) {
    try {
      await pb.collection('campaigns').delete(id);
    } catch (error: any) {
      console.warn('[PocketBase] Erro ao excluir campanha:', error?.message);
    }
  }

  const list = await fetchCampaignsFromDb();
  const filtered = list.filter((c) => c.id !== id);
  localStorage.setItem(LOCAL_STORAGE_CAMPAIGNS_KEY, JSON.stringify(filtered));
};

/* ==============================================================================
   UPLOAD DE ARQUIVOS (STORAGE / POCKETBASE UPLOADS)
   ============================================================================== */

export const uploadBannerFile = async (
  file: File,
  _prefix = 'banners'
): Promise<{ path: string; publicUrl: string }> => {
  // 1. Tentar upload nativo no PocketBase na coleção 'uploads'
  if (isPocketBaseConfigured && pb.authStore.isValid) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const record = await pb.collection('uploads').create(formData);
      const publicUrl = `${POCKETBASE_URL}/api/files/uploads/${record.id}/${record.file}`;

      return {
        path: publicUrl,
        publicUrl,
      };
    } catch (error: any) {
      console.warn('[PocketBase] Upload no PocketBase falhou, usando fallback:', error?.message);
    }
  }

  // 2. Modo Local de Testes: Converte arquivo para Blob URL (vídeo) ou Base64 (imagem)
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
