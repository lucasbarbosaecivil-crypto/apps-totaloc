/**
 * Cria ícones PNG válidos mínimos sem dependências externas
 * Usa apenas Buffer nativo do Node.js
 */

const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../public/icons');

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Função para criar PNG válido mínimo (imagem sólida de cor)
function createSolidColorPNG(width, height, color) {
  // PNG signature
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrCRC = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdrChunk = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0D]), // length
    Buffer.from('IHDR'),
    ihdrData,
    Buffer.from([
      (ihdrCRC >>> 24) & 0xFF,
      (ihdrCRC >>> 16) & 0xFF,
      (ihdrCRC >>> 8) & 0xFF,
      ihdrCRC & 0xFF
    ])
  ]);
  
  // IDAT chunk (dados comprimidos da imagem)
  // Para simplificar, vamos usar zlib para comprimir
  const zlib = require('zlib');
  
  // Dados da imagem (cada linha tem um byte de filtro + 3 bytes por pixel)
  const rowSize = 1 + width * 3;
  const imageData = Buffer.alloc(height * rowSize);
  
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    imageData[rowStart] = 0; // filtro: nenhum
    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 3;
      imageData[pixelStart] = color[0]; // R
      imageData[pixelStart + 1] = color[1]; // G
      imageData[pixelStart + 2] = color[2]; // B
    }
  }
  
  const compressedData = zlib.deflateSync(imageData);
  
  const idatCRC = crc32(Buffer.concat([Buffer.from('IDAT'), compressedData]));
  const idatChunk = Buffer.concat([
    Buffer.from([
      (compressedData.length >>> 24) & 0xFF,
      (compressedData.length >>> 16) & 0xFF,
      (compressedData.length >>> 8) & 0xFF,
      compressedData.length & 0xFF
    ]),
    Buffer.from('IDAT'),
    compressedData,
    Buffer.from([
      (idatCRC >>> 24) & 0xFF,
      (idatCRC >>> 16) & 0xFF,
      (idatCRC >>> 8) & 0xFF,
      idatCRC & 0xFF
    ])
  ]);
  
  // IEND chunk
  const iendCRC = crc32(Buffer.from('IEND'));
  const iendChunk = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // length
    Buffer.from('IEND'),
    Buffer.from([
      (iendCRC >>> 24) & 0xFF,
      (iendCRC >>> 16) & 0xFF,
      (iendCRC >>> 8) & 0xFF,
      iendCRC & 0xFF
    ])
  ]);
  
  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation
function crc32(buffer) {
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buffer.length; i++) {
    crc = table[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Cor azul: #2563eb = rgb(37, 99, 235)
const bgColor = [37, 99, 235];

const sizes = [192, 512];

console.log('📱 Criando ícones PNG...');

sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(outputDir, filename);
  
  try {
    const pngData = createSolidColorPNG(size, size, bgColor);
    fs.writeFileSync(filepath, pngData);
    console.log(`✅ ${filename} criado (${pngData.length} bytes)`);
  } catch (error) {
    console.error(`❌ Erro ao criar ${filename}:`, error.message);
  }
});

console.log(`\n✨ Ícones criados em: ${outputDir}`);
console.log('⚠️  Nota: Estes são ícones sólidos azuis. Para produção, substitua por ícones com design.');

