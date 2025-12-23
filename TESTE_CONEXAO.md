# 🧪 Como Testar a Conexão com Google Sheets

## Script de Teste Automático

Criei um script que testa a conexão completa com a planilha.

### Como usar:

```powershell
# Instalar dependências (se ainda não instalou)
npm install googleapis google-auth-library

# Executar teste
npm run test:connection
```

### O que o script testa:

1. ✅ **Autenticação** - Verifica se a Service Account funciona
2. ✅ **Leitura** - Testa se consegue ler dados da planilha
3. ✅ **Listagem de abas** - Mostra todas as abas existentes
4. ✅ **Verificação de abas** - Identifica abas faltantes
5. ✅ **Permissões de escrita** - Confirma que pode escrever

### Saída esperada:

```
🧪 Testando conexão com Google Sheets...

1️⃣ Autenticando com Service Account...
✅ Autenticação bem-sucedida!

2️⃣ Testando leitura da planilha...
✅ Leitura bem-sucedida!
   Cabeçalhos encontrados: [ 'ID_Equipamento', 'Nome', 'Descricao', ... ]

3️⃣ Listando abas da planilha...
✅ Abas encontradas:
   - EQUIPAMENTOS
   - ESTOQUE
   - CLIENTES
   ...

4️⃣ Verificando abas necessárias...
✅ Todas as abas necessárias existem!

5️⃣ Verificando permissões de escrita...
✅ Permissões de escrita confirmadas!

🎉 Todos os testes passaram! Conexão funcionando perfeitamente.
```

### Se houver erros:

O script mostrará mensagens de erro específicas e soluções.

---

## Teste Manual no Navegador

Depois de rodar o app (`npm run dev`):

1. Abra o console do navegador (F12)
2. Vá na aba "Console"
3. O app tentará conectar automaticamente
4. Veja se há erros ou mensagens de sucesso

### Verificar no console:

- ✅ "SW registered" - Service Worker funcionando
- ✅ Sem erros de autenticação
- ✅ Dados sendo carregados

---

## Verificação Visual

1. Abra o app no navegador
2. Verifique o header:
   - ✅ Status verde "✓ Sincronizado"
   - ✅ Botão "Sync" visível
3. Teste criar um equipamento:
   - ✅ Deve aparecer no app
   - ✅ Deve aparecer na planilha após sincronizar

---

## Checklist de Teste

- [ ] Script de teste executado com sucesso
- [ ] Todas as abas necessárias existem ou serão criadas
- [ ] Permissões de escrita confirmadas
- [ ] App carrega sem erros no console
- [ ] Status de sincronização mostra "Sincronizado"
- [ ] Teste criar um equipamento funciona
- [ ] Dados aparecem na planilha Google Sheets

---

**Execute o teste e me diga o resultado!** 🚀

