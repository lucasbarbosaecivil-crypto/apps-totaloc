/**
 * Script para gerar ícones placeholder PWA
 * Requer: npm install -D sharp
 * Uso: node scripts/generate-placeholder-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '../public/icons');

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// SVG simples de placeholder (ícone de engrenagem)
const svgIcon = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#2563eb" rx="100"/>
  <g fill="white" transform="translate(256,256)">
    <circle r="180" fill="none" stroke="white" stroke-width="30"/>
    <rect x="-25" y="-180" width="50" height="80" rx="10"/>
    <rect x="-25" y="100" width="50" height="80" rx="10"/>
    <rect x="-180" y="-25" width="80" height="50" rx="10"/>
    <rect x="100" y="-25" width="80" height="50" rx="10"/>
    <circle r="60" fill="#2563eb"/>
  </g>
</svg>
`;

async function generateIcons() {
  console.log('Gerando ícones placeholder...');
  
  for (const size of sizes) {
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(outputDir, filename);
    
    try {
      await sharp(Buffer.from(svgIcon))
        .resize(size, size)
        .png()
        .toFile(filepath);
      
      console.log(`✅ ${filename} gerado`);
    } catch (error) {
      console.error(`❌ Erro ao gerar ${filename}:`, error.message);
    }
  }
  
  console.log('\n✨ Ícones gerados com sucesso!');
  console.log(`📁 Localização: ${outputDir}`);
}

// Verificar se sharp está instalado
try {
  require.resolve('sharp');
  generateIcons();
} catch (e) {
  console.error('❌ Sharp não está instalado!');
  console.log('📦 Execute: npm install -D sharp');
  process.exit(1);
}

