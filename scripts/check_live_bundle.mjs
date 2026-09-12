import https from 'https';

https.get('https://paulamalheiro.com.br', (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    console.log('HTML Length:', html.length);
    const scriptMatches = html.match(/src="[^"]+"/g);
    console.log('Scripts:', scriptMatches);
    const cssMatches = html.match(/href="[^"]+\.css"/g);
    console.log('CSS:', cssMatches);
  });
});
