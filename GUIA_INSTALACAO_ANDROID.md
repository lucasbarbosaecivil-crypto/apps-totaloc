# 📱 Guia: Instalar App no Android

## 📋 Status Atual

O app está configurado como **PWA (Progressive Web App)** e pode ser instalado no Android de duas formas:

1. **✅ PWA (Mais Simples)** - Instalar direto do navegador
2. **📦 APK (Mais Completo)** - Gerar arquivo APK para instalação

---

## 🚀 Opção 1: Instalar como PWA (Recomendado - Mais Simples)

### Pré-requisito:
- Servidor rodando (`npm run dev`) **OU** app publicado em um servidor web

### Passo a Passo:

#### 1. Abrir no Celular

No celular Android, abra o Chrome e acesse:
- **Local:** `http://SEU_IP:3000` (ex: `http://192.168.1.100:3000`)
- **Ou publique em:** GitHub Pages, Vercel, Netlify, etc.

#### 2. Instalar PWA

1. No Chrome Android, toque no **menu (⋮)** no canto superior direito
2. Selecione **"Adicionar à tela inicial"** ou **"Install app"**
3. Confirme a instalação
4. ✅ App instalado!

### Vantagens:
- ✅ Instalação rápida
- ✅ Atualiza automaticamente
- ✅ Funciona offline (com Service Worker)
- ✅ Não precisa gerar APK

### Limitações:
- Precisa acessar via navegador primeiro
- Requer servidor ativo (ou publicação online)

---

## 📦 Opção 2: Gerar APK (Mais Completo)

Para gerar um APK real, você precisa converter a PWA em app nativo usando **Capacitor**.

### Opção 2A: Usar Capacitor (Recomendado para APK)

#### Passo 1: Instalar Capacitor

```powershell
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
npx cap init
```

**Quando perguntar:**
- App name: `RentalPro`
- App ID: `com.locadora.rentalpro`
- Web dir: `dist`

#### Passo 2: Build do App

```powershell
npm run build
```

#### Passo 3: Adicionar Plataforma Android

```powershell
npx cap add android
npx cap sync
```

#### Passo 4: Abrir no Android Studio

```powershell
npx cap open android
```

#### Passo 5: Gerar APK no Android Studio

1. No Android Studio: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Aguarde compilar
3. APK será gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`
4. Transfira para o celular e instale

### Opção 2B: Usar PWABuilder (Mais Simples - Online)

#### Passo 1: Build do App

```powershell
npm run build
```

#### Passo 2: Publicar Build

Faça upload da pasta `dist` para:
- GitHub Pages
- Netlify
- Vercel
- Ou qualquer servidor web

#### Passo 3: Gerar APK Online

1. Acesse: https://www.pwabuilder.com/
2. Cole a URL do seu app publicado
3. Clique em **"Start"**
4. Selecione **"Android"**
5. Clique em **"Generate"**
6. Download do APK disponível!

---

## 🔧 Preparação para APK

### 1. Verificar Ícones PWA

O app precisa de ícones para Android. Vamos gerar:

```powershell
npm run generate:icons
```

Isso criará ícones em `public/icons/`:
- `icon-192x192.png`
- `icon-512x512.png`

### 2. Atualizar Manifest

O `manifest.json` já está configurado, mas vamos verificar se tem tudo:

- ✅ Nome do app
- ✅ Ícones
- ✅ Tema
- ✅ Modo standalone

### 3. Build de Produção

```powershell
npm run build
```

Isso cria a pasta `dist/` com os arquivos otimizados.

---

## 📝 Comparação: PWA vs APK

| Característica | PWA | APK |
|----------------|-----|-----|
| **Instalação** | Via navegador | Download direto |
| **Tamanho** | Pequeno (cache) | Maior (app completo) |
| **Atualização** | Automática | Manual (reinstalar) |
| **Loja** | Não precisa | Pode publicar na Play Store |
| **Complexidade** | ⭐ Simples | ⭐⭐⭐ Mais complexo |
| **Offline** | ✅ Sim (Service Worker) | ✅ Sim |

---

## ✅ Recomendação

**Para começar rápido:**
- Use **PWA** - Instale direto do navegador

**Para distribuição:**
- Use **APK com Capacitor** - Mais profissional

---

## 🚀 Próximos Passos

1. **Testar PWA primeiro:**
   - Execute `npm run dev`
   - Acesse no celular Android
   - Instale como PWA

2. **Se precisar de APK:**
   - Siga Opção 2A (Capacitor) ou 2B (PWABuilder)
   - Instale o APK no celular

---

## ⚠️ Notas Importantes

### Para PWA:
- Precisa de HTTPS em produção (ou localhost para desenvolvimento)
- Service Worker funciona offline
- Atualizações são automáticas

### Para APK:
- Precisa de Android Studio instalado (opção 2A)
- Ou usar PWABuilder online (opção 2B)
- APK pode ser instalado em qualquer Android (habilitar "Instalar apps de fontes desconhecidas")

---

## 📱 Teste Rápido PWA

1. **No computador:**
   ```powershell
   npm run dev
   ```

2. **No celular:**
   - Conecte no mesmo Wi-Fi
   - Abra Chrome Android
   - Acesse: `http://SEU_IP:3000`
   - Menu → "Adicionar à tela inicial"
   - ✅ Pronto!

---

**Quer que eu prepare os arquivos necessários para gerar o APK agora?**

