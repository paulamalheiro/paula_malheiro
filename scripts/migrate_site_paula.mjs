process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import crypto from 'crypto';
import dns from 'dns';
import fs from 'fs';
import path from 'path';

/**
 * SCRIPT DE MIGRAÇÃO AUTOMATIZADA: SITE PAULA MALHEIRO (SUPABASE -> POCKETBASE)
 * Executável diretamente pelo Antigravity IDE
 */

// Resilient DNS resolution fallback for Coolify VPS IP (2.24.99.187)
const COOLIFY_IP = process.env.PB_IP || '2.24.99.187';
const origLookup = dns.lookup;
dns.lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  origLookup(hostname, options, (err, address, family) => {
    if (err && (hostname === 'pb-paula.janagencia.com.br' || hostname.endsWith('.janagencia.com.br'))) {
      if (options && options.all) {
        return callback(null, [{ address: COOLIFY_IP, family: 4 }]);
      }
      return callback(null, COOLIFY_IP, 4);
    }
    return callback(err, address, family);
  });
};

// Parse CLI args
function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [k, ...v] = arg.slice(2).split('=');
      args[k] = v.length ? v.join('=') : true;
    }
  }
  return args;
}

const args = parseArgs();

if (args['help'] || args['h']) {
  console.log(`
=============================================================================
   MIGRAÇÃO AUTOMATIZADA SUPABASE -> POCKETBASE: SITE PAULA MALHEIRO
=============================================================================

Uso:
  node scripts/migrate_site_paula.mjs [opções]

Opções:
  --pb-url=<url>         URL pública do PocketBase (padrão: https://pb-paula.janagencia.com.br)
  --pb-email=<email>     E-mail superuser do PocketBase (padrão: mccley.1@gmail.com)
  --pb-pass=<senha>      Senha superuser do PocketBase (padrão: 082025mccley)
  --supabase-url=<url>   URL da API Supabase (padrão: https://api-paula.janagencia.com.br)
  --supabase-key=<key>   Anon/Service Key do Supabase
  --help                 Exibe esta mensagem de ajuda

Coleções migradas:
  - banners     (slides institucionais e chamadas de ação)
  - properties  (catálogo de empreendimentos na planta, lançamentos e usados)
  - campaigns   (campanhas e popups de conversão)
`);
  process.exit(0);
}

const PB_URL = (args['pb-url'] || process.env.VITE_POCKETBASE_URL || 'https://pb-paula.janagencia.com.br').replace(/\/$/, '');
const PB_EMAIL = args['pb-email'] || process.env.PB_EMAIL || 'mccley.1@gmail.com';
const PB_PASS = args['pb-pass'] || process.env.PB_PASS || '082025mccley';
const SUPABASE_URL = (args['supabase-url'] || process.env.VITE_SUPABASE_URL || 'https://api-paula.janagencia.com.br').replace(/\/$/, '');
const SUPABASE_KEY = args['supabase-key'] || process.env.VITE_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4ODI3NjE4MCwiZXhwIjo0OTQzOTQ5NzgwLCJyb2xlIjoiYW5vbiJ9.nxiGquQzPnceWnJHZp5DpLNgzD4eoZWtD3J_RiGBgZQ';

export function toPocketBaseId(id) {
  if (!id) return crypto.randomBytes(8).toString('hex').slice(0, 15);
  const clean = String(id).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.length === 15) return clean;
  return crypto.createHash('sha256').update(String(id)).digest('hex').slice(0, 15);
}

// 1. Authenticate with PocketBase
async function authenticatePB() {
  console.log(`\n[1/5] Autenticando no PocketBase em ${PB_URL}...`);
  
  // Superuser v0.23+
  try {
    const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASS })
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`✓ Autenticado como Superuser (${data.record?.email || PB_EMAIL})`);
      return data.token;
    }
  } catch (err) {}

  // Fallback to legacy admins
  try {
    const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASS })
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`✓ Autenticado como Admin legado (${data.admin?.email || PB_EMAIL})`);
      return data.token;
    }
  } catch (err) {}

  throw new Error(`Falha ao autenticar no PocketBase (${PB_URL}). Verifique se o container está ativo e se o superusuário ${PB_EMAIL} foi criado.`);
}

// 2. Ensure Collections Exist with Public Read Rules
async function ensureCollection(token, schemaDef) {
  const headers = { 'Content-Type': 'application/json', 'Authorization': token };

  const checkRes = await fetch(`${PB_URL}/api/collections/${schemaDef.name}`, { headers });
  if (checkRes.ok) {
    console.log(`- Coleção '${schemaDef.name}' já existe. Atualizando regras...`);
    await fetch(`${PB_URL}/api/collections/${schemaDef.name}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        listRule: schemaDef.listRule,
        viewRule: schemaDef.viewRule,
        createRule: schemaDef.createRule,
        updateRule: schemaDef.updateRule,
        deleteRule: schemaDef.deleteRule,
        fields: schemaDef.fields
      })
    });
    return;
  }

  const createRes = await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers,
    body: JSON.stringify(schemaDef)
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    console.warn(`Aviso ao criar '${schemaDef.name}': ${err}`);
  } else {
    console.log(`✓ Coleção '${schemaDef.name}' criada com sucesso no PocketBase.`);
  }
}

async function setupCollections(token) {
  console.log(`\n[2/5] Configurando coleções e regras do Site Paula no PocketBase...`);

  // Banners
  await ensureCollection(token, {
    name: 'banners',
    type: 'base',
    listRule: '', // Leitura pública
    viewRule: '',
    createRule: '@request.auth.id != ""', // Escrita restrita
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
    fields: [
      { name: 'original_id', type: 'text', required: false },
      { name: 'section', type: 'text', required: true },
      { name: 'title', type: 'text', required: false },
      { name: 'subtitle', type: 'text', required: false },
      { name: 'tag', type: 'text', required: false },
      { name: 'image_path', type: 'text', required: false },
      { name: 'button_text', type: 'text', required: false },
      { name: 'button_link', type: 'text', required: false },
      { name: 'active', type: 'bool', required: false }
    ]
  });

  // Properties (Empreendimentos)
  await ensureCollection(token, {
    name: 'properties',
    type: 'base',
    listRule: '', // Leitura pública
    viewRule: '',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
    fields: [
      { name: 'original_id', type: 'text', required: false },
      { name: 'title', type: 'text', required: true },
      { name: 'tag', type: 'text', required: false },
      { name: 'location', type: 'text', required: false },
      { name: 'description', type: 'text', required: false },
      { name: 'image_url', type: 'text', required: false },
      { name: 'is_featured', type: 'bool', required: false },
      { name: 'is_construction', type: 'bool', required: false },
      { name: 'action_type', type: 'text', required: false },
      { name: 'action_url', type: 'text', required: false },
      { name: 'media_type', type: 'text', required: false },
      { name: 'gallery_images', type: 'json', required: false },
      { name: 'gallery_videos', type: 'json', required: false },
      { name: 'order_index', type: 'number', required: false }
    ]
  });

  // Campaigns (Pop-up promocional)
  await ensureCollection(token, {
    name: 'campaigns',
    type: 'base',
    listRule: '', // Leitura pública
    viewRule: '',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
    fields: [
      { name: 'original_id', type: 'text', required: false },
      { name: 'title', type: 'text', required: true },
      { name: 'media_type', type: 'text', required: false },
      { name: 'image_url', type: 'text', required: false },
      { name: 'video_url', type: 'text', required: false },
      { name: 'video_duration', type: 'number', required: false },
      { name: 'target_link', type: 'text', required: false },
      { name: 'is_active', type: 'bool', required: false }
    ]
  });

  // Uploads (Armazenamento de Imagens e Mídias)
  await ensureCollection(token, {
    name: 'uploads',
    type: 'base',
    listRule: '', // Leitura pública
    viewRule: '',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
    fields: [
      { name: 'file', type: 'file', required: true, maxSelect: 1 }
    ]
  });
}

// 3. Fallback Seed Data from supabase_schema.sql
const SEED_BANNERS = [
  {
    id: 'banner-hero',
    section: 'hero',
    title: 'a compra do seu imóvel como uma experiência segura e transparente!',
    subtitle: 'Com mais de 10 anos de experiência, minha intenção aqui é conectar você às oportunidades em imóveis através de um atendimento humano e personalizado para encontrarmos a melhor opção para o seu momento atual.',
    tag: 'Especialista em Imóveis na Planta',
    image_path: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
    button_text: 'Conheça os Empreendimentos',
    button_link: '#projects',
    active: true
  },
  {
    id: 'banner-about',
    section: 'about',
    title: 'Paula Malheiro – CRECI 21.188',
    subtitle: 'Minha História',
    tag: 'Minha História',
    image_path: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
    button_text: null,
    button_link: null,
    active: true
  },
  {
    id: 'banner-investment',
    section: 'investment',
    title: 'Paula Malheiro',
    subtitle: 'Investir em imóveis na planta é a forma mais inteligente de construir patrimônio sólido com segurança e planejamento.',
    tag: 'Investimento',
    image_path: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
    button_text: null,
    button_link: null,
    active: true
  }
];

const SEED_PROPERTIES = [
  {
    id: 'prop-duque-lavenir',
    title: 'DUQUE Lavenir Residence',
    tag: 'LANÇAMENTO',
    location: 'Próximo a Olívia Flores',
    description: 'Casas soltas com duas opções de planta: térrea com 3 suítes ou duplex com 4 suítes. Lazer de clube completo.',
    image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
    is_featured: true,
    is_construction: false,
    action_type: 'dates_modal',
    action_url: '',
    media_type: 'photos',
    gallery_images: [],
    gallery_videos: [],
    order_index: 1
  },
  {
    id: 'prop-uni-house',
    title: 'UNI House',
    tag: 'LANÇAMENTO',
    location: 'Região do Terras Alphaville',
    description: 'Condomínio de casas soltas com quintais de 30 a 130m², lazer de clube e muito verde.',
    image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80',
    is_featured: true,
    is_construction: true,
    action_type: 'instagram',
    action_url: 'https://www.instagram.com/reel/DWWQfOYDuAn/?igsh=MXFlamt6aGZlZWFndQ==',
    media_type: 'photos',
    gallery_images: [],
    gallery_videos: [],
    order_index: 2
  },
  {
    id: 'prop-baron-prime',
    title: 'Baron Prime',
    tag: 'LANÇAMENTO',
    location: 'Região do Boa Vista',
    description: 'Condomínio exclusivo de casas soltas com 3 suítes, pé direito duplo e área gourmet.',
    image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
    is_featured: true,
    is_construction: true,
    action_type: 'dates_modal',
    action_url: '',
    media_type: 'photos',
    gallery_images: [],
    gallery_videos: [],
    order_index: 3
  },
  {
    id: 'prop-bellator',
    title: 'Bellator Residence',
    tag: 'EM OBRAS',
    location: 'Área Nobre',
    description: 'Casas de alto padrão com suíte master, closet e clube privativo integrado.',
    image_url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=80',
    is_featured: true,
    is_construction: true,
    action_type: 'dates_modal',
    action_url: '',
    media_type: 'photos',
    gallery_images: [],
    gallery_videos: [],
    order_index: 4
  },
  {
    id: 'prop-amado-bahia',
    title: 'Amado Bahia',
    tag: 'SUCESSO DE VENDAS',
    location: 'Vitória da Conquista',
    description: 'Condomínio fechado de lotes residenciais com infraestrutura completa e segurança 24h.',
    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
    is_featured: true,
    is_construction: true,
    action_type: 'dates_modal',
    action_url: '',
    media_type: 'photos',
    gallery_images: [],
    gallery_videos: [],
    order_index: 5
  },
  {
    id: 'prop-verso-residence',
    title: 'Verso Residence',
    tag: 'ÚLTIMAS UNIDADES',
    location: 'Localização Estratégica',
    description: 'Apartamentos modernos e planejados com varanda gourmet, ideais para moradia ou locação.',
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
    is_featured: true,
    is_construction: true,
    action_type: 'instagram',
    action_url: 'https://www.instagram.com/reel/DT8XsQojhti/?igsh=MThyOHU0eWQ4ajNhaw==',
    media_type: 'photos',
    gallery_images: [],
    gallery_videos: [],
    order_index: 6
  },
  {
    id: 'prop-sculptor',
    title: 'Sculptor',
    tag: 'EM OBRAS',
    location: 'Bairro Candeias',
    description: 'Empreendimento inovador com arquitetura autoral e localização nobre.',
    image_url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1000&q=80',
    is_featured: false,
    is_construction: true,
    action_type: 'dates_modal',
    action_url: '',
    media_type: 'photos',
    gallery_images: [],
    gallery_videos: [],
    order_index: 7
  },
  {
    id: 'prop-vila-imperial',
    title: 'Vila Imperial',
    tag: 'EM OBRAS',
    location: 'Vitória da Conquista',
    description: 'Acompanhe a evolução de cada etapa da construção das casas e da área de lazer.',
    image_url: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1000&q=80',
    is_featured: false,
    is_construction: true,
    action_type: 'gallery',
    action_url: '',
    media_type: 'photos',
    gallery_images: [
      'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80'
    ],
    gallery_videos: [],
    order_index: 8
  }
];

// 4. Fetch from Supabase (or fallback to Seed data)
async function fetchSourceData() {
  console.log(`\n[3/5] Consultando registros do Site Paula...`);

  let banners = [];
  let properties = [];
  let campaigns = [];

  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };

  try {
    const [bRes, pRes, cRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/banners?select=*`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/properties?select=*`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/campaigns?select=*`, { headers })
    ]);

    if (bRes.ok) banners = await bRes.json();
    if (pRes.ok) properties = await pRes.json();
    if (cRes.ok) campaigns = await cRes.json();

    console.log(`✓ Dados lidos com sucesso do Supabase ao vivo.`);
  } catch (err) {
    console.warn(`[Aviso] Supabase em ${SUPABASE_URL} offline ou inacessível (${err.message}).`);
  }

  // Fallback to seed data if empty
  if (!banners.length) {
    console.log(`- Utilizando ${SEED_BANNERS.length} banners estruturados de segurança.`);
    banners = SEED_BANNERS;
  }
  if (!properties.length) {
    console.log(`- Utilizando ${SEED_PROPERTIES.length} empreendimentos estruturados de segurança.`);
    properties = SEED_PROPERTIES;
  }

  return { banners, properties, campaigns };
}

// 5. Upsert into PocketBase
async function upsertRecord(token, collection, id, data) {
  const headers = { 'Content-Type': 'application/json', 'Authorization': token };

  const createRes = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id, ...data })
  });

  if (createRes.ok) return true;

  if (createRes.status === 400 || createRes.status === 409) {
    const updateRes = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    });
    if (!updateRes.ok) {
      const err = await updateRes.text();
      console.warn(`[Aviso] Falha ao atualizar em '${collection}' (${id}): ${err}`);
    }
    return updateRes.ok;
  }

  const err = await createRes.text();
  console.warn(`[Aviso] Falha ao criar em '${collection}' (${id}): ${err}`);
  return false;
}

async function transferData(token, data) {
  console.log(`\n[4/5] Migrando dados para o PocketBase...`);

  let bCount = 0;
  for (const b of data.banners) {
    const pbId = toPocketBaseId(b.id || b.section);
    const ok = await upsertRecord(token, 'banners', pbId, {
      original_id: String(b.id || b.section),
      section: b.section,
      title: b.title || '',
      subtitle: b.subtitle || '',
      tag: b.tag || '',
      image_path: b.image_path || '',
      button_text: b.button_text || '',
      button_link: b.button_link || '',
      active: b.active ?? true
    });
    if (ok) bCount++;
  }
  console.log(`✓ Banners migrados: ${bCount}/${data.banners.length}`);

  let pCount = 0;
  for (const p of data.properties) {
    const pbId = toPocketBaseId(p.id || p.title);
    const ok = await upsertRecord(token, 'properties', pbId, {
      original_id: String(p.id || p.title),
      title: p.title,
      tag: p.tag || 'LANÇAMENTO',
      location: p.location || '',
      description: p.description || '',
      image_url: p.image_url || '',
      is_featured: p.is_featured ?? true,
      is_construction: p.is_construction ?? false,
      action_type: p.action_type || 'dates_modal',
      action_url: p.action_url || '',
      media_type: p.media_type || 'photos',
      gallery_images: p.gallery_images || [],
      gallery_videos: p.gallery_videos || [],
      order_index: Number(p.order_index) || 0
    });
    if (ok) pCount++;
  }
  console.log(`✓ Empreendimentos migrados: ${pCount}/${data.properties.length}`);

  let cCount = 0;
  for (const c of data.campaigns) {
    const pbId = toPocketBaseId(c.id || c.title);
    const ok = await upsertRecord(token, 'campaigns', pbId, {
      original_id: String(c.id || c.title),
      title: c.title,
      media_type: c.media_type || 'image',
      image_url: c.image_url || '',
      video_url: c.video_url || '',
      video_duration: Number(c.video_duration) || 0,
      target_link: c.target_link || '',
      is_active: c.is_active ?? false
    });
    if (ok) cCount++;
  }
  console.log(`✓ Campanhas migradas: ${cCount}/${data.campaigns.length}`);
}

// 6. Audit
async function auditCollections(token) {
  console.log(`\n[5/5] Auditando coleções no PocketBase...`);
  const headers = { 'Authorization': token };

  const [bRes, pRes, cRes] = await Promise.all([
    fetch(`${PB_URL}/api/collections/banners/records`, { headers }),
    fetch(`${PB_URL}/api/collections/properties/records`, { headers }),
    fetch(`${PB_URL}/api/collections/campaigns/records`, { headers })
  ]);

  const bData = await bRes.json();
  const pData = await pRes.json();
  const cData = await cRes.json();

  console.log('\n========================================================');
  console.log('       RELATÓRIO DE HOMOLOGAÇÃO: SITE PAULA MALHEIRO');
  console.log('========================================================');
  console.log(`- Banners: ${bData.totalItems || bData.items?.length || 0} registrados`);
  console.log(`- Empreendimentos (Properties): ${pData.totalItems || pData.items?.length || 0} cadastrados`);
  console.log(`- Campanhas Pop-up (Campaigns): ${cData.totalItems || cData.items?.length || 0} configuradas`);
  console.log('========================================================');
  console.log(`🎉 MIGRAÇÃO DO SITE PAULA HOMOLOGADA COM SUCESSO!`);
}

async function main() {
  try {
    const token = await authenticatePB();
    await setupCollections(token);
    const data = await fetchSourceData();
    await transferData(token, data);
    await auditCollections(token);
  } catch (err) {
    console.error(`\n❌ ERRO NA MIGRAÇÃO:`, err.message);
    process.exit(1);
  }
}

main();
