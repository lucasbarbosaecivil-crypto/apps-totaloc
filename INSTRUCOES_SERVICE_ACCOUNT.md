# 🔐 Instruções - Service Account

## ✅ Implementação Concluída

A integração foi adaptada para usar **Service Account** ao invés de OAuth. Isso significa:

- ✅ **Sem necessidade de login** - Autenticação automática
- ✅ **Sem popup OAuth** - Funciona automaticamente
- ✅ **Mais simples** - Apenas configure a planilha

---

## 📋 Configuração Necessária

### 1. Compartilhar Planilha com Service Account

A planilha precisa ser compartilhada com o email da Service Account:

1. Abra a planilha: https://docs.google.com/spreadsheets/d/1BoQDpRDjg_Cwp-9OSkf2emUdkmdF7xx5ZIPGJNm5vuQ/edit

2. Clique em **Compartilhar** (canto superior direito)

3. Adicione este email com permissão **Editor**:
   ```
   locadora-equip@locadora-482015.iam.gserviceaccount.com
   ```

4. Clique em **Enviar**

### 2. Instalar Dependências

Quando o Node.js estiver configurado, execute:

```powershell
npm install googleapis google-auth-library
```

---

## 🚀 Como Usar

### Passo 1: Instalar Dependências

```powershell
npm install
npm install googleapis google-auth-library
```

### Passo 2: Executar o App

```powershell
npm run dev
```

### Passo 3: Usar o App

1. O app **já está conectado automaticamente** via Service Account
2. Não precisa fazer login ou autenticar
3. Os dados sincronizam automaticamente com a planilha

### Passo 4: Configurar ID da Planilha (Opcional)

Se quiser usar outra planilha:

1. Clique no botão **⚙️** no header
2. Altere o ID da planilha
3. A sincronização funciona automaticamente

---

## 🔒 Segurança

### ⚠️ Importante

O arquivo `locadora-482015-14c6cb061046.json` contém **credenciais privadas**. 

**Para produção:**
- NÃO commite este arquivo no Git
- Adicione ao `.gitignore`
- Considere usar um backend intermediário

**Para desenvolvimento pessoal:**
- Está OK usar diretamente no frontend
- Mantenha o arquivo seguro

---

## 🐛 Troubleshooting

### Erro: "Permission denied" ou "Forbidden"

**Solução:** A planilha não foi compartilhada com a Service Account

1. Verifique se compartilhou com: `locadora-equip@locadora-482015.iam.gserviceaccount.com`
2. Verifique se a permissão é **Editor** (não apenas Visualizador)

### Erro: "Cannot find module 'locadora-482015-14c6cb061046.json'"

**Solução:** O arquivo não está na raiz do projeto

1. Verifique se o arquivo está em: `./locadora-482015-14c6cb061046.json`
2. Não deve estar em subpastas

### Erro: "Invalid credentials"

**Solução:** O arquivo JSON está corrompido ou inválido

1. Verifique se o arquivo está completo
2. Verifique se as chaves privadas não foram alteradas

---

## 📝 Diferenças da Versão OAuth

| Aspecto | OAuth (Anterior) | Service Account (Atual) |
|---------|------------------|-------------------------|
| Login necessário | ✅ Sim | ❌ Não |
| Popup de autenticação | ✅ Sim | ❌ Não |
| Configuração | Complexa | Simples |
| Segurança (frontend) | ✅ Mais seguro | ⚠️ Menos seguro* |
| Uso | Público | Interno/Pessoal |

*Service Account expõe credenciais no frontend, mas é aceitável para uso pessoal.

---

## ✅ Checklist

- [x] Service Account configurada
- [x] Arquivo JSON no projeto
- [x] Código adaptado para Service Account
- [ ] Planilha compartilhada com Service Account email
- [ ] Dependências instaladas (`googleapis`, `google-auth-library`)
- [ ] App testado e funcionando

---

## 🎉 Vantagens

1. **Mais simples** - Sem necessidade de login
2. **Mais rápido** - Autenticação automática
3. **Menos configuração** - Apenas compartilhar planilha
4. **Melhor UX** - Usuário não precisa fazer nada

---

**Pronto para usar!** 🚀

