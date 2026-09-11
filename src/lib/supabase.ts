/**
 * CAMADA DE COMPATIBILIDADE: SUPABASE -> POCKETBASE
 * 
 * Reexporta todos os métodos de leitura, gravação, upload e resolução de URLs
 * a partir de src/lib/pocketbase.ts.
 * Garante que hooks e componentes continuem funcionando sem alterações invasivas.
 */

export {
  pb,
  POCKETBASE_URL,
  isPocketBaseConfigured,
  isPocketBaseConfigured as isSupabaseConfigured,
  getImageUrl,
  fetchBannersFromDb,
  upsertBannerToDb,
  fetchPropertiesFromDb,
  savePropertyToDb,
  deletePropertyFromDb,
  fetchCampaignsFromDb,
  saveCampaignToDb,
  deleteCampaignFromDb,
  uploadBannerFile,
  logAuditEvent,
  fetchAuditLogs,
  changeAdminPassword,
  fetchClientsFromDb,
  saveClientToDb,
  toggleClientStatusInDb,
  deleteClientFromDb,
  verifyClientCpf,
  fetchAccessLogsFromDb,
  recordAccessLog,
  formatCpf,
  cleanCpf,
  type AuditLog,
  type Client,
  type AccessLog,
} from './pocketbase';

export const BUCKET_NAME = 'uploads';

// Instância nula para compatibilidade com verificações legadas 'if (supabase)'
export const supabase = null;
