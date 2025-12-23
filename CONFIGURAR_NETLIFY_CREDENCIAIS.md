# 🔐 Como Configurar Credenciais no Netlify

## ✅ Alterações no Código Concluídas

O código foi atualizado para suportar variáveis de ambiente. Agora o app tenta carregar as credenciais na seguinte ordem:

1. **Variável de ambiente** `VITE_NETLIFY_CREDENTIALS_FILE` (produção/Netlify)
2. **Arquivo JSON** `public/locadora-482015-14c6cb061046.json` (desenvolvimento local)

---

## 📋 Passos para Configurar no Netlify

### 1. Acessar Netlify Dashboard

1. Acesse: https://app.netlify.com
2. Selecione seu site
3. Vá em **Site settings** (ícone de engrenagem)

### 2. Adicionar Variável de Ambiente

1. No menu lateral, clique em **Environment variables**
2. Clique no botão **Add a variable**

3. Preencha:
   - **Key**: `VITE_NETLIFY_CREDENTIALS_FILE`
   - **Value**: Cole o conteúdo completo do arquivo JSON (`public/locadora-482015-14c6cb061046.json`)
     - Você pode copiar o conteúdo inteiro do arquivo
     - Pode colar com quebras de linha ou tudo em uma linha
   - **Scopes**: Deixe marcado **All scopes** (ou selecione apenas **Production** se preferir)

4. **IMPORTANTE**: Marque a opção **Sensitive variable** para ocultar o valor na interface

5. Clique em **Save**

### 3. Fazer Deploy

Após adicionar a variável, você pode:

**Opção A: Deploy automático (se conectado ao Git)**
- Faça commit e push das alterações
- O Netlify fará deploy automaticamente
- A variável de ambiente será incluída no build

**Opção B: Deploy manual**
```powershell
npm run build
netlify deploy --dir=dist --prod
```

### 4. Verificar se Funcionou

1. Acesse seu site no Netlify após o deploy
2. Abra o Console do navegador (F12 → Console)
3. Procure por uma destas mensagens:
   - ✅ `Credenciais carregadas de variável de ambiente` = **Sucesso!**
   - ✅ `Arquivo de credenciais carregado com sucesso` = Funcionou via arquivo (local)
   - ❌ `Arquivo de credenciais não encontrado` = Precisa verificar configuração

---

## 🔍 Troubleshooting

### Problema: "Arquivo de credenciais não encontrado"

**Solução:**
1. Verifique se a variável foi adicionada corretamente no Netlify
2. Verifique se o nome da variável está exatamente: `VITE_NETLIFY_CREDENTIALS_FILE`
3. Verifique se o conteúdo do JSON está correto (sem caracteres estranhos)
4. Faça um novo deploy após adicionar a variável

### Problema: "Erro ao fazer parse da variável de ambiente"

**Solução:**
1. Verifique se o JSON está bem formatado
2. Certifique-se de que copiou o JSON completo (incluindo `{` no início e `}` no fim)
3. Tente colar tudo em uma única linha (remova quebras de linha)

### Problema: Variável não está sendo lida

**Solução:**
1. Certifique-se de que fez um novo deploy após adicionar a variável
2. Verifique se está usando `VITE_NETLIFY_CREDENTIALS_FILE` (com `VITE_` no início)
3. No Netlify, vá em **Deploys** → selecione o último deploy → **Deploy log**
4. Procure por erros relacionados à variável de ambiente

---

## 📝 Notas Importantes

1. **Segurança**: Mesmo usando variáveis de ambiente, o JSON será embutido no código JavaScript que é enviado ao navegador. Para máxima segurança, considere criar um backend intermediário no futuro.

2. **Desenvolvimento Local**: O código continuará funcionando normalmente localmente usando o arquivo JSON em `public/`. A variável de ambiente é apenas para produção.

3. **Backup**: Mantenha uma cópia segura do arquivo JSON original. Se perder, você precisará gerar novas credenciais no Google Cloud Console.

---

## ✅ Checklist

- [ ] Variável `VITE_NETLIFY_CREDENTIALS_FILE` adicionada no Netlify
- [ ] Valor da variável é o JSON completo das credenciais
- [ ] Variável marcada como "Sensitive"
- [ ] Deploy realizado após adicionar a variável
- [ ] Console do navegador mostra "Credenciais carregadas de variável de ambiente"
- [ ] App consegue se conectar ao Google Sheets

---

**Pronto!** Seu app agora está configurado para usar variáveis de ambiente no Netlify! 🎉

