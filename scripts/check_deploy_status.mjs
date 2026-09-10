const deploymentUuid = 'u9kk3jubcamtd8aysceyiluz';
const token = '10|NP4yiFPOr4ncPklzdNwyWaCMpyrh6YBsYU6huFLu6a418791';

async function checkDeployment() {
  const url = `http://2.24.99.187:8000/api/v1/deployments/${deploymentUuid}`;
  console.log('Verificando status do deployment no Coolify...');
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    console.log('Status HTTP:', res.status);
    const data = await res.json();
    console.log('Status do Deploy:', data.status);
    console.log('Detalhes:', {
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      commit: data.commit,
      commit_message: data.commit_message,
    });
  } catch (err) {
    console.error('Erro ao consultar status:', err.message);
  }
}

checkDeployment();
