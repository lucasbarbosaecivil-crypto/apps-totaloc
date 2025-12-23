# 🚀 Guia Rápido - Primeiros Passos

## 1️⃣ Instalação e Configuração

### Passo 1: Instalar Dependências

```bash
npm install
npm install @react-oauth/google
```

### Passo 2: Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```

2. Edite `.env.local` e adicione suas chaves:

```env
GEMINI_API_KEY=sua_chave_gemini_aqui
VITE_GOOGLE_CLIENT_ID=seu_client_id_google_aqui
```

### Passo 3: Obter Google OAuth Client ID

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto ou selecione existente
3. Ative **Google Sheets API** e **Google Drive API**
4. Vá em **Credenciais** → **Criar Credenciais** → **ID do cliente OAuth 2.0**
5. Configure:
   - Tipo: **Aplicativo Web**
   - Nome: `RentalPro App`
   - Origens JavaScript autorizadas: 
     - `http://localhost:3000`
     - `http://localhost:5173` (Vite padrão)
   - URIs de redirecionamento autorizados:
     - `http://localhost:3000`
     - `http://localhost:5173`
6. Copie o **Client ID** e cole no `.env.local`

---

## 2️⃣ Configurar a Planilha

### Opção A: Usar a Planilha Existente (Recomendado)

✅ A planilha já está configurada: `1BoQDpRDjg_Cwp-9OSkf2emUdkmdF7xx5ZIPGJNm5vuQ`

1. Abra: https://docs.google.com/spreadsheets/d/1BoQDpRDjg_Cwp-9OSkf2emUdkmdF7xx5ZIPGJNm5vuQ/edit
2. Verifique se a aba **EQUIPAMENTOS** existe com os cabeçalhos:
   - ID_Equipamento
   - Nome
   - Descricao
   - Foto
   - Num_Serie
   - Valor_Diaria

### Opção B: Criar Outras Abas Manualmente

Se quiser criar as outras abas agora:

1. **ESTOQUE**
   - Cabeçalhos: `ID_Item | ID_Equipamento | Num_Serie | Foto`

2. **CLIENTES**
   - Cabeçalhos: `ID_Cliente | Nome | Telefone | Email | Endereco`

3. **ORDENS_SERVICO**
   - Cabeçalhos: `ID_OS | ID_Cliente | Status_OS | Desconto_Manual | Valor_Total_Previsto | Valor_Total_Real | Data_Criacao`

4. **OS_ITENS**
   - Cabeçalhos: `ID_OS | ID_Item_Estoque | Valor_No_Contrato | Data_Inicio | Data_Fim_Prevista | Data_Devolucao_Real`

**OU** deixe o sistema criar automaticamente na primeira sincronização!

### Importante: Permissões

A conta Google que usar no app precisa ter **permissão de edição** na planilha:

1. Abra a planilha
2. Clique em **Compartilhar**
3. Adicione seu email com permissão **Editor**

---

## 3️⃣ Executar o App

```bash
npm run dev
```

O app estará disponível em: `http://localhost:3000` ou `http://localhost:5173`

---

## 4️⃣ Conectar ao Google Sheets

1. No app, clique no botão **"Conectar Sheets"** no header
2. O ID da planilha já estará pré-preenchido: `1BoQDpRDjg_Cwp-9OSkf2emUdkmdF7xx5ZIPGJNm5vuQ`
   - Ou clique em "Usar planilha padrão" para preencher automaticamente
3. Clique em **"Conectar com Google"**
4. Selecione sua conta Google
5. Autorize o acesso à planilha
6. Aguarde a sincronização inicial

---

## 5️⃣ Usar o App

Agora você pode:

- ✅ **Dashboard**: Ver métricas e gráficos
- ✅ **Catálogo**: Gerenciar modelos de equipamentos
- ✅ **Estoque**: Cadastrar unidades físicas
- ✅ **Clientes**: Cadastrar clientes
- ✅ **Locações**: Criar ordens de serviço
- ✅ **Histórico**: Ver locações finalizadas
- ✅ **IA**: Consultar assistente sobre AppSheet

Todos os dados são **sincronizados automaticamente** com o Google Sheets!

---

## 🐛 Problemas Comuns

### Erro: "Client ID não encontrado"
- Verifique se `.env.local` existe
- Verifique se `VITE_GOOGLE_CLIENT_ID` está definido
- Reinicie o servidor de desenvolvimento

### Erro: "Planilha não encontrada"
- Verifique se o ID está correto
- Verifique se você tem permissão de edição na planilha

### Erro: "Não foi possível autenticar"
- Verifique se o Client ID está correto
- Verifique se as origens JavaScript estão configuradas corretamente no Google Cloud

### Dados não aparecem
- Clique no botão "Sync" para forçar sincronização
- Verifique o console do navegador (F12) para erros

---

## 📱 Próximos Passos: PWA para Android

Para transformar em app Android instalável:

1. Configure PWA (manifest.json)
2. Adicione Service Worker
3. Faça build de produção: `npm run build`
4. Deploy em hosting (Vercel, Netlify, etc.)
5. Instale no Android pelo navegador Chrome

Veja `PLANO_IMPLEMENTACAO.md` para detalhes.

---

## 📚 Documentação Completa

- `ANALISE_PROJETO.md` - Análise completa do projeto
- `PLANO_IMPLEMENTACAO.md` - Plano detalhado de implementação
- `CONFIGURACAO_PLANILHA.md` - Detalhes sobre estrutura da planilha

---

## ✅ Checklist Rápido

- [ ] Dependências instaladas (`npm install`)
- [ ] `.env.local` configurado com `VITE_GOOGLE_CLIENT_ID`
- [ ] Google OAuth Client ID criado no Google Cloud
- [ ] Planilha acessível e com permissões corretas
- [ ] App rodando (`npm run dev`)
- [ ] Conectado ao Google Sheets
- [ ] Dados sincronizando corretamente

🎉 **Pronto para usar!**

