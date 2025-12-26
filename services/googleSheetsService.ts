/**
 * Google Sheets Service
 * Gerencia todas as operações de leitura e escrita no Google Sheets
 * Agora usa OAuth 2.0 (token do usuário) ao invés de Service Account
 */

export interface SheetRange {
  sheetName: string;
  range?: string; // Ex: "A1:Z100" ou "A:Z" para colunas completas
}

/**
 * Função genérica para ler dados do Google Sheets
 */
export async function readSheetData(
  accessToken: string,
  spreadsheetId: string,
  range: SheetRange
): Promise<any[][]> {
  if (!accessToken) {
    throw new Error('Token de acesso não fornecido. Faça login com Google primeiro.');
  }

  if (!spreadsheetId) {
    throw new Error('ID da planilha não fornecido.');
  }

  // Se não especificar range, usa toda a aba (melhor para ler dados dinâmicos)
  const rangeStr = range.range 
    ? `${range.sheetName}!${range.range}` 
    : `${range.sheetName}!A:Z`; // Lê até a coluna Z por padrão

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeStr}`;
    console.log(`🔍 Lendo planilha: ${rangeStr} (Spreadsheet ID: ${spreadsheetId.substring(0, 10)}...)`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.error?.message || response.statusText;
      console.error(`❌ Erro HTTP ${response.status} ao ler planilha:`, errorMsg);
      console.error('   Detalhes do erro:', errorData);
      throw new Error(`Erro ao ler planilha ${range.sheetName}: ${errorMsg}`);
    }

    const data = await response.json();
    const values = data.values || [];
    console.log(`✅ Leitura bem-sucedida: ${values.length} linhas encontradas`);
    return values;
  } catch (error: any) {
    console.error(`❌ Erro ao ler do Google Sheets (aba: ${range.sheetName}):`, error);
    if (error.message) {
      console.error('   Mensagem:', error.message);
    }
    throw error;
  }
}

/**
 * Escreve dados em uma planilha específica
 * @param append Se true, adiciona no final; se false, substitui
 */
export async function writeSheetData(
  accessToken: string,
  spreadsheetId: string,
  range: SheetRange,
  values: any[][],
  append: boolean = false
): Promise<void> {
  if (!accessToken) {
    throw new Error('Token de acesso não fornecido. Faça login com Google primeiro.');
  }

  const rangeStr = range.range 
    ? `${range.sheetName}!${range.range}` 
    : `${range.sheetName}!A:Z`;

  try {
    const url = append
      ? `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeStr}:append?valueInputOption=RAW`
      : `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeStr}?valueInputOption=RAW`;

    const method = append ? 'POST' : 'PUT';

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
        ...(append ? {} : { range: rangeStr }),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro ao escrever na planilha: ${error.error?.message || response.statusText}`);
    }
  } catch (error) {
    console.error('Erro ao escrever no Google Sheets:', error);
    throw error;
  }
}

/**
 * Limpa e reescreve toda a planilha (útil para sincronização completa)
 */
export async function clearAndWriteSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  headers: string[],
  data: any[][]
): Promise<void> {
  if (!accessToken) {
    throw new Error('Token de acesso não fornecido. Faça login com Google primeiro.');
  }

  try {
    // Primeiro, limpa a planilha
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:Z:clear`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Depois, escreve cabeçalhos e dados
    const allRows = [headers, ...data];
    await writeSheetData(accessToken, spreadsheetId, { sheetName }, allRows, false);
  } catch (error) {
    console.error('Erro ao limpar e reescrever planilha:', error);
    throw error;
  }
}

/**
 * Verifica se a planilha existe e cria se não existir
 */
export async function ensureSheetExists(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<boolean> {
  if (!accessToken) {
    throw new Error('Token de acesso não fornecido. Faça login com Google primeiro.');
  }

  try {
    // Tenta ler a planilha para verificar se existe
    await readSheetData(accessToken, spreadsheetId, { sheetName, range: 'A1' });
    return true;
  } catch (error: any) {
    // Se não existir, cria usando batchUpdate
    if (error.message?.includes('Unable to parse range') || error.message?.includes('not found')) {
      try {
        const createResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requests: [
                {
                  addSheet: {
                    properties: {
                      title: sheetName,
                    },
                  },
                },
              ],
            }),
          }
        );

        if (!createResponse.ok) {
          const createError = await createResponse.json();
          throw new Error(`Erro ao criar aba: ${createError.error?.message || createResponse.statusText}`);
        }

        console.log(`✅ Aba "${sheetName}" criada com sucesso`);
        return true;
      } catch (createError: any) {
        console.error(`❌ Erro ao criar aba "${sheetName}":`, createError);
        throw new Error(`Não foi possível criar a aba "${sheetName}": ${createError.message}`);
      }
    }
    throw error;
  }
}
