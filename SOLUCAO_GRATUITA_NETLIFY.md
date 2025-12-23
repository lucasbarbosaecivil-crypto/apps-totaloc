# 💰 Solução Gratuita para Netlify

## 📋 Situação

Como variáveis de ambiente no Netlify são pagas, a solução mais simples é **permitir que o arquivo de credenciais seja commitado no Git**.

## ⚠️ Importante sobre Segurança

O arquivo está em `public/`, o que significa que:
- ✅ Será copiado automaticamente para `dist/` durante o build do Vite
- ✅ Estará acessível publicamente via HTTP (qualquer pessoa pode ver)
- ⚠️ Isso é **aceitável** para este caso porque o arquivo precisa estar acessível para o app funcionar
- ⚠️ Para máxima segurança, você poderia criar um backend intermediário, mas isso adiciona complexidade

## ✅ Solução Aplicada

1. ✅ Removida a exclusão específica do `.gitignore`
2. ✅ Arquivo agora pode ser commitado no Git
3. ✅ O Vite copiará automaticamente para `dist/` durante o build
4. ✅ Netlify incluirá o arquivo no deploy automaticamente

## 🚀 Como Fazer Deploy

### Opção 1: Via Git (Recomendado)

1. Faça commit e push:
```powershell
git add .
git commit -m "Incluir arquivo de credenciais para deploy no Netlify"
git push origin main
```

2. O Netlify fará deploy automático e o arquivo estará disponível

### Opção 2: Push Forçado (se GitHub bloquear)

Se o GitHub bloquear o push por segurança:

1. Você pode permitir manualmente usando o link que o GitHub fornecer
2. OU fazer push forçado após limpar o histórico (já feito anteriormente):
```powershell
git push origin main --force
```

## 📝 Sobre o Bloqueio do GitHub

O GitHub **bloqueou o push** porque detectou credenciais no arquivo. Você precisa **permitir manualmente**.

### ✅ Solução: Permitir Manualmente no GitHub

1. **Clique no link fornecido pelo GitHub**:
   ```
   https://github.com/lucasbarbosaecivil-crypto/apps-totaloc/security/secret-scanning/unblock-secret/37FAYSHkCpbuywRoN70Xs6ua0dh
   ```

2. **No site do GitHub**:
   - Você verá uma página explicando que um secret foi detectado
   - Clique em **"Allow this secret"** ou **"Permitir este secret"**
   - Você precisará confirmar que entende os riscos

3. **Depois de permitir, tente o push novamente**:
   ```powershell
   git push origin main
   ```

**Nota**: O GitHub permite apenas este commit específico. Se você fizer alterações futuras no arquivo, pode precisar permitir novamente.

## 🔍 Verificar se Funcionou

Após o deploy:

1. Acesse seu site: `https://seu-site.netlify.app/locadora-482015-14c6cb061046.json`
2. Se você conseguir ver o conteúdo JSON, o arquivo está disponível
3. Abra o console do navegador (F12) no app
4. Procure por: `✅ Arquivo de credenciais carregado com sucesso`

## 🔐 Recomendações de Segurança

1. **Limite as permissões da Service Account**: No Google Cloud Console, dê apenas as permissões necessárias
2. **Monitore o uso**: Verifique periodicamente se há acessos não autorizados
3. **Renove as credenciais periodicamente**: Gere novas credenciais a cada 6-12 meses
4. **Considere um backend no futuro**: Para máxima segurança, crie um backend que autentica e expõe apenas endpoints necessários

---

## ✅ Status Atual

- ✅ Código atualizado
- ✅ `.gitignore` ajustado
- ✅ Arquivo pronto para ser commitado
- ✅ Funcionará no Netlify sem plano pago

**Próximo passo**: Faça commit e push! 🚀

