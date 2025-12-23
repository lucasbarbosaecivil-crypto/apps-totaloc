# ⚡ Instalação Rápida PWA no Android

## 🎯 Método Mais Simples (5 minutos)

### Passo 1: Iniciar Servidor

No computador:
```powershell
npm run dev
```

Você verá algo como:
```
➜  Local:   http://localhost:3000/
➜  Network: http://192.168.100.32:3000/
```

**Anote o IP da Network** (ex: `192.168.100.32`)

---

### Passo 2: Acessar no Celular

1. **Conecte o celular no mesmo Wi-Fi do computador**

2. **Abra o Chrome no Android**

3. **Digite no navegador:**
   ```
   http://192.168.100.32:3000
   ```
   (Substitua pelo IP que apareceu no passo 1)

4. **Aguarde o app carregar**

---

### Passo 3: Instalar PWA

1. **Toque no menu** (⋮) no canto superior direito do Chrome

2. **Toque em "Adicionar à tela inicial"** ou **"Install app"**

3. **Confirme** clicando em "Adicionar" ou "Instalar"

4. ✅ **Pronto!** O app aparecerá na tela inicial

---

## 📱 Como Usar Depois

- **Abra o app** pela tela inicial
- Funciona **offline** (dados salvos localmente)
- **Sincroniza** com Google Sheets quando online
- Atualiza automaticamente quando o servidor é atualizado

---

## ⚠️ Importante

- O servidor (`npm run dev`) precisa estar rodando
- Celular e computador no mesmo Wi-Fi
- Para uso permanente, publique o app online (Vercel, Netlify, etc.)

---

## 🚀 Próximo Passo: Publicar Online (Opcional)

Para não depender do computador ligado:

1. **Faça build:**
   ```powershell
   npm run build
   ```

2. **Publique em:**
   - **Vercel:** `npx vercel`
   - **Netlify:** Faça upload da pasta `dist`
   - **GitHub Pages:** Configure GitHub Actions

3. **Use a URL pública** ao invés do IP local

---

**Pronto! App instalado no Android!** 📱✅

