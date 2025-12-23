# 🔍 Diagnóstico: Página em Branco

## Como Diagnosticar

### 1. Abrir Console do Navegador

No navegador com a página aberta:

1. Pressione **F12** ou **Ctrl+Shift+I**
2. Vá na aba **"Console"**
3. Veja se há erros em vermelho

### 2. Erros Comuns e Soluções

#### Erro: "Failed to fetch" ou "Network Error"
**Causa:** Não consegue carregar o JSON da Service Account

**Solução:** 
- Verifique se o arquivo existe em `public/locadora-482015-14c6cb061046.json`
- Verifique o console para o erro exato

#### Erro: "Cannot find module" ou "Module not found"
**Causa:** Dependência faltando ou import incorreto

**Solução:**
```powershell
npm install
```

#### Erro: "React is not defined"
**Causa:** Problema com imports do React

**Solução:** Verifique se as dependências estão instaladas

#### Página totalmente branca sem erros
**Causa:** Erro silencioso durante renderização

**Solução:** Verifique a aba "Network" no DevTools

---

## Verificações Rápidas

### 1. Verificar se arquivos estão sendo servidos

No console, execute:
```javascript
fetch('/locadora-482015-14c6cb061046.json')
  .then(r => r.json())
  .then(d => console.log('✅ JSON carregado:', d))
  .catch(e => console.error('❌ Erro:', e));
```

### 2. Verificar se React está carregando

No console, execute:
```javascript
console.log('React:', typeof React);
console.log('ReactDOM:', typeof ReactDOM);
```

### 3. Verificar elemento root

No console:
```javascript
console.log('Root element:', document.getElementById('root'));
```

---

## Correções Aplicadas

Apliquei correções no código para:
- ✅ Tratamento de erros mais robusto
- ✅ Não quebrar app se Service Account falhar
- ✅ Usar cache local como fallback
- ✅ Logs mais informativos

---

## Próximos Passos

1. Abra o console do navegador (F12)
2. Recarregue a página (Ctrl+R ou F5)
3. Veja os erros no console
4. Me envie os erros para diagnóstico preciso

---

**Me envie os erros do console para ajudar a diagnosticar!**

