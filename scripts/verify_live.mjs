import https from 'https';

function fetchUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        url,
        status: res.statusCode,
        headers: res.headers,
        bodyPreview: data.slice(0, 300),
        size: data.length,
      }));
    });
    req.on('error', (err) => resolve({ url, error: err.message }));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ url, error: 'Timeout' });
    });
  });
}

async function verify() {
  console.log('--- VERIFICANDO PRODUÇÃO ---');
  
  // 1. Site principal
  const site = await fetchUrl('https://paulamalheiro.com.br');
  console.log('Site paulamalheiro.com.br:', site.status, `(${site.size} bytes)`);

  // 2. Imagens otimizadas no PocketBase
  const heroImage = await fetchUrl('https://pb-paula.janagencia.com.br/api/files/pbc_121766130/ouy6vx05lwtxopk/paula_perfil_5goh0rrjpb_a725tetg15.jpeg');
  console.log('Hero Image (PocketBase):', heroImage.status, `Content-Length: ${heroImage.headers?.['content-length']} bytes`);

  const aboutImage = await fetchUrl('https://pb-paula.janagencia.com.br/api/files/pbc_121766130/1vy1er5mx0no1hg/paula_hero_vsjp4mp58x_9o16e5ae7z.jpeg');
  console.log('About Image (PocketBase):', aboutImage.status, `Content-Length: ${aboutImage.headers?.['content-length']} bytes`);

  const investImage = await fetchUrl('https://pb-paula.janagencia.com.br/api/files/pbc_121766130/epg42v8xch49vxh/velli_jnmkx21uv6_squxsti5fl.jpeg');
  console.log('Investment Image (PocketBase):', investImage.status, `Content-Length: ${investImage.headers?.['content-length']} bytes`);

  // 3. API do PocketBase
  const banners = await fetchUrl('https://pb-paula.janagencia.com.br/api/collections/banners/records');
  console.log('API Banners:', banners.status);

  const props = await fetchUrl('https://pb-paula.janagencia.com.br/api/collections/properties/records');
  console.log('API Properties:', props.status);
}

verify();
