async function verify() {
  try {
    const res = await fetch('https://paula.janagencia.com.br');
    const html = await res.text();
    console.log('HTTP Status:', res.status);
    console.log('Contains index-CcZrLthR.js:', html.includes('index-CcZrLthR.js'));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
verify();
