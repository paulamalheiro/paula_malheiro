import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-paula.janagencia.com.br');
pb.autoCancellation(false);

async function restoreHero() {
  try {
    console.log('Authenticating as superuser...');
    try {
      await pb.collection('_superusers').authWithPassword('mccley.1@gmail.com', '082025mccley');
      console.log('Authenticated as _superusers!');
    } catch (e) {
      try {
        await pb.admins.authWithPassword('mccley.1@gmail.com', '082025mccley');
        console.log('Authenticated as admins!');
      } catch (e2) {
        await pb.collection('users').authWithPassword('mccley.1@gmail.com', '082025mccley');
        console.log('Authenticated as users!');
      }
    }

    // 1. Fetch current hero record
    const heroRecord = await pb.collection('banners').getFirstListItem('section="hero"');
    console.log('Current hero record ID:', heroRecord.id);

    const originalHeroSubtitle = 'Com mais de 10 anos de experiência, minha intenção aqui é conectar você às oportunidades em imóveis através de um atendimento humano e personalizado para encontrarmos a melhor opção para o seu momento atual.';
    const originalHeroTitle = 'a compra do seu imóvel como uma experiência segura e transparente!';
    const originalHeroTag = 'Especialista em Imóveis na Planta - VCA Construtora';

    const updated = await pb.collection('banners').update(heroRecord.id, {
      tag: originalHeroTag,
      title: originalHeroTitle,
      subtitle: originalHeroSubtitle,
      button_text: 'Conheça os Empreendimentos',
      button_link: '#projects',
      active: true
    });

    console.log('\n✅ HERO RECORD RESTORED SUCCESSFULLY:');
    console.log('ID:', updated.id);
    console.log('Section:', updated.section);
    console.log('Tag:', updated.tag);
    console.log('Title:', updated.title);
    console.log('Subtitle:', updated.subtitle);

    // 2. Fetch and verify about record is untouched
    const aboutRecord = await pb.collection('banners').getFirstListItem('section="about"');
    console.log('\n✅ ABOUT RECORD VERIFIED:');
    console.log('ID:', aboutRecord.id);
    console.log('Section:', aboutRecord.section);
    console.log('Tag:', aboutRecord.tag);
    console.log('Title:', aboutRecord.title);
    console.log('Subtitle length:', aboutRecord.subtitle?.length);
    console.log('Subtitle preview:', aboutRecord.subtitle?.slice(0, 100));

  } catch (err) {
    console.error('Error:', err);
  }
}

restoreHero();
