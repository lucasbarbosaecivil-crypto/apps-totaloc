# 🔧 Solução: Erro redirect_uri_mismatch

## ❌ Problema

Erro ao fazer login com Google:
```
Error 400: redirect_uri_mismatch
```

## ✅ Solução Passo a Passo

### 1. Verifique qual porta seu app está usando

Olhe na URL do navegador:
- `http://localhost:3000`
- `http://localhost:3001` 
- `http://localhost:5173`

### 2. Acesse o Google Cloud Console

1. Vá para: https://console.cloud.google.com/
2. Selecione o projeto: **locadora-482015**
3. No menu lateral: **APIs e Serviços** → **Credenciais**
4. Clique no seu **OAuth 2.0 Client ID** (o que você criou)

### 3. Configure "Origens JavaScript autorizadas"

Na seção **"Origens JavaScript autorizadas"**, adicione (uma por linha):

```
http://localhost:3000
http://localhost:3001
http://localhost:5173
```

### 4. Configure "URIs de redirecionamento autorizados"

Na seção **"URIs de redirecionamento autorizados"**, adicione (uma por linha):

```
http://localhost:3000
http://localhost:3001
http://localhost:5173
```

**⚠️ IMPORTANTE:**
- Use `http://` (não `https://` para localhost)
- Sem barra no final (`/`)
- Sem espaços antes ou depois
- Uma URL por linha

### 5. Salve as alterações

1. Role até o final da página
2. Clique no botão **"SALVAR"** (canto inferior direito)
3. Aguarde a mensagem de confirmação

### 6. Aguarde a propagação

As mudanças podem levar **2-5 minutos** para serem aplicadas. Aguarde antes de testar novamente.

### 7. Limpe o cache do navegador

1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Cache" ou "Imagens e arquivos em cache"
3. Clique em "Limpar dados"
4. Feche e reabra o navegador

### 8. Teste novamente

1. Recarregue a página do app (`F5`)
2. Vá em "Configuração Google Sheets"
3. Clique em "Conectar com Google"
4. Deve funcionar agora!

## 🔍 Verificações Adicionais

### Verificar se o Client ID está correto

No arquivo `.env.local`, verifique se está assim:

```env
VITE_GOOGLE_CLIENT_ID=349496807996-jpbnd4rsjhp8ukd4qtqulno3pk1gbh0h.apps.googleusercontent.com
```

### Reiniciar o servidor

Após fazer mudanças no `.env.local`:

1. Pare o servidor (`Ctrl+C`)
2. Reinicie: `npm run dev`

## 🐛 Se ainda não funcionar

### Opção 1: Verificar no Console do Navegador

1. Pressione `F12`
2. Vá na aba **Network** (Rede)
3. Tente fazer login novamente
4. Procure por requisições com erro
5. Veja qual `redirect_uri` está sendo enviado

### Opção 2: Verificar a URL exata

A biblioteca `@react-oauth/google` pode estar usando uma URL específica. Verifique no console do navegador qual URL está sendo usada e adicione exatamente essa no Google Cloud Console.

### Opção 3: Usar modo de depuração

No Google Cloud Console, você pode ver os erros detalhados em:
- **APIs e Serviços** → **OAuth consent screen** → **Test users** (se estiver em modo de teste)

## 📝 Checklist Final

- [ ] Adicionei todas as portas em "Origens JavaScript autorizadas"
- [ ] Adicionei todas as portas em "URIs de redirecionamento autorizados"
- [ ] Cliquei em "SALVAR"
- [ ] Aguardei 2-5 minutos
- [ ] Limpei o cache do navegador
- [ ] Reiniciei o servidor (`npm run dev`)
- [ ] Recarreguei a página do app

## ✅ Resultado Esperado

Após seguir todos os passos, o login com Google deve funcionar sem o erro `redirect_uri_mismatch`.

