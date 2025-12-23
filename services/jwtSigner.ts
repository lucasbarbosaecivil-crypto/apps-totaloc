/**
 * Assinatura de JWT usando Web Crypto API (funciona no browser)
 * Baseado em: https://developers.google.com/identity/protocols/oauth2/service-account#authorizingrequests
 */

/**
 * Converte string base64 para ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
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
 */
function base64urlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
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

    // Converte assinatura para base64url
    const signatureArray = new Uint8Array(signature);
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    const encodedSignature = signatureBase64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Retorna JWT completo
    return `${data}.${encodedSignature}`;
  } catch (error: any) {
    console.error('Erro ao assinar JWT:', error);
    throw new Error(`Falha ao assinar JWT: ${error.message}`);
  }
}

