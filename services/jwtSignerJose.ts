/**
 * Assinatura de JWT usando biblioteca jose (mais confiável)
 * Alternativa ao jwtSigner.ts que usa Web Crypto API manualmente
 */

import { SignJWT, importPKCS8 } from 'jose';

/**
 * Assina JWT usando biblioteca jose
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
    console.log('🔐 Usando biblioteca jose para assinar JWT...');
    
    // Processa a chave privada (trata \n literais)
    let processedKey = privateKey;
    if (processedKey.includes('\\n')) {
      processedKey = processedKey.replace(/\\n/g, '\n');
    }
    
    // jose espera a chave no formato PEM completo
    // Se não tiver headers, adiciona
    if (!processedKey.includes('BEGIN PRIVATE KEY')) {
      processedKey = `-----BEGIN PRIVATE KEY-----\n${processedKey.replace(/\s/g, '')}\n-----END PRIVATE KEY-----`;
    }
    
    // Importa a chave usando jose
    const key = await importPKCS8(processedKey, 'RS256');
    console.log('✅ Chave privada importada com jose');
    
    // Cria JWT usando jose
    const jwt = await new SignJWT({
      scope: payload.scope,
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt(payload.iat)
      .setExpirationTime(payload.exp)
      .setIssuer(payload.iss)
      .setSubject(payload.sub)
      .setAudience(payload.aud)
      .sign(key);
    
    console.log('✅ JWT assinado com sucesso usando jose');
    return jwt;
  } catch (error: any) {
    console.error('❌ Erro ao assinar JWT com jose:', error);
    console.error('   Mensagem:', error.message);
    throw new Error(`Falha ao assinar JWT com jose: ${error.message}`);
  }
}

