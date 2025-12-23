# 🎨 Gerador de Ícones PWA

## Como criar os ícones necessários

### Opção 1: Usar ferramenta online (Recomendado)

1. Acesse: https://www.pwabuilder.com/imageGenerator
2. Faça upload de um ícone 512x512px
3. Baixe todos os tamanhos
4. Coloque na pasta `public/icons/`

### Opção 2: Usar Figma/Sketch

1. Crie um ícone 512x512px
2. Exporte nos seguintes tamanhos:
   - 72x72
   - 96x96
   - 128x128
   - 144x144
   - 152x152
   - 192x192
   - 384x384
   - 512x512

### Opção 3: Usar ImageMagick (CLI)

```bash
# Instalar ImageMagick primeiro
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: sudo apt install imagemagick

# Criar ícones a partir de um arquivo base.png (512x512)
mkdir -p public/icons

convert base.png -resize 72x72 public/icons/icon-72x72.png
convert base.png -resize 96x96 public/icons/icon-96x96.png
convert base.png -resize 128x128 public/icons/icon-128x128.png
convert base.png -resize 144x144 public/icons/icon-144x144.png
convert base.png -resize 152x152 public/icons/icon-152x152.png
convert base.png -resize 192x192 public/icons/icon-192x192.png
convert base.png -resize 384x384 public/icons/icon-384x384.png
convert base.png -resize 512x512 public/icons/icon-512x512.png
```

### Opção 4: Placeholder temporário (para desenvolvimento)

Crie ícones simples SVG convertidos para PNG ou use um gerador automático:

```bash
# Usando Node.js (se tiver sharp instalado)
npm install -D sharp
node scripts/generate-placeholder-icons.js
```

### Estrutura de arquivos necessária:

```
public/
  icons/
    icon-72x72.png
    icon-96x96.png
    icon-128x128.png
    icon-144x144.png
    icon-152x152.png
    icon-192x192.png
    icon-384x384.png
    icon-512x512.png
    shortcut-order.png (opcional)
    shortcut-dashboard.png (opcional)
  screenshots/
    desktop.png (opcional)
    mobile.png (opcional)
```

### Design recomendado:

- **Cor de fundo**: #2563eb (azul principal do app)
- **Ícone**: Ícone de equipamento/engrenagem/ferramenta
- **Estilo**: Flat, moderno, minimalista
- **Padding**: ~10% em cada lado

### Nota

Para desenvolvimento, você pode usar qualquer imagem 512x512 temporariamente. O app funcionará mesmo sem os ícones completos, mas para produção é recomendado ter todos os tamanhos.

