# 🔧 Solução: Política de Execução do PowerShell

## ❌ Problema

```
npm : O arquivo C:\Program Files\nodejs\npm.ps1 não pode ser carregado porque 
a execução de scripts foi desabilitada neste sistema.
```

## ✅ Solução Rápida

### Opção 1: Alterar Política de Execução (Recomendado)

Execute no PowerShell **como Administrador**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Quando perguntar, digite `S` (Sim) e pressione Enter.

### Opção 2: Usar apenas para esta sessão

Se não quiser alterar permanentemente:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

Isso só funciona para a sessão atual do PowerShell.

---

## 📋 Passo a Passo Completo

### 1. Abrir PowerShell como Administrador

1. Pressione `Win + X`
2. Selecione **"Windows PowerShell (Admin)"** ou **"Terminal (Admin)"**
3. Se aparecer UAC, clique em "Sim"

### 2. Verificar política atual

```powershell
Get-ExecutionPolicy
```

Provavelmente mostrará: `Restricted`

### 3. Alterar política

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**O que isso faz:**
- `RemoteSigned`: Permite scripts locais e scripts baixados assinados
- `CurrentUser`: Aplica apenas ao seu usuário (não afeta outros usuários)

### 4. Confirmar

Quando perguntar:
```
A execução de scripts está desabilitada neste sistema. 
Deseja alterar a política de execução?
[S] Sim  [N] Não  [P] Parar  [?] Ajuda (o padrão é "N"):
```

Digite `S` e pressione Enter.

### 5. Verificar

```powershell
Get-ExecutionPolicy
```

Agora deve mostrar: `RemoteSigned`

### 6. Testar npm

```powershell
npm --version
```

Deve funcionar! ✅

---

## 🔄 Alternativa: Usar CMD ao invés de PowerShell

Se preferir não alterar a política:

1. Abra **CMD** (Prompt de Comando) ao invés de PowerShell
2. Navegue até o diretório do projeto:
   ```cmd
   cd "C:\Users\Lucas Barbosa\Desktop\Locacao\appsheet-architect---rental-edition"
   ```
3. Execute normalmente:
   ```cmd
   npm install
   npm run dev
   ```

---

## 🛡️ Segurança

### O que significa cada política:

- **Restricted**: Nenhum script pode executar (padrão)
- **RemoteSigned**: Scripts locais podem executar, scripts baixados precisam ser assinados
- **Unrestricted**: Todos os scripts podem executar (menos seguro)
- **Bypass**: Ignora todas as políticas (apenas para sessão atual)

**Recomendação:** Use `RemoteSigned` - é seguro e permite usar npm.

---

## ✅ Depois de Resolver

Quando o npm estiver funcionando:

```powershell
# Instalar dependências
npm install
npm install googleapis google-auth-library

# Executar app
npm run dev
```

---

## 🐛 Se ainda não funcionar

### Verificar se Node.js está no PATH:

```powershell
$env:Path -split ';' | Select-String -Pattern "node"
```

Se não mostrar nada, adicione manualmente ao PATH (veja instruções anteriores).

### Verificar instalação:

```powershell
Test-Path "C:\Program Files\nodejs\npm.cmd"
```

Deve retornar `True`.

---

**Execute o comando como Administrador e me diga o resultado!** 🚀

