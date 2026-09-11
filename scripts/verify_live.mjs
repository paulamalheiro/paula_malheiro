async function verify() {
  try {
    const res = await fetch('https://paula.janagencia.com.br');
    const html = await res.text();
    console.log('HTTP Status:', res.status);
    console.log('Contains index-D8loGOre.js:', html.includes('index-D8loGOre.js'));
    console.log('HTML length:', html.length);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
verify();
