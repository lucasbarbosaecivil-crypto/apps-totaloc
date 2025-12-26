/**
 * Assinatura de JWT usando Web Crypto API (funciona no browser)
 * Baseado em: https://developers.google.com/identity/protocols/oauth2/service-account#authorizingrequests
 */

/**
 * Converte string base64 para ArrayBuffer
 */
/**
 * Converte string base64 para ArrayBuffer
 * A chave privada vem em base64 padrão (não base64url)
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Remove espaços em branco
  const cleanBase64 = base64.trim();
  
  // Converte base64 para binário (sem fazer replace de - e _ pois é base64 padrão)
  const binaryString = atob(cleanBase64);
  
  // Converte para ArrayBuffer
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Converte chave privada PEM para CryptoKey
 */
async function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  // Remove headers e espaços
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = pemKey
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');

  // Converte base64 para ArrayBuffer
  const keyData = base64ToArrayBuffer(pemContents);

  // Importa a chave usando Web Crypto API
  return await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
}

/**
 * Codifica objeto para base64url
 * Usa encodeURIComponent para tratar caracteres Unicode corretamente
 */
function base64urlEncode(str: string): string {
  try {
    // Primeiro converte para UTF-8 bytes
    const utf8Bytes = new TextEncoder().encode(str);
    
    // Converte bytes para string binária
    let binaryString = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binaryString += String.fromCharCode(utf8Bytes[i]);
    }
    
    // Converte para base64
    const base64 = btoa(binaryString);
    
    // Converte para base64url
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch (error) {
    console.error('Erro ao codificar base64url:', error);
    throw error;
  }
}

/**
 * Assina JWT usando Web Crypto API
 */
export async function signJWT(
  privateKey: string,
  payload: {
    iss: string;
    sub: string;
    aud: string;
    exp: number;
    iat: number;
    scope: string;
  }
): Promise<string> {
  try {
    // Header
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    // Codifica header e payload
    const encodedHeader = base64urlEncode(JSON.stringify(header));
    const encodedPayload = base64urlEncode(JSON.stringify(payload));

    // Cria assinatura
    const data = `${encodedHeader}.${encodedPayload}`;
    const dataBuffer = new TextEncoder().encode(data);

    // Importa chave privada
    const key = await importPrivateKey(privateKey);

    // Assina
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      dataBuffer
    );

    // Converte assinatura para base64url (método mais robusto)
    const signatureArray = new Uint8Array(signature);
    // Usa método mais robusto para converter ArrayBuffer para base64
    let binaryString = '';
    for (let i = 0; i < signatureArray.length; i++) {
      binaryString += String.fromCharCode(signatureArray[i]);
    }
    const signatureBase64 = btoa(binaryString);
    const encodedSignature = signatureBase64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Retorna JWT completo
    return `${data}.${encodedSignature}`;
  } catch (error: any) {
    console.error('❌ Erro detalhado ao assinar JWT:', error);
    console.error('   Tipo:', error.name);
    console.error('   Mensagem:', error.message);
    console.error('   Stack:', error.stack);
    throw new Error(`Falha ao assinar JWT: ${error.message}`);
  }
}

