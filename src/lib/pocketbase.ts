import PocketBase from 'pocketbase';
import { compressImage } from './imageOptimizer';
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
export const getImageUrl = (
  imagePath?: string | null | Record<string, any>,
  thumb?: string
): string => {
  if (!imagePath) return '';

  const applyThumb = (url: string): string => {
    if (!thumb || !url) return url;
    // Não aplica thumbnail em vídeos, blobs ou data URLs
    if (url.endsWith('.mp4') || url.endsWith('.webm') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    if (url.includes('?thumb=') || url.includes('&thumb=')) {
      return url;
    }
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}thumb=${encodeURIComponent(thumb)}`;
  };

  // Se receber um record do PocketBase com objeto de arquivo
  if (typeof imagePath === 'object' && imagePath !== null) {
    if (imagePath.collectionId && imagePath.id && imagePath.file) {
      try {
        const fileUrl = (pb.files as any).getURL 
          ? (pb.files as any).getURL(imagePath as any, imagePath.file, thumb ? { thumb } : undefined)
          : pb.files.getUrl(imagePath as any, imagePath.file);
        return applyThumb(fileUrl);
      } catch {
        const raw = `${POCKETBASE_URL}/api/files/${imagePath.collectionId}/${imagePath.id}/${imagePath.file}`;
        return applyThumb(raw);
      }
    }
    if (imagePath.collectionId && imagePath.id && imagePath.image) {
      try {
        const fileUrl = (pb.files as any).getURL
          ? (pb.files as any).getURL(imagePath as any, imagePath.image, thumb ? { thumb } : undefined)
          : pb.files.getUrl(imagePath as any, imagePath.image);
        return applyThumb(fileUrl);
      } catch {
        const raw = `${POCKETBASE_URL}/api/files/${imagePath.collectionId}/${imagePath.id}/${imagePath.image}`;
        return applyThumb(raw);
      }
    }
    if (imagePath.image_path) {
      return getImageUrl(imagePath.image_path, thumb);
    }
    if (imagePath.image_url) {
      return getImageUrl(imagePath.image_url, thumb);
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
    return applyThumb(str);
  }

  // Se for um caminho de arquivo do PocketBase (/api/files/... ou api/files/...)
  if (str.startsWith('/api/files/')) {
    return applyThumb(`${POCKETBASE_URL}${str}`);
  }
  if (str.startsWith('api/files/')) {
    return applyThumb(`${POCKETBASE_URL}/${str}`);
  }

  // Se for caminho de upload relativo (ex: uploads/id/file ou /uploads/id/file)
  if (str.startsWith('/uploads/') || str.startsWith('uploads/')) {
    const clean = str.replace(/^\/?uploads\//, '');
    return applyThumb(`${POCKETBASE_URL}/api/files/uploads/${clean}`);
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
    // Comprime e redimensiona em tempo real no cliente antes do upload (max 1080px e <= 1MB)
    let uploadFile = file;
    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml' && file.type !== 'image/gif') {
      try {
        uploadFile = await compressImage(file, {
          maxDimension: 1080,
          maxSizeBytes: 1024 * 1024,
          initialQuality: 0.84,
        });
      } catch (optErr) {
        console.warn('[PocketBase] Falha na compressão automática de upload, enviando arquivo original:', optErr);
      }
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', `${_prefix}-${Date.now()}`);

    const record = await pb.collection('uploads').create(formData, { requestKey: null });

    let publicUrl = '';
    try {
      publicUrl = (pb.files as any).getURL 
        ? (pb.files as any).getURL(record, record.file) 
        : pb.files.getUrl(record, record.file);
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

/* ==============================================================================
   GESTÃO DE CLIENTES & LOGS DE ACESSO (EVOLUÇÃO DA OBRA)
   ============================================================================== */

export interface Client {
  id: string;
  name: string;
  cpf: string;
  active: boolean;
  created?: string;
  updated?: string;
}

export interface AccessLog {
  id: string;
  client_id?: string;
  client_name: string;
  cpf: string;
  access_count: number;
  last_access: string;
  created?: string;
}

const LOCAL_STORAGE_CLIENTS_KEY = 'paula_clients_local_db';
const LOCAL_STORAGE_ACCESS_LOGS_KEY = 'paula_access_logs_local_db';

/** Formata string de CPF para 000.000.000-00 */
export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/** Remove pontuações do CPF */
export function cleanCpf(value: string): string {
  return value.replace(/\D/g, '');
}

export const fetchClientsFromDb = async (): Promise<Client[]> => {
  if (isPocketBaseConfigured) {
    try {
      let records: any[] = [];
      try {
        // Tenta buscar com ordenação decrescente por created se existir
        records = await pb.collection('clients').getFullList({
          sort: '-created',
          requestKey: null,
        });
      } catch {
        // Fallback para listagem padrão sem sort caso a coluna created não esteja indexada
        records = await pb.collection('clients').getFullList({
          requestKey: null,
        });
      }

      if (records && records.length > 0) {
        const mapped = records.map((r) => ({
          id: r.id,
          name: r.name,
          cpf: formatCpf(r.cpf),
          active: r.active ?? true,
          created: r.created || '',
          updated: r.updated || '',
        })) as Client[];

        return mapped.sort((a, b) => {
          if (a.created && b.created) {
            return new Date(b.created).getTime() - new Date(a.created).getTime();
          }
          return (a.name || '').localeCompare(b.name || '');
        });
      }
    } catch (err: any) {
      console.warn('[PocketBase] Aviso ao buscar clientes:', err?.message);
    }
  }

  // Fallback Local Storage
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_CLIENTS_KEY);
    if (local) return JSON.parse(local);
  } catch (e) {}

  return [];
};

export const saveClientToDb = async (client: { name: string; cpf: string; active?: boolean }): Promise<Client> => {
  const formattedCpf = formatCpf(client.cpf);
  const rawCpf = cleanCpf(client.cpf);

  if (rawCpf.length !== 11) {
    throw new Error('O CPF informado deve conter exatamente 11 dígitos.');
  }

  if (!client.name || client.name.trim().length < 2) {
    throw new Error('Informe o nome completo do cliente.');
  }

  const payload = {
    name: client.name.trim(),
    cpf: formattedCpf,
    active: client.active ?? true,
  };

  if (isPocketBaseConfigured) {
    try {
      // Verifica duplicidade no PocketBase
      try {
        const existing = await pb.collection('clients').getFirstListItem(
          `cpf = "${formattedCpf}" || cpf = "${rawCpf}"`,
          { requestKey: null }
        );
        if (existing) {
          throw new Error(`O CPF ${formattedCpf} já está cadastrado para ${existing.name}.`);
        }
      } catch (err: any) {
        if (err.message?.includes('já está cadastrado')) throw err;
      }

      const record = await pb.collection('clients').create(payload);
      return {
        id: record.id,
        name: record.name,
        cpf: formatCpf(record.cpf),
        active: record.active,
        created: record.created,
        updated: record.updated,
      };
    } catch (err: any) {
      console.error('[PocketBase] Erro ao cadastrar cliente:', err);
      throw new Error(err?.data?.message || err?.message || 'Falha ao cadastrar cliente no servidor.');
    }
  }

  // Fallback Local Storage
  const list = await fetchClientsFromDb();
  if (list.some((c) => cleanCpf(c.cpf) === rawCpf)) {
    throw new Error(`O CPF ${formattedCpf} já está cadastrado.`);
  }

  const newClient: Client = {
    id: `local-client-${Date.now()}`,
    ...payload,
    created: new Date().toISOString(),
  };

  list.unshift(newClient);
  localStorage.setItem(LOCAL_STORAGE_CLIENTS_KEY, JSON.stringify(list));
  return newClient;
};

export const toggleClientStatusInDb = async (id: string, active: boolean): Promise<Client> => {
  if (isPocketBaseConfigured && !id.startsWith('local-')) {
    try {
      const record = await pb.collection('clients').update(id, { active });
      return {
        id: record.id,
        name: record.name,
        cpf: formatCpf(record.cpf),
        active: record.active,
        created: record.created,
        updated: record.updated,
      };
    } catch (err: any) {
      console.error('[PocketBase] Erro ao alterar status do cliente:', err);
      throw new Error(`Falha ao alterar status do cliente: ${err?.message}`);
    }
  }

  // Fallback Local Storage
  const list = await fetchClientsFromDb();
  const idx = list.findIndex((c) => c.id === id);
  if (idx >= 0) {
    list[idx].active = active;
    list[idx].updated = new Date().toISOString();
    localStorage.setItem(LOCAL_STORAGE_CLIENTS_KEY, JSON.stringify(list));
    return list[idx];
  }
  throw new Error('Cliente não encontrado.');
};

export const deleteClientFromDb = async (id: string): Promise<void> => {
  if (isPocketBaseConfigured && !id.startsWith('local-')) {
    try {
      await pb.collection('clients').delete(id);
    } catch (err: any) {
      console.error('[PocketBase] Erro ao excluir cliente:', err);
      throw new Error(`Falha ao excluir cliente: ${err?.message}`);
    }
  }

  const list = await fetchClientsFromDb();
  const filtered = list.filter((c) => c.id !== id);
  localStorage.setItem(LOCAL_STORAGE_CLIENTS_KEY, JSON.stringify(filtered));
};

/** Valida CPF informado na entrada da Evolução da Obra */
export const verifyClientCpf = async (inputCpf: string): Promise<{ valid: boolean; client?: Client; error?: string }> => {
  const formatted = formatCpf(inputCpf);
  const raw = cleanCpf(inputCpf);

  if (raw.length !== 11) {
    return { valid: false, error: 'Informe um CPF válido com 11 dígitos.' };
  }

  if (isPocketBaseConfigured) {
    try {
      // Busca cliente pelo CPF
      let record: any = null;
      try {
        record = await pb.collection('clients').getFirstListItem(
          `cpf = "${formatted}" || cpf = "${raw}"`,
          { requestKey: null }
        );
      } catch (e) {}

      if (record) {
        if (!record.active) {
          return {
            valid: false,
            error: 'Usuário não localizado, entre em contato e solicite seu acesso.',
          };
        }

        const client: Client = {
          id: record.id,
          name: record.name,
          cpf: formatCpf(record.cpf),
          active: record.active,
        };

        // Registra log de acesso em segundo plano
        recordAccessLog(client).catch(() => {});

        return { valid: true, client };
      }
    } catch (err) {
      console.warn('[PocketBase] Erro ao verificar CPF no servidor:', err);
    }
  }

  // Fallback Local Storage
  const localList = await fetchClientsFromDb();
  const found = localList.find((c) => cleanCpf(c.cpf) === raw);
  if (found) {
    if (!found.active) {
      return {
        valid: false,
        error: 'Usuário não localizado, entre em contato e solicite seu acesso.',
      };
    }
    recordAccessLog(found).catch(() => {});
    return { valid: true, client: found };
  }

  return {
    valid: false,
    error: 'Usuário não localizado, entre em contato e solicite seu acesso.',
  };
};

export const fetchAccessLogsFromDb = async (): Promise<AccessLog[]> => {
  if (isPocketBaseConfigured) {
    try {
      const records = await pb.collection('access_logs').getFullList({
        sort: '-last_access',
        requestKey: null,
      });
      if (records && records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          client_id: r.client_id,
          client_name: r.client_name,
          cpf: formatCpf(r.cpf),
          access_count: r.access_count || 1,
          last_access: r.last_access || r.created,
          created: r.created,
        })) as AccessLog[];
      }
    } catch (err) {}
  }

  // Fallback Local Storage
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_ACCESS_LOGS_KEY);
    if (local) return JSON.parse(local);
  } catch (e) {}

  return [];
};

export const recordAccessLog = async (client: Client): Promise<AccessLog> => {
  const formattedCpf = formatCpf(client.cpf);
  const now = new Date().toISOString();

  if (isPocketBaseConfigured) {
    try {
      // Verifica se já existe um log para este CPF
      let existingLog: any = null;
      try {
        existingLog = await pb.collection('access_logs').getFirstListItem(
          `cpf = "${formattedCpf}" || cpf = "${cleanCpf(client.cpf)}"`,
          { requestKey: null }
        );
      } catch (e) {}

      if (existingLog) {
        const updated = await pb.collection('access_logs').update(existingLog.id, {
          client_name: client.name,
          access_count: (existingLog.access_count || 1) + 1,
          last_access: now,
        });
        return {
          id: updated.id,
          client_id: updated.client_id,
          client_name: updated.client_name,
          cpf: formatCpf(updated.cpf),
          access_count: updated.access_count,
          last_access: updated.last_access,
        };
      } else {
        const created = await pb.collection('access_logs').create({
          client_id: client.id,
          client_name: client.name,
          cpf: formattedCpf,
          access_count: 1,
          last_access: now,
        });
        return {
          id: created.id,
          client_id: created.client_id,
          client_name: created.client_name,
          cpf: formatCpf(created.cpf),
          access_count: created.access_count,
          last_access: created.last_access,
        };
      }
    } catch (err) {
      console.warn('[PocketBase] Falha ao registrar log no servidor:', err);
    }
  }

  // Fallback Local Storage
  const logs = await fetchAccessLogsFromDb();
  const existingIdx = logs.findIndex((l) => cleanCpf(l.cpf) === cleanCpf(client.cpf));
  let resultLog: AccessLog;

  if (existingIdx >= 0) {
    logs[existingIdx].access_count = (logs[existingIdx].access_count || 1) + 1;
    logs[existingIdx].last_access = now;
    logs[existingIdx].client_name = client.name;
    resultLog = logs[existingIdx];
  } else {
    resultLog = {
      id: `local-log-${Date.now()}`,
      client_id: client.id,
      client_name: client.name,
      cpf: formattedCpf,
      access_count: 1,
      last_access: now,
      created: now,
    };
    logs.unshift(resultLog);
  }

  localStorage.setItem(LOCAL_STORAGE_ACCESS_LOGS_KEY, JSON.stringify(logs));
  return resultLog;
};

/* ==============================================================================
   GESTÃO DE USUÁRIOS ADMINISTRADORES DO PAINEL (COLEÇÃO USERS)
   ============================================================================== */

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  created?: string;
  updated?: string;
}

export const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  if (!isPocketBaseConfigured) return [];
  try {
    const records = await pb.collection('users').getFullList({
      sort: '-created',
      requestKey: null,
    });
    return records.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name || 'Administrador',
      created: r.created,
      updated: r.updated,
    }));
  } catch (err: any) {
    console.warn('[PocketBase] Falha ao listar administradores:', err?.message);
    return [];
  }
};

export const createAdminUser = async (data: {
  email: string;
  password: string;
  passwordConfirm: string;
  name?: string;
}): Promise<AdminUser> => {
  if (!isPocketBaseConfigured) {
    throw new Error('PocketBase não configurado.');
  }

  const cleanEmail = data.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Informe um e-mail válido para o administrador.');
  }

  if (!data.password || data.password.length < 8) {
    throw new Error('A senha deve possuir no mínimo 8 caracteres.');
  }

  const hasLetter = /[a-zA-Z]/.test(data.password);
  const hasNumber = /[0-9]/.test(data.password);
  if (!hasLetter || !hasNumber) {
    throw new Error('A senha deve ser alfanumérica (conter letras e números).');
  }

  if (data.password !== data.passwordConfirm) {
    throw new Error('A confirmação de senha não confere com a senha informada.');
  }

  try {
    const record = await pb.collection('users').create({
      email: cleanEmail,
      password: data.password,
      passwordConfirm: data.passwordConfirm,
      name: data.name?.trim() || 'Administrador',
      emailVisibility: true,
    });

    return {
      id: record.id,
      email: record.email,
      name: record.name,
      created: record.created,
      updated: record.updated,
    };
  } catch (err: any) {
    console.error('[PocketBase] Erro ao criar administrador:', err);
    const msg =
      err?.data?.data?.email?.message ||
      err?.data?.data?.password?.message ||
      err?.data?.message ||
      err?.message ||
      'Falha ao criar usuário administrador.';
    throw new Error(msg);
  }
};

export const deleteAdminUser = async (id: string): Promise<void> => {
  if (!isPocketBaseConfigured) {
    throw new Error('PocketBase não configurado.');
  }
  try {
    await pb.collection('users').delete(id);
  } catch (err: any) {
    console.error('[PocketBase] Erro ao excluir administrador:', err);
    throw new Error(err?.data?.message || err?.message || 'Falha ao excluir usuário administrador.');
  }
};

