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
    
    // A chave privada vem do JSON já parseado, então \n literais já são quebras de linha reais
    // Mas pode vir como string com \n literais se for string JSON não parseada
    let processedKey = privateKey.trim();
    
    // Se tiver \\n (double backslash), são literais que precisam ser convertidos
    if (processedKey.includes('\\\\n')) {
      processedKey = processedKey.replace(/\\\\n/g, '\n');
    }
    // Se tiver \n como string literal (raramente, mas pode acontecer)
    else if (processedKey.includes('\\n') && !processedKey.includes('\n')) {
      processedKey = processedKey.replace(/\\n/g, '\n');
    }
    
    // jose espera a chave no formato PEM completo com headers
    // Verifica se já tem os headers corretos
    if (!processedKey.includes('BEGIN PRIVATE KEY')) {
      // Se não tiver headers, adiciona (mas isso não deveria acontecer)
      console.warn('⚠️ Chave privada sem headers PEM, adicionando...');
      const keyContent = processedKey.replace(/\s/g, ''); // Remove todos os espaços
      processedKey = `-----BEGIN PRIVATE KEY-----\n${keyContent}\n-----END PRIVATE KEY-----`;
    }
    
    console.log('🔑 Formato da chave:', processedKey.substring(0, 50) + '...');
    
    // Importa a chave usando jose (espera formato PEM completo)
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

