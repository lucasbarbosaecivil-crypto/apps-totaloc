/**
 * Script para criar ícones PWA usando Canvas (requer node-canvas)
 * Alternativa: use o gerador online do PWABuilder
 */

const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../public/icons');

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// PNG mínimo válido 1x1 pixel (transparente)
// Vamos criar usando canvas se disponível
let canvas;
try {
  canvas = require('canvas');
} catch (e) {
  console.log('❌ canvas não está instalado');
  console.log('📦 Para instalar: npm install canvas');
  console.log('📝 Ou use o gerador online: https://www.pwabuilder.com/imageGenerator');
  process.exit(1);
}

const { createCanvas } = canvas;

const sizes = [192, 512];
const bgColor = '#2563eb'; // Azul
const textColor = '#ffffff'; // Branco

sizes.forEach(size => {
  const img = createCanvas(size, size);
  const ctx = img.getContext('2d');
  
  // Fundo azul
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  
  // Texto "TL" centralizado
  ctx.fillStyle = textColor;
  ctx.font = `bold ${size / 4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TL', size / 2, size / 2);
  
  // Salvar
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(outputDir, filename);
  const buffer = img.toBuffer('image/png');
  fs.writeFileSync(filepath, buffer);
  
  console.log(`✅ ${filename} criado`);
});

console.log(`\n✨ Ícones criados em: ${outputDir}`);

