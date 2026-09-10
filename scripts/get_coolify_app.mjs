const appUuid = 'p10i63vuzaejlphawq5hgs42';
const token = '10|NP4yiFPOr4ncPklzdNwyWaCMpyrh6YBsYU6huFLu6a418791';

async function getAppDetails() {
  const url = `http://2.24.99.187:8000/api/v1/applications/${appUuid}`;
  console.log('Buscando detalhes da aplicação no Coolify...');
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    console.log('Status HTTP:', res.status);
    const data = await res.json();
    console.log('Aplicação:', {
      name: data.name,
      fqdn: data.fqdn,
      status: data.status,
      git_repository: data.git_repository,
      git_branch: data.git_branch,
      build_pack: data.build_pack,
    });
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

getAppDetails();
