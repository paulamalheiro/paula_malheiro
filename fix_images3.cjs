const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(/<img \n            src=\{getImageUrl\(''\)\} \n            alt="Logo VCA"/, "<img \n            src={getImageUrl('/logo.png')} \n            alt=\"Logo VCA\"");

app = app.replace(/<img \n          src=\{getImageUrl\(''\)\} \n          alt="Logo Paula Malheiro"/, "<img \n          src={getImageUrl('/logo.png')} \n          alt=\"Logo Paula Malheiro\"");

fs.writeFileSync('src/App.tsx', app);
