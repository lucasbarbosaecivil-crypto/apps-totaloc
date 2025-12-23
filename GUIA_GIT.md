# 📝 Guia: Como Publicar no Git

## Passo a Passo para Publicar Alterações

### 1️⃣ Adicionar arquivos ao staging

```powershell
git add .
```

Isso adiciona todos os arquivos modificados e novos ao staging.

### 2️⃣ Criar um commit

```powershell
git commit -m "Descrição das alterações"
```

Exemplo:
```powershell
git commit -m "Melhorias no tratamento de erros e sincronização com Google Sheets"
```

### 3️⃣ Conectar a um repositório remoto (se ainda não tiver)

Se você já tem um repositório no GitHub/GitLab/etc:

```powershell
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
```

Se ainda não tem, você precisa:
1. Criar um novo repositório no GitHub/GitLab/etc
2. Copiar a URL do repositório
3. Usar o comando acima

### 4️⃣ Publicar no repositório remoto

```powershell
git push -u origin master
```

Ou se sua branch principal for `main`:
```powershell
git push -u origin main
```

---

## 🔄 Comandos Úteis

### Ver status das alterações
```powershell
git status
```

### Ver histórico de commits
```powershell
git log
```

### Verificar repositório remoto configurado
```powershell
git remote -v
```

### Atualizar do remoto (se outros fizeram alterações)
```powershell
git pull
```

---

## ⚠️ Arquivos que NÃO serão commitados

O arquivo `.gitignore` está configurado para **não** commitar:
- `node_modules/` (dependências)
- `dist/` (build de produção)
- Arquivos de credenciais `*-*.json` (exceto os que estão em `public/`)

---

## 🚀 Para Publicar no Netlify via Git

1. **Conecte o Netlify ao seu repositório GitHub:**
   - Vá em Netlify Dashboard → Sites → Seu site → Site settings → Build & deploy
   - Em "Connected Git repository", clique em "Connect to Git provider"
   - Escolha GitHub e autorize
   - Selecione seu repositório

2. **Configure o build:**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Agora cada push no Git vai gerar um novo deploy automaticamente!**

---

## 📌 Próximos Passos

1. Execute `git add .`
2. Execute `git commit -m "Sua mensagem"`
3. Se tiver repositório remoto, execute `git push`
4. Se não tiver, crie um no GitHub e depois execute os comandos do passo 3

