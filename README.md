# 🏗️ RentalPro Enterprise - Sistema de Gestão de Locação

Sistema completo de gestão de locação de equipamentos integrado com Google Sheets, desenvolvido em React + TypeScript. Transformado em PWA para instalação em dispositivos Android.

<div align="center">

![Status](https://img.shields.io/badge/status-pronto-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-19.2-blue)
![PWA](https://img.shields.io/badge/PWA-ready-purple)

[🚀 Início Rápido](#-início-rápido) • [📖 Documentação](#-documentação) • [🔧 Configuração](#-configuração) • [📱 PWA](#-pwa-para-android)

</div>

---

## ✨ Funcionalidades

- 📊 **Dashboard Interativo** - Métricas e gráficos em tempo real
- 📦 **Gestão de Catálogo** - Cadastro de modelos de equipamentos
- 📋 **Controle de Estoque** - Gerenciamento de unidades físicas
- 👥 **Cadastro de Clientes** - Base de dados completa
- 📝 **Ordens de Serviço** - Criação e gestão de locações
- 📄 **Geração de PDFs** - Contratos e comprovantes
- 🤖 **Assistente IA** - Consultoria sobre AppSheet
- ☁️ **Sincronização Google Sheets** - Banco de dados na nuvem
- 📱 **PWA Android** - Instalável como app nativo
- 🔄 **Sincronização Automática** - Dados sempre atualizados
- 💾 **Modo Offline** - Funciona sem internet

---

## 🚀 Início Rápido

### 1. Instalação

```bash
# Clonar repositório (se aplicável)
git clone <repo-url>
cd appsheet-architect---rental-edition

# Instalar dependências
npm install
npm install @react-oauth/google
```

### 2. Configuração

Crie o arquivo `.env.local` na raiz do projeto:

```env
VITE_GOOGLE_CLIENT_ID=seu_client_id_google_aqui
GEMINI_API_KEY=sua_chave_gemini_aqui
```

**Como obter Google Client ID:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto
3. Ative **Google Sheets API**
4. Crie credenciais OAuth 2.0
5. Configure origens: `http://localhost:3000`, `http://localhost:5173`

### 3. Executar

```bash
npm run dev
```

Acesse: `http://localhost:3000` ou `http://localhost:5173`

---

## 📖 Documentação

Documentação completa disponível:

- **[GUIA_RAPIDO.md](./GUIA_RAPIDO.md)** - Guia de início rápido passo a passo
- **[ANALISE_PROJETO.md](./ANALISE_PROJETO.md)** - Análise técnica completa do projeto
- **[CONFIGURACAO_PLANILHA.md](./CONFIGURACAO_PLANILHA.md)** - Estrutura e configuração do Google Sheets
- **[PLANO_IMPLEMENTACAO.md](./PLANO_IMPLEMENTACAO.md)** - Plano detalhado de implementação
- **[PROXIMOS_PASSOS.md](./PROXIMOS_PASSOS.md)** - Checklist de próximos passos
- **[RESUMO_IMPLEMENTACAO.md](./RESUMO_IMPLEMENTACAO.md)** - Resumo completo da implementação

---

## 🔧 Configuração

### Google Sheets

A planilha padrão está configurada:

**ID:** `1BoQDpRDjg_Cwp-9OSkf2emUdkmdF7xx5ZIPGJNm5vuQ`

[🔗 Abrir Planilha](https://docs.google.com/spreadsheets/d/1BoQDpRDjg_Cwp-9OSkf2emUdkmdF7xx5ZIPGJNm5vuQ/edit)

**Estrutura:**
- ✅ EQUIPAMENTOS (já existe)
- ✅ ESTOQUE (criado automaticamente)
- ✅ CLIENTES (criado automaticamente)
- ✅ ORDENS_SERVICO (criado automaticamente)
- ✅ OS_ITENS (criado automaticamente)

### Primeiro Uso

1. Abra o app
2. Clique em **"Conectar Sheets"**
3. O ID da planilha já está pré-preenchido
4. Clique em **"Conectar com Google"**
5. Autorize o acesso
6. Pronto! Dados sincronizam automaticamente

---

## 📱 PWA para Android

O app está configurado como PWA (Progressive Web App) e pode ser instalado em dispositivos Android.

### Instalação

**No Android:**
1. Acesse o app no Chrome
2. Menu (⋮) → "Adicionar à tela inicial"
3. Confirme
4. App instalado! 🎉

### Gerar Ícones

```bash
# Instalar dependência
npm install -D sharp

# Gerar ícones placeholder
npm run generate:icons
```

Ou use [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)

---

## 🏗️ Estrutura do Projeto

```
├── components/          # Componentes React
│   ├── GoogleAuth.tsx   # Autenticação OAuth
│   ├── SyncStatus.tsx   # Status de sincronização
│   └── ToastContainer.tsx # Notificações
├── hooks/              # Hooks customizados
│   ├── useSheetsSync.ts # Gerenciamento OAuth/Sync
│   ├── useSyncState.ts  # Estado sincronizado
│   └── useToast.ts      # Sistema de notificações
├── services/           # Serviços de integração
│   ├── googleSheetsService.ts # API do Sheets
│   ├── sheetsMappers.ts      # Conversão de dados
│   └── sheetsSyncService.ts  # Sincronização
├── public/             # Arquivos estáticos
│   ├── manifest.json   # PWA manifest
│   ├── sw.js          # Service Worker
│   └── icons/         # Ícones PWA
├── scripts/           # Scripts utilitários
│   └── generate-placeholder-icons.js
└── App.tsx            # Componente principal
```

---

## 🛠️ Tecnologias

- **React 19.2** - Framework UI
- **TypeScript 5.8** - Tipagem estática
- **Vite 6** - Build tool
- **Tailwind CSS** - Estilização
- **Recharts** - Gráficos
- **jsPDF** - Geração de PDFs
- **Google Sheets API** - Banco de dados
- **PWA** - Progressive Web App

---

## 📦 Scripts Disponíveis

```bash
npm run dev              # Desenvolvimento
npm run build            # Build de produção
npm run preview          # Preview do build
npm run generate:icons   # Gerar ícones PWA
```

---

## 🔐 Segurança

- Tokens OAuth armazenados em `localStorage` (criptografia recomendada para produção)
- Credenciais em variáveis de ambiente
- HTTPS obrigatório para PWA em produção

---

## 🐛 Troubleshooting

### Erro: "Client ID não encontrado"
- Verifique `.env.local` existe e tem `VITE_GOOGLE_CLIENT_ID`
- Reinicie o servidor

### Erro: "Planilha não encontrada"
- Verifique ID da planilha
- Verifique permissões (Editor)

### Sincronização não funciona
- Verifique console (F12)
- Teste sincronização manual
- Verifique conexão internet

Consulte [PROXIMOS_PASSOS.md](./PROXIMOS_PASSOS.md) para mais soluções.

---

## 📊 Status do Projeto

- ✅ Integração Google Sheets
- ✅ Autenticação OAuth 2.0
- ✅ Sincronização automática
- ✅ PWA configurada
- ✅ Service Worker
- ✅ Notificações toast
- ✅ Documentação completa
- ⚠️ Ícones PWA (gerar)
- ⚠️ Deploy em produção

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob licença privada.

---

## 👨‍💻 Autor

Desenvolvido para gestão de locação de equipamentos.

---

## 🔗 Links Úteis

- [Google Sheets API](https://developers.google.com/sheets/api)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)

---

<div align="center">

**🚀 Pronto para usar!**

[Documentação Completa](./GUIA_RAPIDO.md) • [Próximos Passos](./PROXIMOS_PASSOS.md)

</div>
