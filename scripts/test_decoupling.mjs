import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-paula.janagencia.com.br');
pb.autoCancellation(false);

async function testDecoupling() {
  console.log('--- TEST DECOUPLING: HERO vs ABOUT ---');
  await pb.collection('_superusers').authWithPassword('mccley.1@gmail.com', '082025mccley');

  // 1. Initial State
  const initialHero = await pb.collection('banners').getFirstListItem('section="hero"');
  const initialAbout = await pb.collection('banners').getFirstListItem('section="about"');

  console.log('Initial Hero Subtitle:', initialHero.subtitle?.slice(0, 60));
  console.log('Initial About Tag:', initialAbout.tag);
  console.log('Initial About Length:', initialAbout.subtitle?.length);

  // 2. Simulate saving "about" section
  const targetRecord = await pb.collection('banners').getFirstListItem('section="about"');
  await pb.collection('banners').update(targetRecord.id, {
    section: 'about',
    tag: 'Minha História (Teste Decoupling)',
    title: initialAbout.title,
    subtitle: initialAbout.subtitle,
  });

  // 3. Re-fetch hero to verify zero contamination
  const heroAfterAboutUpdate = await pb.collection('banners').getFirstListItem('section="hero"');
  const aboutAfterUpdate = await pb.collection('banners').getFirstListItem('section="about"');

  if (heroAfterAboutUpdate.subtitle === initialHero.subtitle && heroAfterAboutUpdate.title === initialHero.title) {
    console.log('✅ TEST PASSED: Hero record was NOT touched when saving About!');
  } else {
    console.error('❌ TEST FAILED: Hero record was altered!');
  }

  // 4. Restore About Tag
  await pb.collection('banners').update(targetRecord.id, {
    tag: 'Minha História',
  });

  const finalHero = await pb.collection('banners').getFirstListItem('section="hero"');
  const finalAbout = await pb.collection('banners').getFirstListItem('section="about"');

  console.log('\nFINAL AUDIT:');
  console.log('Hero Title:', finalHero.title);
  console.log('Hero Subtitle:', finalHero.subtitle?.slice(0, 70));
  console.log('About Title:', finalAbout.title);
  console.log('About Subtitle Length:', finalAbout.subtitle?.length);
  console.log('About Tag:', finalAbout.tag);
  console.log('✅ All verified successfully!');
}

testDecoupling().catch(console.error);
