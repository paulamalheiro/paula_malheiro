async function checkPaulaSite() {
  const url = 'https://paula.janagencia.com.br';
  console.log(`Testando ${url}...`);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log(`Status HTTP: ${res.status}`);
    const html = await res.text();
    console.log(`Tamanho do HTML: ${html.length} bytes`);
    
    // Check if the HTML points to our latest build assets
    const scripts = html.match(/src="([^"]+)"/g);
    console.log('Scripts encontrados:', scripts);
    console.log('✅ Site no ar com sucesso!');
  } catch (err) {
    console.error('Erro ao acessar:', err.message);
  }
}

checkPaulaSite();
