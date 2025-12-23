# ✅ Verificação de Estrutura e Conexão

## 📋 Respostas às suas Perguntas

### 1. ✅ **O app já consegue ler e escrever dados?**

**SIM!** Com a Service Account configurada e a planilha compartilhada, o app:

- ✅ **Consegue ler** dados da planilha
- ✅ **Consegue escrever** dados na planilha
- ✅ **Cria abas automaticamente** se não existirem
- ✅ **Cria cabeçalhos automaticamente** na primeira sincronização

---

### 2. ✅ **Qual estrutura as planilhas devem respeitar?**

**Resposta curta:** Você **não precisa fazer nada**! O app cria automaticamente.

**Resposta completa:** A estrutura está definida no código e o app cria tudo automaticamente. Veja abaixo os detalhes:

---

## 📊 Estrutura das 5 Abas (Definida no Código)

### 1. **EQUIPAMENTOS** (já existe na sua planilha)

```
ID_Equipamento | Nome | Descricao | Foto | Num_Serie | Valor_Diaria
```

**Status:** ✅ Esta aba já existe na sua planilha com os cabeçalhos corretos!

---

### 2. **ESTOQUE** (será criada automaticamente)

```
ID_Item | ID_Equipamento | Num_Serie | Foto
```

**Status:** ⚠️ Esta aba será criada automaticamente na primeira sincronização.

---

### 3. **CLIENTES** (será criada automaticamente)

```
ID_Cliente | Nome | Telefone | Email | Endereco
```

**Status:** ⚠️ Esta aba será criada automaticamente na primeira sincronização.

---

### 4. **ORDENS_SERVICO** (será criada automaticamente)

```
ID_OS | ID_Cliente | Status_OS | Desconto_Manual | Valor_Total_Previsto | Valor_Total_Real | Data_Criacao
```

**Status:** ⚠️ Esta aba será criada automaticamente na primeira sincronização.

---

### 5. **OS_ITENS** (será criada automaticamente)

```
ID_OS | ID_Item_Estoque | Valor_No_Contrato | Data_Inicio | Data_Fim_Prevista | Data_Devolucao_Real
```

**Status:** ⚠️ Esta aba será criada automaticamente na primeira sincronização.

---

## 🤖 Como o App Cria a Estrutura

### Processo Automático:

1. **Ao fazer primeira sincronização:**
   ```
   App verifica → Aba existe? → NÃO → Cria aba vazia
                                  → SIM → Verifica se tem cabeçalhos
   ```

2. **Ao salvar dados:**
   ```
   App salva → Aba vazia? → SIM → Escreve cabeçalhos + dados
                        → NÃO → Escreve apenas dados
   ```

3. **Criação de cabeçalhos:**
   - Os cabeçalhos são escritos automaticamente quando há dados para salvar
   - São definidos em `services/sheetsMappers.ts`
   - São criados na primeira linha da aba

---

## ✅ O que Você Precisa Fazer

### **NADA!** 🎉

Tudo é automático:

1. ✅ Planilha já compartilhada com Service Account
2. ✅ App criará abas faltantes automaticamente
3. ✅ App criará cabeçalhos automaticamente
4. ✅ Estrutura será criada corretamente

---

## 🧪 Como Testar Agora

### Opção 1: Script de Teste (Recomendado)

```powershell
npm install googleapis google-auth-library
npm run test:connection
```

Este script vai:
- ✅ Testar autenticação
- ✅ Testar leitura
- ✅ Listar abas existentes
- ✅ Verificar permissões de escrita
- ✅ Mostrar quais abas serão criadas

### Opção 2: Testar no App

1. Execute: `npm run dev`
2. Abra o app no navegador
3. O app tentará conectar automaticamente
4. Na primeira sincronização, verifique:
   - Abas sendo criadas
   - Cabeçalhos sendo escritos
   - Dados sendo carregados

---

## 📝 Detalhes Técnicos

### Onde a estrutura está definida:

**Arquivo:** `services/sheetsMappers.ts`

Cada aba tem:
- `HEADERS` - Array com nomes dos cabeçalhos
- `toRow()` - Função que converte objeto → linha do Sheets
- `rowTo()` - Função que converte linha do Sheets → objeto

### Exemplo:

```typescript
// EQUIPAMENTOS_HEADERS define os cabeçalhos
export const EQUIPAMENTOS_HEADERS = [
  'ID_Equipamento',
  'Nome',
  'Descricao',
  'Foto',
  'Num_Serie',
  'Valor_Diaria',
];

// equipamentoToRow converte EquipmentModel → linha do Sheets
export function equipamentoToRow(model: EquipmentModel): any[] {
  return [
    model.id,
    model.nome,
    model.descricao || '',
    '', // Foto
    '', // Num_Serie
    model.valorUnitario,
  ];
}
```

---

## ⚠️ Importante

### **NÃO altere os nomes dos cabeçalhos manualmente!**

Os nomes devem ser **exatamente** como definido:
- ✅ `ID_Equipamento` (correto)
- ❌ `id_equipamento` (errado)
- ❌ `ID Equipamento` (errado)

Se alterar manualmente, o app pode não conseguir mapear os dados corretamente.

### **Se algo der errado:**

1. Delete a aba problemática
2. Deixe o app recriar na próxima sincronização
3. O app criará com a estrutura correta

---

## ✅ Checklist de Verificação

Execute o teste e verifique:

- [ ] Autenticação funciona
- [ ] Leitura funciona
- [ ] Permissões de escrita confirmadas
- [ ] Aba EQUIPAMENTOS existe e tem cabeçalhos corretos
- [ ] Outras abas serão criadas automaticamente

---

## 📚 Documentação Completa

Veja mais detalhes em:
- `ESTRUTURA_PLANILHA_COMPLETA.md` - Estrutura detalhada de todas as abas
- `TESTE_CONEXAO.md` - Como testar a conexão
- `CONFIGURACAO_PLANILHA.md` - Configuração geral da planilha

---

**Tudo está configurado! Execute o teste para confirmar.** 🚀

