/**
 * Script de teste para verificar carregamento de equipamentos
 * Execute: node scripts/test-load-equipamentos.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SPREADSHEET_ID = '1BoQDpRDjg_Cwp-9OSkf2emUdkmdF7xx5ZIPGJNm5vuQ';

// Carrega credenciais
const credentialsPath = join(__dirname, '../public/locadora-482015-14c6cb061046.json');
const credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8'));

// Função para obter access token
async function getAccessToken() {
  const jwt = await signJWT(credentials.private_key, {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: credentials.token_uri,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
  });

  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await response.json();
  return data.access_token;
}

// Função simplificada de assinatura JWT (para teste)
async function signJWT(privateKey, payload) {
  // Para teste, vamos usar uma biblioteca ou implementação simples
  // Por enquanto, vamos fazer a requisição direta
  const { default: jwt } = await import('jsonwebtoken');
  return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
}

async function testLoadEquipamentos() {
  try {
    console.log('🔍 Testando carregamento de equipamentos...\n');
    
    // 1. Obter token
    console.log('1️⃣ Obtendo access token...');
    const token = await getAccessToken();
    console.log('✅ Token obtido\n');

    // 2. Listar todas as abas
    console.log('2️⃣ Listando todas as abas da planilha...');
    const sheetsResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    const sheetsData = await sheetsResponse.json();
    const sheetNames = sheetsData.sheets.map(s => s.properties.title);
    console.log('📋 Abas encontradas:', sheetNames);
    console.log('   - EQUIPAMENTOS existe?', sheetNames.includes('EQUIPAMENTOS'));
    console.log('   - Equipamentos existe?', sheetNames.includes('Equipamentos'));
    console.log('   - equipamentos existe?', sheetNames.includes('equipamentos'));
    console.log('');

    // 3. Tentar ler a aba EQUIPAMENTOS
    console.log('3️⃣ Tentando ler aba "EQUIPAMENTOS"...');
    const readResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/EQUIPAMENTOS!A:Z`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    if (!readResponse.ok) {
      const error = await readResponse.json();
      console.error('❌ Erro ao ler:', error);
      console.log('\n4️⃣ Tentando ler com nome diferente...');
      
      // Tentar com diferentes variações do nome
      for (const name of ['Equipamentos', 'equipamentos', 'EQUIPAMENTOS ']) {
        try {
          const testResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${name}!A:Z`,
            {
              headers: { 'Authorization': `Bearer ${token}` },
            }
          );
          if (testResponse.ok) {
            console.log(`✅ Encontrado com nome: "${name}"`);
            const data = await testResponse.json();
            console.log(`   Linhas: ${data.values?.length || 0}`);
            if (data.values && data.values.length > 0) {
              console.log('   Cabeçalhos:', data.values[0]);
              console.log('   Primeira linha de dados:', data.values[1]);
            }
            break;
          }
        } catch (e) {
          // Ignora
        }
      }
      return;
    }

    const data = await readResponse.json();
    const rows = data.values || [];
    
    console.log(`✅ Leitura bem-sucedida!`);
    console.log(`   Total de linhas: ${rows.length}`);
    
    if (rows.length === 0) {
      console.log('⚠️ Planilha está vazia!');
      return;
    }

    // 4. Mostrar cabeçalhos
    console.log('\n4️⃣ Cabeçalhos encontrados:');
    const headers = rows[0];
    headers.forEach((h, i) => {
      console.log(`   [${i}] "${h}"`);
    });

    // 5. Mostrar primeiras linhas de dados
    console.log('\n5️⃣ Primeiras 3 linhas de dados:');
    for (let i = 1; i < Math.min(4, rows.length); i++) {
      console.log(`   Linha ${i + 1}:`, rows[i]);
    }

    // 6. Verificar se os cabeçalhos esperados existem
    console.log('\n6️⃣ Verificando cabeçalhos esperados:');
    const expectedHeaders = ['ID_Equipamento', 'Nome', 'Descricao', 'Foto', 'Num_Serie', 'Valor_Diaria', 'Unidade', 'Quantidade'];
    expectedHeaders.forEach(expected => {
      const found = headers.some(h => h === expected || h?.trim() === expected);
      console.log(`   ${found ? '✅' : '❌'} "${expected}" ${found ? 'encontrado' : 'NÃO encontrado'}`);
    });

    // 7. Tentar mapear dados
    console.log('\n7️⃣ Tentando mapear dados:');
    const getCol = (colName) => {
      const idx = headers.indexOf(colName);
      return idx >= 0 ? (rows[1]?.[idx] || '') : '';
    };
    
    if (rows.length > 1) {
      const firstRow = rows[1];
      console.log('   ID_Equipamento:', getCol('ID_Equipamento') || firstRow[0]);
      console.log('   Nome:', getCol('Nome') || firstRow[1]);
      console.log('   Valor_Diaria:', getCol('Valor_Diaria') || firstRow[5]);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testLoadEquipamentos();

