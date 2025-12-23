/**
 * Script de teste de conexão com Google Sheets
 * Executa: node scripts/test-connection.js
 */

import { JWT } from 'google-auth-library';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ler arquivo JSON manualmente (compatível com Node.js 24)
// Tenta public primeiro, depois raiz (fallback)
let serviceAccountKey;
try {
  serviceAccountKey = JSON.parse(
    readFileSync(join(__dirname, '..', 'public', 'locadora-482015-14c6cb061046.json'), 'utf8')
  );
} catch {
  serviceAccountKey = JSON.parse(
    readFileSync(join(__dirname, '..', 'locadora-482015-14c6cb061046.json'), 'utf8')
  );
}

const SPREADSHEET_ID = '1BoQDpRDjg_Cwp-9OSkf2emUdkmdF7xx5ZIPGJNm5vuQ';

async function testConnection() {
  console.log('🧪 Testando conexão com Google Sheets...\n');

  try {
    // 1. Autenticar
    console.log('1️⃣ Autenticando com Service Account...');
    const jwtClient = new JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
    });

    const credentials = await jwtClient.authorize();
    console.log('✅ Autenticação bem-sucedida!\n');

    // 2. Testar leitura
    console.log('2️⃣ Testando leitura da planilha...');
    const accessToken = credentials.access_token;
    
    const readResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/EQUIPAMENTOS!A1:F1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!readResponse.ok) {
      const error = await readResponse.json();
      throw new Error(`Erro ao ler: ${error.error?.message || readResponse.statusText}`);
    }

    const readData = await readResponse.json();
    console.log('✅ Leitura bem-sucedida!');
    console.log('   Cabeçalhos encontrados:', readData.values?.[0] || 'Nenhum cabeçalho');
    console.log('');

    // 3. Listar abas
    console.log('3️⃣ Listando abas da planilha...');
    const sheetsResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!sheetsResponse.ok) {
      throw new Error('Erro ao listar abas');
    }

    const sheetsData = await sheetsResponse.json();
    const sheets = sheetsData.sheets?.map(s => s.properties.title) || [];
    console.log('✅ Abas encontradas:');
    sheets.forEach(sheet => {
      console.log(`   - ${sheet}`);
    });
    console.log('');

    // 4. Verificar abas necessárias
    console.log('4️⃣ Verificando abas necessárias...');
    const requiredSheets = ['EQUIPAMENTOS', 'ESTOQUE', 'CLIENTES', 'ORDENS_SERVICO', 'OS_ITENS'];
    const missingSheets = requiredSheets.filter(sheet => !sheets.includes(sheet));
    
    if (missingSheets.length > 0) {
      console.log('⚠️  Abas faltantes (serão criadas automaticamente pelo app):');
      missingSheets.forEach(sheet => {
        console.log(`   - ${sheet}`);
      });
    } else {
      console.log('✅ Todas as abas necessárias existem!');
    }
    console.log('');

    // 5. Testar escrita (escrever em aba existente)
    console.log('5️⃣ Verificando permissões de escrita...');
    
    // Testa escrevendo na aba EQUIPAMENTOS (que já existe)
    const testWriteResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/EQUIPAMENTOS!A1000:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [['TESTE_TEMP', 'Teste de escrita', '', '', '', '0']],
        }),
      }
    );

    if (testWriteResponse.ok) {
      console.log('✅ Permissões de escrita confirmadas!');
      
      // Limpar linha de teste (buscar e deletar)
      const allData = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/EQUIPAMENTOS`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      
      const allDataJson = await allData.json();
      const rows = allDataJson.values || [];
      const testRowIndex = rows.findIndex(row => row[0] === 'TESTE_TEMP');
      
      if (testRowIndex >= 0) {
        // Deletar linha de teste usando batchUpdate
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requests: [{
                deleteDimension: {
                  range: {
                    sheetId: sheetsData.sheets.find(s => s.properties.title === 'EQUIPAMENTOS').properties.sheetId,
                    dimension: 'ROWS',
                    startIndex: testRowIndex,
                    endIndex: testRowIndex + 1,
                  },
                },
              }],
            }),
          }
        );
        console.log('   Linha de teste removida.');
      }
    } else {
      const error = await testWriteResponse.json();
      throw new Error(`Sem permissão de escrita: ${error.error?.message}`);
    }

    console.log('\n🎉 Todos os testes passaram! Conexão funcionando perfeitamente.\n');

  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
    console.error('\n📋 Possíveis soluções:');
    console.error('   1. Verifique se a planilha foi compartilhada com:');
    console.error(`      ${serviceAccountKey.client_email}`);
    console.error('   2. Verifique se a permissão é "Editor" (não apenas "Visualizador")');
    console.error('   3. Verifique se o ID da planilha está correto');
    process.exit(1);
  }
}

testConnection();

