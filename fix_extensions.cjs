const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Logo
app = app.replace(/getImageUrl\('\/logo\.png'\)/g, "getImageUrl('/logo.png.PNG')");

// Hero image
app = app.replace(/getImageUrl\('\/paula-hero\.jpg'\)/g, "getImageUrl('/paula-hero.jpeg')");

// Connect Tech
app = app.replace(/getImageUrl\('\/connect-tech\.jpeg'\)/g, "getImageUrl('/Connect-Tech.jpg')");

// DON OESTE
app = app.replace(/getImageUrl\('\/don-oeste\.jpeg'\)/g, "getImageUrl('/DON-OESTE.jpeg')");

// Duque Lavenir
app = app.replace(/getImageUrl\('\/duque-lavenir\.jpeg'\)/g, "getImageUrl('/duque-lavenir.png')");

// Uni House
app = app.replace(/getImageUrl\('\/uni-house\.png'\)/g, "getImageUrl('/uni-house.png.jpeg')");

fs.writeFileSync('src/App.tsx', app);
