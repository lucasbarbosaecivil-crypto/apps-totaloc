# 🔧 Configuração da Planilha Google Sheets

## 📋 ID da Planilha
**ID:** `1BoQDpRDjg_Cwp-9OSkf2emUdkmdF7xx5ZIPGJNm5vuQ`

**Link:** https://docs.google.com/spreadsheets/d/1BoQDpRDjg_Cwp-9OSkf2emUdkmdF7xx5ZIPGJNm5vuQ/edit

---

## 📊 Estrutura das Abas

### 1. EQUIPAMENTOS (Catálogo de Modelos)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| ID_Equipamento | Text | Identificador único do modelo |
| Nome | Text | Nome do equipamento |
| Descricao | Text | Detalhes técnicos |
| Foto | Image/URL | Link para imagem (opcional) |
| Num_Serie | Text | Número de série padrão (não usado) |
| Valor_Diaria | Number | Preço de locação por dia |

**Exemplo de linha:**
```
M1 | Escavadeira Caterpillar 320 | Hidráulica | https://... | - | 1200
```

---

### 2. ESTOQUE (Unidades Físicas)

**Nota:** Esta aba precisa ser criada na planilha.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| ID_Item | Text | Serial/Número único do item |
| ID_Equipamento | Text | Referência ao modelo (EQUIPAMENTOS) |
| Num_Serie | Text | Número de série físico |
| Foto | Image/URL | Foto do equipamento |

**Exemplo de linha:**
```
SN-CAT-001 | M1 | SN-CAT-001 | https://...
```

---

### 3. CLIENTES

**Nota:** Esta aba precisa ser criada na planilha.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| ID_Cliente | Text | Identificador único |
| Nome | Text | Nome/Razão Social |
| Telefone | Text | Telefone de contato |
| Email | Text | Email para comunicação |
| Endereco | Text | Endereço completo |

**Exemplo de linha:**
```
c1 | Construtora Horizonte | (11) 98765-4321 | obra1@horizonte.com.br | Rua das Obras, 450 - SP
```

---

### 4. ORDENS_SERVICO

**Nota:** Esta aba precisa ser criada na planilha.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| ID_OS | Text | Número da Ordem de Serviço |
| ID_Cliente | Text | Referência ao cliente |
| Status_OS | Text | Ativo | Finalizado | Cancelado |
| Desconto_Manual | Number | Desconto aplicado (R$) |
| Valor_Total_Previsto | Number | Valor previsto no contrato |
| Valor_Total_Real | Number | Valor final após devolução |
| Data_Criacao | Date | Data de criação da OS |

**Exemplo de linha:**
```
OS-1234 | c1 | Ativo | 0 | 8400 | | 2024-01-15
```

---

### 5. OS_ITENS (Itens da Ordem de Serviço)

**Nota:** Esta aba precisa ser criada na planilha.  
Esta é uma tabela normalizada para relacionar OS com itens de estoque.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| ID_OS | Text | Referência à Ordem de Serviço |
| ID_Item_Estoque | Text | Referência ao item do estoque |
| Valor_No_Contrato | Number | Valor unitário no contrato |
| Data_Inicio | Date | Data de início da locação |
| Data_Fim_Prevista | Date | Data prevista de devolução |
| Data_Devolucao_Real | Date | Data real de devolução (opcional) |

**Exemplo de linha:**
```
OS-1234 | SN-CAT-001 | 1200 | 2024-01-15 | 2024-01-22 | 
```

---

## 🚀 Como Criar as Abas na Planilha

1. Abra a planilha: https://docs.google.com/spreadsheets/d/1BoQDpRDjg_Cwp-9OSkf2emUdkmdF7xx5ZIPGJNm5vuQ/edit

2. A aba **EQUIPAMENTOS** já existe! Verifique se os cabeçalhos estão corretos:
   - ID_Equipamento
   - Nome
   - Descricao
   - Foto
   - Num_Serie
   - Valor_Diaria

3. Para criar as outras abas:
   - Clique no **+** no canto inferior esquerdo
   - Renomeie para: `ESTOQUE`, `CLIENTES`, `ORDENS_SERVICO`, `OS_ITENS`
   - Adicione os cabeçalhos conforme as tabelas acima

4. **OU** deixe o sistema criar automaticamente na primeira sincronização!

---

## ✅ Verificação Rápida

Após criar/configurar as abas, verifique:

- [ ] Aba EQUIPAMENTOS existe com cabeçalhos corretos
- [ ] Aba ESTOQUE criada (ou será criada automaticamente)
- [ ] Aba CLIENTES criada (ou será criada automaticamente)
- [ ] Aba ORDENS_SERVICO criada (ou será criada automaticamente)
- [ ] Aba OS_ITENS criada (ou será criada automaticamente)
- [ ] Planilha está compartilhada com a conta Google que usará o app

---

## 🔐 Permissões Necessárias

A conta Google que você usar no app precisa ter **permissão de edição** na planilha:

1. Abra a planilha
2. Clique em **Compartilhar** (canto superior direito)
3. Adicione o email da conta Google com permissão **Editor**
4. Ou configure a planilha como "Qualquer pessoa com o link pode editar" (menos seguro)

---

## 🎯 Primeiro Uso

1. Abra o app
2. Clique em **"Conectar Sheets"** no header
3. O ID da planilha já estará pré-preenchido (ou clique em "Usar planilha padrão")
4. Clique em **"Conectar com Google"**
5. Autorize o app
6. Aguarde a sincronização inicial
7. Pronto! Os dados serão carregados do Sheets

---

## 📝 Notas Importantes

- **Backup**: Sempre mantenha backups da planilha
- **Estrutura**: Não altere os nomes das colunas (cabeçalhos)
- **IDs**: Os IDs devem ser únicos em cada aba
- **Datas**: Use formato ISO (YYYY-MM-DD) para datas
- **Valores**: Use números sem formatação (ex: 1200, não R$ 1.200,00)

---

## 🐛 Solução de Problemas

### Erro: "Planilha não encontrada"
- Verifique se o ID está correto
- Verifique se você tem permissão de acesso

### Erro: "Não foi possível ler a planilha"
- Verifique se as abas existem ou permita criação automática
- Verifique se os cabeçalhos estão corretos

### Dados não sincronizam
- Verifique a conexão com internet
- Clique em "Sincronizar" manualmente
- Verifique o console do navegador para erros

---

## 📞 Suporte

Em caso de dúvidas sobre a estrutura, consulte:
- `ANALISE_PROJETO.md` - Análise completa do projeto
- `PLANO_IMPLEMENTACAO.md` - Plano de implementação detalhado

