async function testLiveSite() {
  const domains = ['https://paulamalheiro.com.br', 'https://www.paulamalheiro.com.br'];
  for (const url of domains) {
    try {
      console.log(`Testando ${url}...`);
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log(`Status: ${res.status}`);
      const html = await res.text();
      console.log(`Tamanho do HTML: ${html.length} bytes`);
      // Check for assets or title
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      console.log(`Título da página: ${titleMatch ? titleMatch[1] : 'N/A'}`);
    } catch (e) {
      console.error(`Erro ao acessar ${url}:`, e.message);
    }
  }
}

testLiveSite();
