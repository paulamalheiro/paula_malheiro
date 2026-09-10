import PocketBase from 'pocketbase';
import type { Banner } from '../types/banner';
import type { Property, Campaign } from '../types/property';
import { INITIAL_PROPERTIES } from './propertiesData';

export const POCKETBASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_POCKETBASE_URL) ||
  'https://pb-paula.janagencia.com.br'
).replace(/\/$/, '');

export const isPocketBaseConfigured = Boolean(
  POCKETBASE_URL && !POCKETBASE_URL.includes('sua_url')
);

// Instância única do PocketBase com sincronização de auth e auto-cancellation desativado
export const pb = new PocketBase(POCKETBASE_URL);
pb.autoCancellation(false);

/**
 * Constrói a URL pública da imagem/vídeo respeitando o PocketBase ou fallbacks locais.
 * Suporta URLs absolutas, URLs de arquivos do PocketBase, records com método getUrl, blob/data URIs e paths relativos.
 */
export const getImageUrl = (imagePath?: string | null | Record<string, any>): string => {
  if (!imagePath) return '';

  // Se receber um record do PocketBase com objeto de arquivo
  if (typeof imagePath === 'object' && imagePath !== null) {
    if (imagePath.collectionId && imagePath.id && imagePath.file) {
      try {
        return pb.files.getUrl(imagePath as any, imagePath.file);
      } catch {
        return `${POCKETBASE_URL}/api/files/${imagePath.collectionId}/${imagePath.id}/${imagePath.file}`;
      }
    }
    if (imagePath.collectionId && imagePath.id && imagePath.image) {
      try {
        return pb.files.getUrl(imagePath as any, imagePath.image);
      } catch {
        return `${POCKETBASE_URL}/api/files/${imagePath.collectionId}/${imagePath.id}/${imagePath.image}`;
      }
    }
    if (imagePath.image_path) {
      return getImageUrl(imagePath.image_path);
    }
    if (imagePath.image_url) {
      return getImageUrl(imagePath.image_url);
    }
    return '';
  }

  let str = String(imagePath).trim();
  if (!str) return '';

  // Substitui localhost por URL pública de produção caso venha com host de dev
  if (str.includes('localhost:8090') || str.includes('127.0.0.1:8090')) {
    str = str.replace(/https?:\/\/(localhost|127\.0\.0\.1):8090/g, POCKETBASE_URL);
  }

  // Se já for uma URL completa ou URI temporária (blob, base64, https://)
  if (
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('blob:') ||
    str.startsWith('data:')
  ) {
    return str;
  }

  // Se for um caminho de arquivo do PocketBase (/api/files/... ou api/files/...)
  if (str.startsWith('/api/files/')) {
    return `${POCKETBASE_URL}${str}`;
  }
  if (str.startsWith('api/files/')) {
    return `${POCKETBASE_URL}/${str}`;
  }

  // Se for caminho de upload relativo (ex: uploads/id/file ou /uploads/id/file)
  if (str.startsWith('/uploads/') || str.startsWith('uploads/')) {
    const clean = str.replace(/^\/?uploads\//, '');
    return `${POCKETBASE_URL}/api/files/uploads/${clean}`;
  }

  // Fallback para arquivo local em /public
  return str.startsWith('/') ? str : `/${str}`;
};

/* ==============================================================================
   SERVIÇO DE AUDITORIA & LOGS (POCKETBASE)
   ============================================================================== */

export interface AuditLog {
  id: string;
  action: string;
  section?: string;
  user_email: string;
  details?: string;
  created: string;
}

/**
 * Registra um evento no histórico de auditoria no PocketBase.
 */
export const logAuditEvent = async (
  action: string,
  details?: string,
  section?: string
): Promise<void> => {
  try {
    const currentRecord = pb.authStore.record || (pb.authStore as any).model;
    const userEmail = currentRecord?.email || 'admin@paulamalheiro.com.br';
    await pb.collection('audit_logs').create(
      {
        action,
        section: section || 'Geral',
        user_email: userEmail,
        details: details || '',
      },
      { requestKey: null }
    );
  } catch (err: any) {
    console.warn('[PocketBase] Falha ao registrar log de auditoria:', err?.message);
  }
};

/**
 * Recupera os logs de auditoria em ordem cronológica reversa (mais recentes primeiro).
 */
export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  if (!isPocketBaseConfigured) return [];
  try {
    const records = await pb.collection('audit_logs').getFullList({
      requestKey: null,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    const safeList = Array.isArray(records) ? [...records] : [];
    return safeList.reverse().map((r) => ({
      id: r.id,
      action: r.action || 'Ação Registrada',
      section: r.section || 'Geral',
      user_email: r.user_email || '',
      details: r.details || '',
      created: r.created || r.updated || '',
    }));
  } catch (err: any) {
    console.error('[PocketBase] Erro ao carregar logs de auditoria:', err);
    return [];
  }
};

/* ==============================================================================
   SERVIÇO DE ALTERAÇÃO DE SENHA (POCKETBASE)
   ============================================================================== */

export const changeAdminPassword = async (
  oldPassword: string,
  newPassword: string,
  newPasswordConfirm: string
): Promise<void> => {
  const currentRecord = pb.authStore.record || (pb.authStore as any).model;
  if (!pb.authStore.isValid || !currentRecord?.id) {
    throw new Error('Sessão expirada ou usuário não autenticado. Faça login novamente.');
  }

  if (!oldPassword) {
    throw new Error('Informe sua senha atual.');
  }

  if (newPassword.length < 8) {
    throw new Error('A nova senha deve possuir pelo menos 8 caracteres.');
  }

  if (newPassword !== newPasswordConfirm) {
    throw new Error('A confirmação da nova senha não confere.');
  }

  const userId = currentRecord.id;
  const collectionName = currentRecord.collectionName || 'users';

  try {
    await pb.collection(collectionName).update(userId, {
      oldPassword,
      password: newPassword,
      passwordConfirm: newPasswordConfirm,
    });

    await logAuditEvent(
      'Alteração de Senha',
      'A senha do administrador foi alterada com sucesso.',
      'Segurança & Acesso'
    );
  } catch (err: any) {
    const msg =
      err?.data?.data?.oldPassword?.message ||
      err?.data?.message ||
      err?.message ||
      'Falha ao alterar senha. Verifique se a senha atual está correta.';
    throw new Error(msg);
  }
};

/* ==============================================================================
   SERVIÇOS DE BANNERS (POCKETBASE)
   ============================================================================== */

export const fetchBannersFromDb = async (): Promise<Banner[]> => {
  if (!isPocketBaseConfigured) {
    return [];
  }

  try {
    const records = await pb.collection('banners').getFullList({
      requestKey: null,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
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
    return [];
  } catch (error: any) {
    console.error('[PocketBase] Erro ao carregar banners do banco remoto:', error?.message);
    throw new Error(`Falha ao conectar ao servidor de banners: ${error?.message}`);
  }
};

export const upsertBannerToDb = async (banner: Banner): Promise<Banner> => {
  if (!isPocketBaseConfigured) {
    throw new Error('Servidor PocketBase não configurado.');
  }

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

  try {
    // 1. Busca estrita pelo campo section para garantir isolamento absoluto entre registros
    let targetRecord: any = null;
    try {
      targetRecord = await pb
        .collection('banners')
        .getFirstListItem(`section="${banner.section}"`, { requestKey: null });
    } catch {}

    let record: any;
    if (targetRecord) {
      // Atualiza estritamente o registro que pertence a esta section
      record = await pb.collection('banners').update(targetRecord.id, payload);
    } else if (banner.id && !banner.id.startsWith('local-') && !banner.id.startsWith('banner-')) {
      const checkRec = await pb.collection('banners').getOne(banner.id).catch(() => null);
      if (checkRec && checkRec.section === banner.section) {
        record = await pb.collection('banners').update(banner.id, payload);
      } else {
        record = await pb.collection('banners').create(payload);
      }
    } else {
      record = await pb.collection('banners').create(payload);
    }

    const savedRecord: Banner = {
      id: record.id,
      ...payload,
      created_at: record.created,
      updated_at: record.updated,
    };

    // Notifica em tempo real a landing page e componentes abertos na mesma janela
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('paula_banners_updated'));
    }

    return savedRecord;
  } catch (error: any) {
    console.error('[PocketBase] Erro ao salvar banner:', error);
    const msg = error?.data?.message || error?.message || 'Falha ao salvar banner no banco remoto.';
    throw new Error(`Erro ao salvar banner no PocketBase: ${msg}`);
  }
};

/* ==============================================================================
   SERVIÇOS DE EMPREENDIMENTOS (PROPERTIES)
   ============================================================================== */

export const fetchPropertiesFromDb = async (): Promise<Property[]> => {
  if (!isPocketBaseConfigured) {
    return INITIAL_PROPERTIES;
  }

  try {
    const records = await pb.collection('properties').getFullList({
      sort: 'order_index',
      requestKey: null,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    if (records && records.length > 0) {
      return records.map((r) => ({
        id: r.id,
        title: r.title,
        tag: r.tag || null,
        location: r.location,
        description: r.description || null,
        image_url: r.image_url,
        progress_cover_image: r.progress_cover_image || null,
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
    return [];
  } catch (error: any) {
    console.error('[PocketBase] Erro ao carregar empreendimentos do banco:', error?.message);
    throw new Error(`Falha ao conectar com PocketBase para carregar empreendimentos: ${error?.message}`);
  }
};

export const savePropertyToDb = async (property: Partial<Property>): Promise<Property> => {
  if (!isPocketBaseConfigured) {
    throw new Error('Servidor PocketBase não configurado.');
  }

  const payload: Record<string, any> = {
    title: property.title || '',
    tag: property.tag || 'LANÇAMENTO',
    location: property.location || '',
    description: property.description || '',
    image_url: property.image_url || '',
    progress_cover_image: property.progress_cover_image || '',
    is_featured: property.is_featured ?? true,
    is_construction: property.is_construction ?? false,
    action_type: property.action_type || 'dates_modal',
    action_url: property.action_url || '',
    media_type: property.media_type || 'photos',
    gallery_images: property.gallery_images || [],
    gallery_videos: property.gallery_videos || [],
    order_index: property.order_index ?? 0,
  };

  try {
    let existingId = property.id;

    // Se o ID for de mock/local ('prop-...' ou 'local-'), tenta encontrar o registro existente no PocketBase pelo título
    if (!existingId || existingId.startsWith('prop-') || existingId.startsWith('local-')) {
      try {
        const cleanTitle = (property.title || '').replace(/"/g, '\\"');
        const existing = await pb
          .collection('properties')
          .getFirstListItem(`title="${cleanTitle}"`, { requestKey: null });
        if (existing) {
          existingId = existing.id;
        }
      } catch {}
    }

    let record;
    if (existingId && !existingId.startsWith('prop-') && !existingId.startsWith('local-')) {
      record = await pb.collection('properties').update(existingId, payload);
    } else {
      record = await pb.collection('properties').create(payload);
    }

    // Notifica em tempo real a landing page e componentes abertos na mesma janela
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('paula_properties_updated'));
    }

    return {
      id: record.id,
      ...payload,
      created_at: record.created,
      updated_at: record.updated,
    } as Property;
  } catch (error: any) {
    console.error('[PocketBase] Erro ao salvar empreendimento:', error);
    const msg = error?.data?.message || error?.message || 'Falha ao salvar empreendimento no PocketBase.';
    throw new Error(`Erro ao salvar empreendimento no servidor: ${msg}`);
  }
};

export const deletePropertyFromDb = async (id: string): Promise<void> => {
  if (!isPocketBaseConfigured) {
    throw new Error('PocketBase não configurado.');
  }

  try {
    await pb.collection('properties').delete(id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('paula_properties_updated'));
    }
  } catch (error: any) {
    console.error('[PocketBase] Erro ao excluir empreendimento:', error);
    throw new Error(`Erro ao excluir empreendimento no PocketBase: ${error?.message}`);
  }
};

/* ==============================================================================
   SERVIÇOS DE CAMPANHAS / POP-UP (CAMPAIGNS)
   ============================================================================== */

export const fetchCampaignsFromDb = async (): Promise<Campaign[]> => {
  if (!isPocketBaseConfigured) {
    return [];
  }

  try {
    const records = await pb.collection('campaigns').getFullList({
      requestKey: null,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
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
    return [];
  } catch (error: any) {
    console.error('[PocketBase] Erro ao carregar campanhas:', error?.message);
    throw new Error(`Falha ao carregar campanhas no PocketBase: ${error?.message}`);
  }
};

export const saveCampaignToDb = async (campaign: Partial<Campaign>): Promise<Campaign> => {
  if (!isPocketBaseConfigured) {
    throw new Error('PocketBase não configurado.');
  }

  const payload = {
    title: campaign.title || '',
    media_type: campaign.media_type || 'image',
    image_url: campaign.image_url || '',
    video_url: campaign.video_url || null,
    video_duration: campaign.video_duration || null,
    target_link: campaign.target_link || '',
    is_active: campaign.is_active ?? false,
  };

  try {
    if (payload.is_active) {
      // Desativa outras campanhas ativas no banco para garantir unicidade
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
      } catch (err: any) {
        console.warn('[PocketBase] Aviso ao desativar outras campanhas:', err?.message);
      }
    }

    let existingId = campaign.id;

    // Se o ID for de mock/local ('camp-...' ou 'local-'), tenta encontrar o registro existente pelo título
    if (!existingId || existingId.startsWith('camp-') || existingId.startsWith('local-')) {
      try {
        const cleanTitle = (campaign.title || '').replace(/"/g, '\\"');
        const existing = await pb
          .collection('campaigns')
          .getFirstListItem(`title="${cleanTitle}"`, { requestKey: null });
        if (existing) {
          existingId = existing.id;
        }
      } catch {}
    }

    let record;
    if (existingId && !existingId.startsWith('camp-') && !existingId.startsWith('local-')) {
      record = await pb.collection('campaigns').update(existingId, payload);
    } else {
      record = await pb.collection('campaigns').create(payload);
    }

    // Notifica em tempo real a landing page e componentes abertos na mesma janela
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('paula_campaigns_updated'));
    }

    return {
      id: record.id,
      ...payload,
      created_at: record.created,
    } as Campaign;
  } catch (error: any) {
    console.error('[PocketBase] Erro ao salvar campanha:', error);
    const msg = error?.data?.message || error?.message || 'Falha ao salvar campanha.';
    throw new Error(`Erro ao salvar campanha no PocketBase: ${msg}`);
  }
};

export const deleteCampaignFromDb = async (id: string): Promise<void> => {
  if (!isPocketBaseConfigured) {
    throw new Error('PocketBase não configurado.');
  }

  try {
    await pb.collection('campaigns').delete(id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('paula_campaigns_updated'));
    }
  } catch (error: any) {
    console.error('[PocketBase] Erro ao excluir campanha:', error);
    throw new Error(`Erro ao excluir campanha no PocketBase: ${error?.message}`);
  }
};

/* ==============================================================================
   UPLOAD DE ARQUIVOS (STORAGE / POCKETBASE UPLOADS)
   ============================================================================== */

export const uploadBannerFile = async (
  file: File,
  _prefix = 'banners'
): Promise<{ path: string; publicUrl: string }> => {
  if (!isPocketBaseConfigured) {
    throw new Error('PocketBase não configurado para upload de arquivos.');
  }

  if (!file || !(file instanceof File)) {
    throw new Error('Arquivo de imagem inválido ou não fornecido.');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', `${_prefix}-${Date.now()}`);

    const record = await pb.collection('uploads').create(formData, { requestKey: null });

    let publicUrl = '';
    try {
      publicUrl = pb.files.getUrl(record, record.file);
    } catch {
      publicUrl = `${POCKETBASE_URL}/api/files/uploads/${record.id}/${record.file}`;
    }

    if (!publicUrl) {
      publicUrl = `${POCKETBASE_URL}/api/files/uploads/${record.id}/${record.file}`;
    }

    return {
      path: publicUrl,
      publicUrl,
    };
  } catch (error: any) {
    console.error('[PocketBase] Erro no upload de arquivo:', error);
    throw new Error(
      `Falha no upload do arquivo para o PocketBase: ${
        error?.data?.message || error?.message || 'Verifique o formato e tamanho do arquivo.'
      }`
    );
  }
};
