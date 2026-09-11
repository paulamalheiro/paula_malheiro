async function verify() {
  try {
    const res = await fetch('https://paula.janagencia.com.br');
    const html = await res.text();
    console.log('HTTP Status:', res.status);
    console.log('Contains index-B0Uy8fbV.js:', html.includes('index-B0Uy8fbV.js'));
    console.log('HTML length:', html.length);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
verify();
