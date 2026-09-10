const deploymentUuid = process.argv[2] || 'o7njgey3dqc1l08mixycg9nl';
const token = '10|NP4yiFPOr4ncPklzdNwyWaCMpyrh6YBsYU6huFLu6a418791';

async function checkDeployment() {
  const url = `http://2.24.99.187:8000/api/v1/deployments/${deploymentUuid}`;
  console.log(`Verificando status do deployment ${deploymentUuid}...`);
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    const data = await res.json();
    console.log('Status HTTP:', res.status);
    console.log('Status do Deploy:', data.status);
    console.log('Commit:', data.commit);
    console.log('Mensagem:', data.commit_message);
  } catch (err) {
    console.error('Erro ao consultar status:', err.message);
  }
}

checkDeployment();
