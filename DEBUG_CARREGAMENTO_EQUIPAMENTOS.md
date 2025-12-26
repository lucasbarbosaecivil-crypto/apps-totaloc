# 🔍 Debug: Carregamento de Equipamentos do Google Sheets

## ✅ Alterações Realizadas

Foram adicionados logs detalhados de debug para identificar por que os equipamentos não estão sendo carregados do Google Sheets.

### 1. Logs Adicionados no `loadEquipamentos`

- ✅ Log quando inicia o carregamento
- ✅ Log com quantidade de linhas lidas
- ✅ Log com cabeçalhos encontrados
- ✅ Log com quantidade de linhas de dados
- ✅ Log para cada equipamento carregado
- ✅ Log de erro detalhado se algo falhar

### 2. Melhorias no `readSheetData`

- ✅ Agora usa range explícito `A:Z` ao invés de apenas o nome da aba
- ✅ Logs detalhados da URL e resposta da API
- ✅ Mensagens de erro mais informativas

### 3. Correção no `useSheetsSync`

- ✅ Agora usa o `spreadsheetId` do localStorage se existir
- ✅ Logs mostrando qual Spreadsheet ID está sendo usado
- ✅ Logs mais detalhados no `loadAll`

## 🔍 Como Diagnosticar

### Passo 1: Abrir o Console do Navegador

1. Abra o app no navegador (localhost ou Netlify)
2. Pressione **F12** para abrir o DevTools
3. Vá na aba **Console**

### Passo 2: Procurar por Logs

Você deve ver logs como:

```
🔧 Configurando Service Account...
✅ Service Account configurado com sucesso
📊 Usando Spreadsheet ID: 1BoQDpRDjg_Cwp-9OSk...
🔄 Tentando carregar dados do Google Sheets automaticamente...
📥 Carregando dados do Google Sheets...
📥 Carregando equipamentos da aba EQUIPAMENTOS...
🔍 Lendo planilha: EQUIPAMENTOS!A:Z (Spreadsheet ID: 1BoQDpRDjg_Cwp-9OSk...)
✅ Leitura bem-sucedida: X linhas encontradas
📊 Linhas lidas: X
📋 Cabeçalhos encontrados: [...]
📦 Linhas de dados: X
✅ X equipamentos carregados com sucesso
```

### Passo 3: Verificar Possíveis Problemas

#### Problema 1: Planilha Vazia
**Sintoma:**
```
⚠️ Planilha EQUIPAMENTOS está vazia ou não possui dados
📊 Linhas lidas: 0
```

**Solução:**
- Verifique se há dados na aba EQUIPAMENTOS do Google Sheets
- Certifique-se de que há pelo menos uma linha de cabeçalho e uma linha de dados

#### Problema 2: Erro de Autenticação
**Sintoma:**
```
❌ Erro ao ler planilha: Erro 403...
Erro de autenticação: ...
```

**Solução:**
- Verifique se o arquivo de credenciais está em `public/locadora-482015-14c6cb061046.json`
- Verifique se a Service Account tem permissão de Editor na planilha

#### Problema 3: Aba Não Encontrada
**Sintoma:**
```
❌ Erro ao ler planilha: Unable to parse range
```

**Solução:**
- Verifique se a aba se chama exatamente **"EQUIPAMENTOS"** (maiúsculas, sem espaços extras)
- O nome da aba deve ser exatamente como está no código

#### Problema 4: Cabeçalhos Incorretos
**Sintoma:**
```
📋 Cabeçalhos encontrados: ["ID_Equipamento", "Nome", ...]
✅ 0 equipamentos carregados com sucesso
```

**Solução:**
- Verifique se os cabeçalhos na primeira linha da planilha estão corretos
- Devem ser: `ID_Equipamento`, `Nome`, `Descricao`, `Foto`, `Num_Serie`, `Valor_Diaria`, `Unidade`, `Quantidade`
- A ordem não precisa ser exata, mas os nomes devem estar corretos

#### Problema 5: Erro ao Converter Linha
**Sintoma:**
```
❌ Erro ao converter linha 2: ...
```

**Solução:**
- Verifique a linha específica no Google Sheets
- Certifique-se de que os dados estão no formato correto
- `Valor_Diaria` deve ser um número
- `ID_Equipamento` e `Nome` são obrigatórios

## 📋 Checklist de Verificação

- [ ] Arquivo de credenciais existe em `public/locadora-482015-14c6cb061046.json`
- [ ] Service Account tem permissão de Editor na planilha
- [ ] Aba se chama exatamente "EQUIPAMENTOS" (sem espaços, maiúsculas)
- [ ] Primeira linha contém os cabeçalhos
- [ ] Há pelo menos uma linha de dados abaixo dos cabeçalhos
- [ ] `ID_Equipamento` e `Nome` estão preenchidos em todas as linhas
- [ ] `Valor_Diaria` é um número válido

## 🔧 Próximos Passos

1. **Recarregue a página** e abra o console (F12)
2. **Copie todos os logs** que aparecerem relacionados a "equipamentos" ou "EQUIPAMENTOS"
3. **Me envie os logs** para que eu possa identificar o problema específico

Ou, se preferir:
1. **Clique no botão "Carregar do Google Sheets"** na interface
2. **Observe os logs no console**
3. **Me diga qual erro aparece** (se houver)

---

**Com os logs detalhados, poderemos identificar exatamente onde está o problema!** 🔍

