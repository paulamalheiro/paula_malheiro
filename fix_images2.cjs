const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(/title: 'Dona Lys - Apartamentos próximo a Olívia Flores',[\s\S]*?image: getImageUrl\(''\)/, "title: 'Dona Lys - Apartamentos próximo a Olívia Flores',\n      location: 'Próximo a Olívia Flores',\n      range: 'Duo Residences',\n      image: getImageUrl('/dona-lys.jpeg')");

app = app.replace(/title: 'DON OESTE - próximo ao CAIC, Lagoa das Bateias',[\s\S]*?image: getImageUrl\(''\)/, "title: 'DON OESTE - próximo ao CAIC, Lagoa das Bateias',\n      location: 'Próximo ao CAIC, Lagoa das Bateias',\n      range: 'Duo Residences',\n      image: getImageUrl('/don-oeste.jpeg')");

fs.writeFileSync('src/App.tsx', app);
