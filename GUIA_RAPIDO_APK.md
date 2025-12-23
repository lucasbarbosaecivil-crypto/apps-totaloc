# ⚡ Guia Rápido: Gerar APK SEM PWABuilder

## 🎯 Método Mais Rápido: Capacitor (10 minutos)

### 1. Instalar Dependências

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### 2. Inicializar Capacitor

```bash
npx cap init
```

**Informações para preencher:**
- **App name:** TOTAL LOC
- **App ID:** com.totalloc.app (ou qualquer ID único)
- **Web dir:** dist

### 3. Build do App

```bash
npm run build
```

### 4. Adicionar Android e Sincronizar

```bash
npx cap add android
npx cap sync
```

### 5. Abrir no Android Studio

```bash
npx cap open android
```

**No Android Studio:**
1. Aguarde o projeto carregar (pode demorar alguns minutos na primeira vez)
2. Menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Aguarde a compilação (alguns minutos)
4. Quando aparecer notificação "APK(s) generated successfully", clique em **locate**

**O APK estará em:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 Instalar APK no Android

1. **Transfira o APK** para o celular (via USB, email, Google Drive, etc.)
2. **No Android**, abra o arquivo `.apk`
3. Se aparecer aviso de "Fontes desconhecidas", **permita** nas configurações
4. **Instale** o APK
5. ✅ **Pronto!** App instalado!

---

## ⚠️ Requisitos

### Para Gerar APK:
- ✅ **Node.js** instalado
- ✅ **Java JDK** instalado (versão 11 ou superior)
- ✅ **Android Studio** instalado (ou apenas Android SDK)

### Para Instalar APK:
- ✅ **Android** 5.0 ou superior
- ✅ Permissão para "Fontes desconhecidas" habilitada

---

## 🔄 Alternativa: Instalação PWA Direta (Não Precisa de APK!)

Se você só quer usar o app, **não precisa gerar APK**:

1. **Abra no Chrome Android:**
   ```
   https://mellow-dodol-9ec8d2.netlify.app/
   ```

2. **Menu (⋮)** → **"Adicionar à tela inicial"**

3. ✅ **Pronto!** App instalado como PWA

**Vantagens:**
- Não precisa gerar APK
- Atualiza automaticamente
- Mais simples

---

## 🐛 Problemas Comuns

### Erro: "Command not found: cap"
**Solução:**
```bash
npx @capacitor/cli init
```

### Erro: "Android SDK not found"
**Solução:**
1. Instale Android Studio
2. Abra Android Studio → **More Actions** → **SDK Manager**
3. Instale **Android SDK Platform-Tools**
4. Configure variável de ambiente `ANDROID_HOME`

### Erro: "JDK not found"
**Solução:**
1. Instale Java JDK 11+
2. Configure variável de ambiente `JAVA_HOME`

---

## ✅ Resumo

| Passo | Comando | Tempo |
|-------|---------|-------|
| 1. Instalar | `npm install @capacitor/core @capacitor/cli @capacitor/android` | 1 min |
| 2. Inicializar | `npx cap init` | 1 min |
| 3. Build | `npm run build` | 2 min |
| 4. Adicionar Android | `npx cap add android && npx cap sync` | 2 min |
| 5. Abrir Studio | `npx cap open android` | - |
| 6. Gerar APK | Build → Build APK(s) | 3-5 min |

**Total:** ~10 minutos

---

**Pronto! Você terá um APK funcional!** 🎉

