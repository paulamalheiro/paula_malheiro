import dns from 'dns/promises';
import https from 'https';
import tls from 'tls';

const DOMAIN = 'paulamalheiro.com.br';
const EXPECTED_IP = '2.24.99.187';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

async function check() {
  console.log(`\n=============================================================================`);
  console.log(`🔍 DIAGNÓSTICO COMPLETO DE MIGRAÇÃO: ${DOMAIN}`);
  console.log(`IP Esperado da VPS (Coolify): ${EXPECTED_IP}`);
  console.log(`=============================================================================\n`);

  let aRecords = [];
  let wwwRecords = [];

  // 1. Resolução DNS Tipo A para apex (@)
  try {
    aRecords = await dns.resolve4(DOMAIN);
    console.log(`✓ DNS Tipo A (${DOMAIN}): ${aRecords.join(', ')}`);
    if (aRecords.includes(EXPECTED_IP)) {
      console.log(`  🎉 SUCESSO: O domínio raiz está apontando diretamente para o IP da VPS (${EXPECTED_IP})!`);
    } else {
      console.warn(`  ⚠️ ATENÇÃO: O domínio raiz está resolvendo para ${aRecords.join(', ')}.`);
      console.warn(`     Ele deve apontar para o IP da VPS: ${EXPECTED_IP}`);
      if (aRecords.some(ip => ip.startsWith('147.79') || ip.startsWith('91.108') || ip.startsWith('89.116'))) {
        console.warn(`     -> Estes IPs pertencem ao CDN padrão da Hostinger (*.cdn.hstgr.net).`);
        console.warn(`     -> Altere o registro na Hostinger de ALIAS para Tipo A apontando para ${EXPECTED_IP}.`);
      }
    }
  } catch (err) {
    console.error(`❌ Falha ao resolver DNS Tipo A para ${DOMAIN}: ${err.message}`);
  }

  // 2. Resolução DNS para www
  try {
    wwwRecords = await dns.resolve4(`www.${DOMAIN}`);
    console.log(`✓ DNS www (${DOMAIN}): ${wwwRecords.join(', ')}`);
    if (wwwRecords.includes(EXPECTED_IP) || aRecords.includes(EXPECTED_IP)) {
      console.log(`  🎉 Subdomínio www configurado corretamente!`);
    }
  } catch (err) {
    console.log(`ℹ️ Resolução de www.${DOMAIN}: ${err.message}`);
  }

  // 3. Teste de Certificado TLS direto no IP da VPS
  console.log(`\n🔒 Testando resposta do Traefik / SSL na VPS (${EXPECTED_IP})...`);
  await new Promise((resolve) => {
    const socket = tls.connect(443, EXPECTED_IP, {
      servername: DOMAIN,
      rejectUnauthorized: false,
      timeout: 5000,
    }, () => {
      const cert = socket.getPeerCertificate(true);
      console.log(`✓ Conexão TLS com ${EXPECTED_IP} estabelecida!`);
      console.log(`  Certificado CN: ${cert.subject?.CN || 'N/A'}`);
      console.log(`  Emissor: ${cert.issuer?.O || cert.issuer?.CN || 'N/A'}`);
      console.log(`  SANs: ${cert.subjectaltname || 'N/A'}`);
      socket.end();
      resolve();
    });

    socket.on('error', (err) => {
      console.log(`ℹ️ TLS socket aviso: ${err.message}`);
      resolve();
    });

    socket.on('timeout', () => {
      socket.destroy();
      console.log('ℹ️ Conexão TLS timeout');
      resolve();
    });
  });

  // 4. Teste de Acesso HTTPS pelo domínio público
  console.log('\n🌐 Testando requisição HTTP pública para o domínio...');
  try {
    const res = await fetch(`https://${DOMAIN}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(6000),
    });
    console.log(`✓ Status HTTP: ${res.status}`);
    const html = await res.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    console.log(`  Título retornado: "${titleMatch ? titleMatch[1] : 'N/A'}"`);
    if (res.status === 200 && html.includes('Paula Malheiro')) {
      console.log('🎉 SUCESSO TOTAL: O site oficial está 100% ONLINE e RESPONDENDO!');
    }
  } catch (err) {
    console.log(`ℹ️ Acesso HTTPS direto ainda pendente (aguardando propagação DNS): ${err.message}`);
  }

  console.log(`\n=============================================================================`);
}

check();

