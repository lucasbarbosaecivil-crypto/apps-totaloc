/**
 * Script simples para criar ícones PWA básicos usando apenas Node.js
 * Não requer dependências externas
 */

const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../public/icons');

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Ícone PNG base64 mínimo 1x1 pixel azul (será usado como placeholder)
// Vamos criar um SVG simples e converter conceitualmente
// Para produção, use imagens reais, mas isso serve como placeholder válido

// Para 192x192 - PNG mínimo válido (1 pixel azul expandido)
// Como não temos sharp, vamos criar um SVG que pode ser usado como fallback
// ou criar arquivos PNG válidos mínimos

const createMinimalPNG = (size) => {
  // PNG mínimo válido (1x1 pixel transparente expandido para o tamanho desejado)
  // Baseado em PNG válido mínimo
  // Vamos usar uma abordagem diferente: criar SVG que pode ser servido como PNG
  
  // Na verdade, vamos criar um arquivo SVG com o nome .png
  // Muitos navegadores aceitam isso, mas o ideal seria PNG real
  // Para agora, vamos documentar que precisa de ícones reais
  
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb" rx="${size * 0.2}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.15}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">TL</text>
</svg>`;
  
  return svgContent;
};

// Criar ícones como SVG (que funcionam como fallback)
// Para produção real, substitua por PNGs reais
const sizes = [192, 512];

console.log('📱 Criando ícones placeholder...');

sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(outputDir, filename);
  
  // Por enquanto, vamos criar um arquivo de texto indicando que precisa de ícone real
  // Ou podemos usar uma imagem base64 mínima
  // Vamos usar um placeholder SVG que pode ser convertido depois
  
  const svgPlaceholder = createMinimalPNG(size);
  
  // Salvar como SVG (será renomeado manualmente ou convertido depois)
  // Por enquanto, vamos criar um arquivo indicativo
  fs.writeFileSync(filepath.replace('.png', '.svg'), svgPlaceholder);
  
  console.log(`⚠️  Criado ${filename.replace('.png', '.svg')} - precisa converter para PNG`);
});

console.log('\n⚠️  IMPORTANTE:');
console.log('Para produção, você precisa de ícones PNG reais.');
console.log('Opções:');
console.log('1. Use https://www.pwabuilder.com/imageGenerator para gerar ícones');
console.log('2. Ou instale sharp: npm install -D sharp e execute: npm run generate:icons');
console.log(`3. Ou adicione ícones PNG manualmente em: ${outputDir}`);

