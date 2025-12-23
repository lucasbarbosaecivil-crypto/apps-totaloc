# 🚀 Plano de Implementação - Integração Google Sheets

## Status da Implementação

### ✅ Concluído

1. **Estrutura de Serviços**
   - ✅ `services/googleSheetsService.ts` - Operações básicas de API
   - ✅ `services/sheetsMappers.ts` - Conversão App ↔ Sheets
   - ✅ `services/sheetsSyncService.ts` - Sincronização bidirecional

2. **Hooks Customizados**
   - ✅ `hooks/useSheetsSync.ts` - Gerenciamento de autenticação e sync
   - ✅ `hooks/useSyncState.ts` - Estado sincronizado

3. **Componente de Autenticação**
   - ✅ `components/GoogleAuth.tsx` - UI de login

### 🔄 Em Progresso

4. **Integração no App Principal**
   - ⏳ Atualizar `App.tsx` para usar `useSyncState`
   - ⏳ Adicionar indicadores de sincronização
   - ⏳ Adicionar botão de sync manual

### 📋 Próximos Passos

5. **Configuração OAuth**
   - [ ] Instalar `@react-oauth/google`
   - [ ] Configurar GoogleProvider no `index.tsx`
   - [ ] Criar credenciais OAuth no Google Cloud Console

6. **PWA para Android**
   - [ ] Criar `manifest.json`
   - [ ] Configurar Service Worker
   - [ ] Adicionar ícones e splash screen
   - [ ] Configurar build de produção

7. **Testes e Refinamento**
   - [ ] Testar fluxo completo de sincronização
   - [ ] Tratamento de erros offline
   - [ ] Otimização de performance

---

## Instruções de Configuração

### 1. Instalar Dependências

```bash
npm install @react-oauth/google
# googleapis já está sendo usado via fetch direto (mais leve)
```

### 2. Configurar Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione existente
3. Ative a **Google Sheets API**
4. Vá em **Credenciais** → **Criar Credenciais** → **ID do cliente OAuth 2.0**
5. Configure:
   - Tipo: **Aplicativo Web**
   - Origens JavaScript autorizadas: `http://localhost:3000`
   - URIs de redirecionamento autorizados: `http://localhost:3000`
6. Copie o **Client ID**

### 3. Configurar no App

1. Crie arquivo `.env.local`:
```env
VITE_GOOGLE_CLIENT_ID=seu_client_id_aqui
```

2. Atualize `vite.config.ts` para incluir a variável:
```typescript
define: {
  'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID),
}
```

3. Atualize `index.tsx` para incluir GoogleProvider:
```typescript
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = process.env.GOOGLE_CLIENT_ID || '';

root.render(
  <GoogleOAuthProvider clientId={clientId}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </GoogleOAuthProvider>
);
```

### 4. Criar Planilha Google Sheets

1. Crie uma nova planilha no Google Sheets
2. Copie o ID da URL (entre `/d/` e `/edit`)
3. A planilha será estruturada automaticamente na primeira sincronização
4. Ou crie manualmente as abas:
   - EQUIPAMENTOS
   - ESTOQUE
   - CLIENTES
   - ORDENS_SERVICO
   - OS_ITENS

### 5. Fluxo de Uso

1. Usuário abre o app
2. Clica em "Conectar ao Google Sheets"
3. Informa o ID da planilha
4. Clica em "Conectar com Google"
5. Autoriza o app no popup Google
6. Dados são carregados automaticamente do Sheets
7. Mudanças são sincronizadas automaticamente (ou manualmente)

---

## Estrutura de Dados no Sheets

### Planilha: EQUIPAMENTOS
| ID_Equipamento | Nome | Descricao | Valor_Unitario | Unidade |
|---------------|------|-----------|----------------|---------|
| M1 | Escavadeira... | Hidráulica | 1200 | Diária |

### Planilha: ESTOQUE
| ID_Item | ID_Equipamento | Num_Serie | Foto |
|---------|----------------|-----------|------|
| SN-CAT-001 | M1 | SN-CAT-001 | https://... |

### Planilha: CLIENTES
| ID_Cliente | Nome | Telefone | Email | Endereco |
|-----------|------|----------|-------|----------|
| c1 | Construtora... | (11)... | ... | ... |

### Planilha: ORDENS_SERVICO
| ID_OS | ID_Cliente | Status_OS | Desconto_Manual | Valor_Total_Previsto | Valor_Total_Real | Data_Criacao |
|-------|-----------|-----------|-----------------|----------------------|------------------|--------------|
| OS-1234 | c1 | Ativo | 0 | 8400 | | 2024-01-15 |

### Planilha: OS_ITENS (Normalizado)
| ID_OS | ID_Item_Estoque | Valor_No_Contrato | Data_Inicio | Data_Fim_Prevista | Data_Devolucao_Real |
|-------|-----------------|-------------------|-------------|-------------------|---------------------|
| OS-1234 | SN-CAT-001 | 1200 | 2024-01-15 | 2024-01-22 | |

---

## Tratamento de Erros

### Erros Comuns

1. **"Não autenticado"**
   - Solução: Conectar ao Google Sheets primeiro

2. **"Planilha não encontrada"**
   - Solução: Verificar ID da planilha e permissões

3. **"Rate limit exceeded"**
   - Solução: Implementar retry com backoff exponencial

4. **"Offline"**
   - Solução: Usar cache local, sincronizar quando voltar online

---

## Performance

### Otimizações Implementadas

- Batch operations (limpar e reescrever)
- Cache local (localStorage como fallback)
- Lazy loading de dados históricos

### Limitações Conhecidas

- Google Sheets API: 100 requests/100 segundos
- Máximo 10 milhões de células por planilha
- Latência de rede (não ideal para dados em tempo real)

---

## Próximas Melhorias

1. **Sincronização Incremental**
   - Apenas mudanças, não reescrever tudo

2. **Resolução de Conflitos**
   - Timestamp de última modificação
   - Merge inteligente ou last-write-wins

3. **Modo Offline Avançado**
   - Service Worker para cache
   - Queue de operações pendentes

4. **Notificações**
   - Push notifications quando houver mudanças

5. **Backup Automático**
   - Versionamento de dados
   - Restauração de snapshots

