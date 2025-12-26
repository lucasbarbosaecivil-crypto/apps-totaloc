# 🔐 Configuração de E-mails Permitidos

Este documento explica como configurar a lista de e-mails autorizados para acessar o sistema.

## 📋 Como Funciona

O sistema agora verifica se o e-mail do usuário está em uma lista de e-mails permitidos antes de autorizar o acesso. Se o e-mail não estiver na lista, o acesso é negado.

## ⚙️ Configuração

### 1. Criar/Editar arquivo `.env.local`

Na raiz do projeto, crie ou edite o arquivo `.env.local` e adicione a variável:

```env
# Google OAuth 2.0 Client ID
VITE_GOOGLE_CLIENT_ID=seu_client_id_aqui

# Lista de e-mails permitidos (separados por vírgula)
VITE_ALLOWED_EMAILS=seuemail@gmail.com,funcionario@empresa.com,gerente@loja.com
```

### 2. Formato da Lista

- **Múltiplos e-mails**: Separe por vírgula
- **Espaços**: São ignorados automaticamente
- **Case-insensitive**: `Usuario@Email.com` e `usuario@email.com` são tratados igual
- **Lista vazia**: Se deixar `VITE_ALLOWED_EMAILS` vazio ou não definido, **nenhum usuário** poderá acessar (por segurança)

### 3. Exemplos

**Um único e-mail:**
```env
VITE_ALLOWED_EMAILS=admin@empresa.com
```

**Múltiplos e-mails:**
```env
VITE_ALLOWED_EMAILS=admin@empresa.com,gerente@empresa.com,funcionario@empresa.com
```

**Com espaços (serão removidos automaticamente):**
```env
VITE_ALLOWED_EMAILS=admin@empresa.com, gerente@empresa.com , funcionario@empresa.com
```

### 4. Reiniciar o Servidor

Após editar o `.env.local`, você precisa **reiniciar o servidor de desenvolvimento**:

```bash
# Pare o servidor (Ctrl+C) e reinicie
npm run dev
```

## 🔒 Comportamento de Segurança

- ✅ **Lista definida**: Apenas e-mails na lista podem acessar
- ❌ **Lista vazia**: Nenhum usuário pode acessar (bloqueio total)
- ❌ **E-mail não na lista**: Acesso negado com mensagem clara

## 🧪 Testando

1. Configure a variável `VITE_ALLOWED_EMAILS` no `.env.local`
2. Reinicie o servidor (`npm run dev`)
3. Tente fazer login com um e-mail **na lista** → ✅ Deve funcionar
4. Tente fazer login com um e-mail **fora da lista** → ❌ Deve negar acesso

## 📝 Logs no Console

O sistema registra no console do navegador:

- `👤 Usuário tentando logar: email@exemplo.com` - Quando alguém tenta fazer login
- `⛔ Acesso negado para: email@exemplo.com` - Quando o acesso é negado

## 🔄 Para Produção (Netlify/Vercel)

Ao fazer deploy, adicione a variável `VITE_ALLOWED_EMAILS` nas configurações de ambiente da plataforma:

- **Netlify**: Site settings → Environment variables
- **Vercel**: Project settings → Environment Variables

## ⚠️ Importante

- A verificação acontece no **frontend**, então não é 100% seguro contra usuários maliciosos
- Para maior segurança, considere implementar esta verificação também no backend
- A lista de e-mails é visível no código JavaScript compilado (mas isso é aceitável para controle de acesso básico)

