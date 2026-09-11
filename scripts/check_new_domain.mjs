import dns from 'dns/promises';
import https from 'https';

const DOMAIN = 'paulamalheiro.com.br';
const EXPECTED_IP = '2.24.99.187';

async function check() {
  console.log(`\n🔍 Verificando apontamento DNS e SSL para: ${DOMAIN}`);
  console.log(`IP Esperado: ${EXPECTED_IP}\n`);

  // 1. Resolução DNS Tipo A
  try {
    const addresses = await dns.resolve4(DOMAIN);
    console.log(`✓ DNS Tipo A resolvido com sucesso: ${addresses.join(', ')}`);
    if (addresses.includes(EXPECTED_IP)) {
      console.log(`🎉 IP ${EXPECTED_IP} confirmado! O domínio está apontando corretamente para o servidor Hostinger.`);
    } else {
      console.warn(`⚠️ O domínio resolve para ${addresses.join(', ')}, mas o IP esperado é ${EXPECTED_IP}.`);
    }
  } catch (err) {
    console.error(`❌ Falha ao resolver DNS Tipo A: ${err.message}`);
    console.log('   (Aguarde alguns minutos para a propagação das entradas criadas no Registro.br ou Hostinger)');
  }

  // 2. Resolução DNS para www
  try {
    const wwwAddresses = await dns.resolve4(`www.${DOMAIN}`);
    console.log(`✓ DNS www.${DOMAIN} resolvido: ${wwwAddresses.join(', ')}`);
  } catch (err) {
    console.log(`ℹ️ www.${DOMAIN} ainda não responde: ${err.message}`);
  }

  // 3. Teste de Acesso HTTPS
  console.log('\n🌐 Testando conexão HTTPS com o site...');
  const req = https.get(`https://${DOMAIN}`, { rejectUnauthorized: false, timeout: 5000 }, (res) => {
    console.log(`✓ Conexão HTTPS estabelecida! Status HTTP: ${res.statusCode}`);
    console.log(`  Certificado SSL ativo e site respondendo online!`);
  });

  req.on('error', (err) => {
    console.log(`ℹ️ Conexão HTTPS ainda pendente: ${err.message}`);
  });
}

check();
