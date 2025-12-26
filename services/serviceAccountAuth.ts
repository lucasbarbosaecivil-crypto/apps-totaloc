/**
 * Autenticação com Google Service Account
 * Usa as credenciais do arquivo JSON para autenticação automática
 * Implementação para browser usando fetch API
 */

interface ServiceAccountConfig {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;
let serviceAccountKey: ServiceAccountConfig | null = null;

/**
 * Carrega as credenciais da Service Account do arquivo JSON
 */
async function loadServiceAccountKey(): Promise<ServiceAccountConfig> {
  if (serviceAccountKey) {
    return serviceAccountKey;
  }

  try {
    console.log('📄 Tentando carregar arquivo de credenciais...');
    // Carrega o arquivo JSON dinamicamente via fetch (evita problemas com Vite)
    const response = await fetch('/locadora-482015-14c6cb061046.json');
    if (!response.ok) {
      const errorMsg = `Erro ${response.status} ao carregar credenciais: ${response.statusText}`;
      console.error('❌', errorMsg);
      if (response.status === 404) {
        throw new Error('Arquivo de credenciais não encontrado (404). Verifique se o arquivo está em public/locadora-482015-14c6cb061046.json');
      }
      throw new Error(errorMsg);
    }
    const data = await response.json();
    serviceAccountKey = data as ServiceAccountConfig;
    console.log('✅ Arquivo de credenciais carregado com sucesso');
    return serviceAccountKey;
  } catch (error: any) {
    console.error('❌ Erro ao carregar Service Account Key:', error);
    // Mensagem mais específica baseada no tipo de erro
    if (error.message?.includes('404') || error.message?.includes('Failed to fetch')) {
      throw new Error(`Arquivo de credenciais não encontrado. Verifique se o arquivo locadora-482015-14c6cb061046.json está na pasta public/ e foi incluído no deploy.`);
    }
    throw new Error(`Não foi possível carregar credenciais: ${error.message}`);
  }
}

/**
 * Autentica com Service Account e retorna o access token
 * Usa Web Crypto API para assinar JWT no browser
 */
export async function authenticateWithServiceAccount(): Promise<string> {
  // Verifica se o token ainda é válido (válido por ~1 hora)
  if (cachedAccessToken && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }

  try {
    // Carrega credenciais
    const credentials = await loadServiceAccountKey();

    // Gera JWT assinado
    // Tenta usar jose primeiro (mais confiável), fallback para implementação manual
    let signJWT;
    try {
      const joseModule = await import('./jwtSignerJose');
      signJWT = joseModule.signJWT;
      console.log('✅ Usando biblioteca jose para assinar JWT');
    } catch (error) {
      console.log('⚠️ jose não disponível, usando implementação manual');
      const manualModule = await import('./jwtSigner');
      signJWT = manualModule.signJWT;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600; // 1 hora

    const jwt = await signJWT(
      credentials.private_key,
      {
        iss: credentials.client_email,
        sub: credentials.client_email,
        aud: credentials.token_uri,
        exp: expiry,
        iat: now,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
      }
    );

    // Troca JWT por access token
    const response = await fetch(credentials.token_uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      const errorDetails = error.error || error;
      const errorMessage = typeof errorDetails === 'string' 
        ? errorDetails 
        : (errorDetails?.message || errorDetails?.error || JSON.stringify(errorDetails));
      
      console.error('❌ Erro detalhado do Google:', error);
      console.error('   Status:', response.status);
      console.error('   Erro:', errorMessage);
      
      // Mensagens mais específicas para erros comuns
      if (errorMessage.includes('invalid_grant')) {
        throw new Error(`Erro de autenticação (invalid_grant). Verifique se:
- A chave privada no arquivo JSON está correta
- O relógio do sistema está sincronizado
- As credenciais não expiraram`);
      }
      
      throw new Error(`Falha ao obter access token: ${errorMessage}`);
    }

    const tokenData = await response.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('Access token não retornado');
    }

    // Cache o token (expira em 50 minutos para segurança)
    cachedAccessToken = accessToken;
    tokenExpiry = Date.now() + (50 * 60 * 1000);

    return accessToken;
  } catch (error: any) {
    console.error('Erro ao autenticar com Service Account:', error);
    // Limpa cache em caso de erro
    cachedAccessToken = null;
    tokenExpiry = 0;
    throw new Error(`Falha na autenticação: ${error.message || 'Erro desconhecido'}`);
  }
}

/**
 * Obtém configuração da planilha
 */
export function getServiceAccountConfig() {
  return {
    spreadsheetId: '1BoQDpRDjg_Cwp-9OSkf2emUdkmdF7xx5ZIPGJNm5vuQ',
    getAccessToken: authenticateWithServiceAccount,
  };
}

/**
 * Limpa cache de token (útil para forçar nova autenticação)
 */
export function clearTokenCache() {
  cachedAccessToken = null;
  tokenExpiry = 0;
}

