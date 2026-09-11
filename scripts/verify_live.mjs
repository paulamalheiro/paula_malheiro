async function verify() {
  try {
    const res = await fetch('https://paulamalheiro.com.br');
    const html = await res.text();
    console.log('HTTP Status:', res.status);
    console.log('Contains index-Ba-z8kie.js:', html.includes('index-Ba-z8kie.js'));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
verify();
