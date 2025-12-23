# 📊 Estrutura Completa das Planilhas - RentalPro

## ✅ Resposta Rápida

**O app cria automaticamente as abas faltantes E os cabeçalhos!**

Você **não precisa criar manualmente**. Na primeira sincronização, o app:
1. ✅ Cria as abas que não existem
2. ✅ Cria os cabeçalhos automaticamente
3. ✅ Estrutura tudo corretamente

---

## 📋 Estrutura das 5 Abas

### 1. **EQUIPAMENTOS** (Catálogo de Modelos)

**Cabeçalhos obrigatórios (ordem importa):**

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| `ID_Equipamento` | Text | Identificador único do modelo | ✅ Sim |
| `Nome` | Text | Nome do equipamento | ✅ Sim |
| `Descricao` | Text | Detalhes técnicos | ❌ Não |
| `Foto` | Text/URL | Link para imagem | ❌ Não |
| `Num_Serie` | Text | Número de série padrão | ❌ Não |
| `Valor_Diaria` | Number | Preço de locação por dia | ✅ Sim |

**Exemplo de dados:**
```
ID_Equipamento | Nome | Descricao | Foto | Num_Serie | Valor_Diaria
M1 | Escavadeira Caterpillar 320 | Hidráulica | https://... | - | 1200
M2 | Gerador Stemac 100kVA | Silencioso | https://... | - | 4500
```

---

### 2. **ESTOQUE** (Unidades Físicas)

**Cabeçalhos obrigatórios:**

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| `ID_Item` | Text | Serial/Número único do item | ✅ Sim |
| `ID_Equipamento` | Text | Referência ao modelo (EQUIPAMENTOS) | ✅ Sim |
| `Num_Serie` | Text | Número de série físico | ❌ Não |
| `Foto` | Text/URL | Foto do equipamento | ❌ Não |

**Exemplo de dados:**
```
ID_Item | ID_Equipamento | Num_Serie | Foto
SN-CAT-001 | M1 | SN-CAT-001 | https://...
SN-CAT-002 | M1 | SN-CAT-002 | https://...
SN-GEN-99 | M2 | SN-GEN-99 | https://...
```

---

### 3. **CLIENTES**

**Cabeçalhos obrigatórios:**

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| `ID_Cliente` | Text | Identificador único | ✅ Sim |
| `Nome` | Text | Nome/Razão Social | ✅ Sim |
| `Telefone` | Text | Telefone de contato | ❌ Não |
| `Email` | Text | Email para comunicação | ❌ Não |
| `Endereco` | Text | Endereço completo | ❌ Não |

**Exemplo de dados:**
```
ID_Cliente | Nome | Telefone | Email | Endereco
c1 | Construtora Horizonte | (11) 98765-4321 | obra1@horizonte.com.br | Rua das Obras, 450 - SP
```

---

### 4. **ORDENS_SERVICO**

**Cabeçalhos obrigatórios:**

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| `ID_OS` | Text | Número da Ordem de Serviço | ✅ Sim |
| `ID_Cliente` | Text | Referência ao cliente | ✅ Sim |
| `Status_OS` | Text | `Ativo`, `Finalizado`, `Cancelado` | ✅ Sim |
| `Desconto_Manual` | Number | Desconto aplicado (R$) | ❌ Não |
| `Valor_Total_Previsto` | Number | Valor previsto no contrato | ❌ Não |
| `Valor_Total_Real` | Number | Valor final após devolução | ❌ Não |
| `Data_Criacao` | Date | Data de criação da OS | ❌ Não |

**Exemplo de dados:**
```
ID_OS | ID_Cliente | Status_OS | Desconto_Manual | Valor_Total_Previsto | Valor_Total_Real | Data_Criacao
OS-1234 | c1 | Ativo | 0 | 8400 | | 2024-01-15
OS-1235 | c1 | Finalizado | 500 | 12000 | 11500 | 2024-01-10
```

---

### 5. **OS_ITENS** (Itens da Ordem de Serviço - Normalizado)

**Cabeçalhos obrigatórios:**

| Coluna | Tipo | Descrição | Obrigatório |
|--------|------|-----------|-------------|
| `ID_OS` | Text | Referência à Ordem de Serviço | ✅ Sim |
| `ID_Item_Estoque` | Text | Referência ao item do estoque | ✅ Sim |
| `Valor_No_Contrato` | Number | Valor unitário no contrato | ✅ Sim |
| `Data_Inicio` | Date | Data de início da locação | ✅ Sim |
| `Data_Fim_Prevista` | Date | Data prevista de devolução | ✅ Sim |
| `Data_Devolucao_Real` | Date | Data real de devolução | ❌ Não |

**Exemplo de dados:**
```
ID_OS | ID_Item_Estoque | Valor_No_Contrato | Data_Inicio | Data_Fim_Prevista | Data_Devolucao_Real
OS-1234 | SN-CAT-001 | 1200 | 2024-01-15 | 2024-01-22 | 
OS-1234 | SN-CAT-002 | 1200 | 2024-01-15 | 2024-01-22 | 2024-01-20
```

**Nota:** Esta é uma tabela normalizada. Uma OS pode ter múltiplos itens, cada um em uma linha.

---

## 🤖 Criação Automática

### O que o app faz automaticamente:

1. **Na primeira sincronização:**
   - ✅ Cria abas faltantes
   - ✅ Cria cabeçalhos automaticamente
   - ✅ Estrutura tudo corretamente

2. **Se a aba já existir mas estiver vazia:**
   - ✅ Adiciona os cabeçalhos na primeira escrita

3. **Se a aba já existir com dados:**
   - ✅ Lê os cabeçalhos existentes
   - ✅ Mapeia os dados corretamente

---

## ⚠️ Importante: Nomes das Colunas

### ❌ NÃO altere os nomes dos cabeçalhos!

Os nomes das colunas devem ser **exatamente** como acima, incluindo:
- ✅ Maiúsculas/minúsculas
- ✅ Underlines (`_`)
- ✅ Acentos e caracteres especiais

**Exemplo:**
- ✅ `ID_Equipamento` (correto)
- ❌ `id_equipamento` (errado)
- ❌ `ID Equipamento` (errado)
- ❌ `Id_Equipamento` (errado)

### ✅ Pode alterar:
- Ordem das colunas (mas primeira linha deve ter cabeçalhos)
- Formatação visual (cores, fontes, etc)
- Largura das colunas
- Formato de números/datas (mas valores devem ser corretos)

---

## 📝 Formato de Dados

### Datas
- **Formato:** `YYYY-MM-DD` (ISO)
- **Exemplo:** `2024-01-15`
- ✅ `2024-01-15`
- ❌ `15/01/2024`
- ❌ `01-15-2024`

### Números
- **Formato:** Número puro, sem formatação
- **Exemplo:** `1200` (não `R$ 1.200,00`)
- ✅ `1200`
- ✅ `1200.50`
- ❌ `R$ 1.200,00`
- ❌ `1.200`

### Texto
- Pode ter acentos
- Pode ter caracteres especiais
- Máximo: 50.000 caracteres por célula

---

## 🧪 Verificação Manual

Se quiser verificar a estrutura manualmente:

1. Abra a planilha
2. Verifique cada aba:
   - [ ] Nome da aba está correto
   - [ ] Primeira linha tem os cabeçalhos corretos
   - [ ] Cabeçalhos estão na ordem correta
3. Se algo estiver errado:
   - Delete a aba e deixe o app recriar
   - Ou corrija manualmente seguindo a estrutura acima

---

## 🔄 Sincronização

### Como funciona:

1. **Leitura (Load):**
   - Lê cabeçalhos da primeira linha
   - Mapeia colunas pelo nome
   - Converte dados para objetos do app

2. **Escrita (Save):**
   - Se aba não existe → cria aba
   - Se aba está vazia → escreve cabeçalhos + dados
   - Se aba tem dados → limpa e reescreve tudo (sincronização completa)

---

## 📊 Estado Atual da Sua Planilha

Baseado na planilha compartilhada:

- ✅ **EQUIPAMENTOS** - Existe com cabeçalhos corretos
- ⚠️ **ESTOQUE** - Será criada automaticamente
- ⚠️ **CLIENTES** - Será criada automaticamente
- ⚠️ **ORDENS_SERVICO** - Será criada automaticamente
- ⚠️ **OS_ITENS** - Será criada automaticamente

**Não precisa fazer nada!** O app cuida de tudo na primeira sincronização.

---

## 🐛 Troubleshooting

### "Erro ao ler planilha"
- Verifique se a aba existe
- Verifique se os cabeçalhos estão corretos
- Deixe o app recriar (delete a aba)

### "Dados não aparecem"
- Verifique se os cabeçalhos estão na primeira linha
- Verifique se os nomes estão corretos
- Sincronize manualmente

### "Estrutura incorreta"
- Delete a aba problemática
- Deixe o app recriar na próxima sincronização

---

## ✅ Checklist Final

- [x] Estrutura documentada
- [x] App cria automaticamente
- [x] Cabeçalhos definidos
- [x] Tipos de dados especificados
- [ ] Testar primeira sincronização
- [ ] Verificar criação automática

---

**Tudo pronto! O app cuida da estrutura automaticamente.** 🎉

