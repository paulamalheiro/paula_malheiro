const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Fix the empty getImageUrl('') caused by bash $1 evaluation
// We will just do targeted replacements based on the context.

// 1. Logo
app = app.replace(/getImageUrl\('\/logo\.png'\)/g, "getImageUrl('/logo.png')");

// 2. Paula Perfil
app = app.replace(/getImageUrl\('\/pm_perfil\.jpeg'\)/g, "getImageUrl('/paula-perfil.jpeg')");

// 3. Duque Lavenir
app = app.replace(/title: 'DUQUE Lavenir Residence',[\s\S]*?image: getImageUrl\(''\)/, "title: 'DUQUE Lavenir Residence',\n      location: 'Próximo a Olívia Flores',\n      range: 'Casas Soltas',\n      image: getImageUrl('/duque-lavenir.jpeg')");

// 4. UNI House
app = app.replace(/title: 'UNI House',[\s\S]*?image: getImageUrl\(''\)/, "title: 'UNI House',\n      location: 'Região do Terras Alphaville',\n      range: '2 Quartos + Quintal',\n      image: getImageUrl('/uni-house.png')");

// 5. Connect Tech II
app = app.replace(/title: 'Connect Tech II - bairro planejado murado',[\s\S]*?image: getImageUrl\(''\)/, "title: 'Connect Tech II - bairro planejado murado',\n      location: 'Área nobre do Baron Connect',\n      range: 'Bairro Planejado Murado',\n      image: getImageUrl('/connect-tech.jpeg')");

// 6. Dona Lys
app = app.replace(/title: 'Dona Lys',[\s\S]*?image: getImageUrl\(''\)/, "title: 'Dona Lys',\n      location: 'Bairro Candeias',\n      range: 'Apartamentos 2 e 3 Quartos',\n      image: getImageUrl('/dona-lys.jpeg')");

// 7. DON OESTE
app = app.replace(/title: 'DON OESTE',[\s\S]*?image: getImageUrl\(''\)/, "title: 'DON OESTE',\n      location: 'Bairro Brasil',\n      range: 'Apartamentos 2 e 3 Quartos',\n      image: getImageUrl('/don-oeste.jpeg')");

// 8. Velli (Investimento section)
// There are two occurrences of <img src={getImageUrl('')} alt="Investimento" ... and alt="Paula Malheiro"
app = app.replace(/<img src=\{getImageUrl\(''\)\} alt="Investimento"/, "<img src={getImageUrl('/velli.jpeg')} alt=\"Investimento\"");
app = app.replace(/<img src=\{getImageUrl\(''\)\} alt="Paula Malheiro"/, "<img src={getImageUrl('/velli.jpeg')} alt=\"Paula Malheiro\"");

// 9. Empreendimentos list (Bellator, Amado, etc)
app = app.replace(/\{ label: 'Bellator', img: getImageUrl\(''\) \}/, "{ label: 'Bellator', img: getImageUrl('/bellator.jpeg') }");
app = app.replace(/\{ label: 'Amado', img: getImageUrl\(''\) \}/, "{ label: 'Amado', img: getImageUrl('/amado.jpeg') }");
app = app.replace(/\{ label: 'Verso', img: getImageUrl\(''\)/, "{ label: 'Verso', img: getImageUrl('/verso.jpeg')");
app = app.replace(/\{ label: 'Baron', img: getImageUrl\(''\) \}/, "{ label: 'Baron', img: getImageUrl('/baron.jpeg') }");
app = app.replace(/\{ label: 'Sculptor', img: getImageUrl\(''\) \}/, "{ label: 'Sculptor', img: getImageUrl('/sculptor.jpeg') }");
app = app.replace(/\{ label: 'Uni', img: getImageUrl\(''\)/, "{ label: 'Uni', img: getImageUrl('/uni.jpeg')");
app = app.replace(/\{ label: 'Vila', img: getImageUrl\(''\) \}/, "{ label: 'Vila', img: getImageUrl('/vila.jpeg') }");

fs.writeFileSync('src/App.tsx', app);
