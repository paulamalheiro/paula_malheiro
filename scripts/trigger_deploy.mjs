const webhookUrl = 'http://2.24.99.187:8000/api/v1/deploy?uuid=p10i63vuzaejlphawq5hgs42&force=false';
const token = '10|NP4yiFPOr4ncPklzdNwyWaCMpyrh6YBsYU6huFLu6a418791';

async function triggerDeploy() {
  console.log('🚀 Disparando deploy no Coolify...');
  console.log('URL:', webhookUrl);

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const body = await res.text();
    console.log(`Status POST: ${res.status}`);
    console.log(`Resposta: ${body}`);

    if (res.ok) {
      console.log('✅ Deploy disparado com sucesso no Coolify via POST!');
      return;
    }
  } catch (err) {
    console.warn('POST falhou, tentando GET...', err.message);
  }

  try {
    const resGet = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    const bodyGet = await resGet.text();
    console.log(`Status GET: ${resGet.status}`);
    console.log(`Resposta: ${bodyGet}`);

    if (resGet.ok) {
      console.log('✅ Deploy disparado com sucesso no Coolify via GET!');
      return;
    }
  } catch (err) {
    console.error('GET falhou:', err.message);
  }
}

triggerDeploy();
