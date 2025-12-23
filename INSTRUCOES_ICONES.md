# 🎨 Instruções para Criar Ícones PWA

O `manifest.json` já está corrigido, mas você precisa criar os arquivos de ícones PNG.

## ✅ Opção 1: Gerar Online (Mais Rápido)

1. Acesse: https://www.pwabuilder.com/imageGenerator
2. Faça upload de uma imagem (512x512px recomendado)
3. Baixe os ícones gerados
4. Coloque na pasta `public/icons/`:
   - `icon-192x192.png`
   - `icon-512x512.png`

## ✅ Opção 2: Usar Script (Requer sharp)

```bash
npm install -D sharp
npm run generate:icons
```

## ✅ Opção 3: Criar Manualmente

Crie 2 arquivos PNG:
- `public/icons/icon-192x192.png` (192x192 pixels)
- `public/icons/icon-512x512.png` (512x512 pixels)

Use qualquer editor de imagens (Photoshop, GIMP, Canva, etc.)

## 📝 Após Criar os Ícones

1. Execute: `npm run build`
2. Publique a pasta `dist/` no Netlify novamente
3. Teste no PWABuilder novamente

