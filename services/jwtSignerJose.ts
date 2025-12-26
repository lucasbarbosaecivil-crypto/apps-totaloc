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
    
    // CRÍTICO: A chave privada pode ter \n como texto literal (duas letras: \ e n)
    // em vez de quebras de linha reais. Precisamos converter isso.
    // Isso acontece quando o JSON tem "\\n" (escape duplo) ou quando vem de variável de ambiente
    let processedKey = privateKey;
    
    // Primeiro, normaliza a chave - converte \n literais para quebras de linha reais
    // O replace converte o texto "\n" em uma quebra de linha real
    processedKey = processedKey.replace(/\\n/g, '\n');
    
    // Remove espaços extras no início e fim
    processedKey = processedKey.trim();
    
    // jose espera a chave no formato PEM completo com headers
    // Verifica se já tem os headers corretos
    if (!processedKey.includes('BEGIN PRIVATE KEY')) {
      // Se não tiver headers, adiciona (mas isso não deveria acontecer)
      console.warn('⚠️ Chave privada sem headers PEM, adicionando...');
      const keyContent = processedKey.replace(/\s/g, ''); // Remove todos os espaços
      processedKey = `-----BEGIN PRIVATE KEY-----\n${keyContent}\n-----END PRIVATE KEY-----`;
    }
    
    // Log para debug (mostra apenas o início)
    console.log('🔑 Formato da chave (primeiros 60 chars):', processedKey.substring(0, 60));
    console.log('🔑 Chave tem quebra de linha após BEGIN?', processedKey.includes('BEGIN PRIVATE KEY\n'));
    
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

