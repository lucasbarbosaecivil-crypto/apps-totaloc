#!/usr/bin/env python3
"""
Script simples para criar ícones PWA PNG mínimos
Não requer bibliotecas externas, apenas PIL/Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("❌ PIL/Pillow não está instalado!")
    print("📦 Execute: pip install Pillow")
    exit(1)

import os

# Criar diretório se não existir
output_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
os.makedirs(output_dir, exist_ok=True)

# Cores
bg_color = (37, 99, 235)  # #2563eb (azul)
text_color = (255, 255, 255)  # Branco

sizes = [192, 512]

for size in sizes:
    # Criar imagem
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Desenhar texto "TL" centralizado
    try:
        # Tentar usar fonte padrão
        font_size = size // 4
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except:
            # Fonte padrão se não encontrar
            font = ImageFont.load_default()
    
    text = "TL"
    # Calcular posição centralizada
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((size - text_width) // 2, (size - text_height) // 2)
    
    draw.text(position, text, fill=text_color, font=font)
    
    # Salvar
    filename = f'icon-{size}x{size}.png'
    filepath = os.path.join(output_dir, filename)
    img.save(filepath, 'PNG')
    print(f'✅ {filename} criado')

print(f'\n✨ Ícones criados em: {output_dir}')

