/**
 * Google Sheets Service
 * Gerencia todas as operações de leitura e escrita no Google Sheets
 */

import { authenticateWithServiceAccount } from './serviceAccountAuth';

export interface SheetsConfig {
  spreadsheetId: string;
  accessToken?: string; // Opcional, será obtido via Service Account se não fornecido
  getAccessToken?: () => Promise<string>; // Função para obter token dinamicamente
}

export interface SheetRange {
  sheetName: string;
  range?: string; // Ex: "A1:Z100" ou "A:Z" para colunas completas
}

/**
 * Converte dados do App para formato de array do Sheets
 */
export function convertToSheetRows<T>(
  data: T[],
  mapper: (item: T) => any[]
): any[][] {
  return data.map(mapper);
}

/**
 * Converte linhas do Sheets para dados do App
 */
export function convertFromSheetRows<T>(
  rows: any[][],
  headers: string[],
  mapper: (row: any[], headers: string[]) => T
): T[] {
  if (!rows || rows.length === 0) return [];
  // Pula a primeira linha (cabeçalhos)
  const dataRows = rows.slice(1);
  return dataRows.map(row => mapper(row, headers));
}

/**
 * Lê dados de uma planilha específica
 */
export async function readSheetData(
  config: SheetsConfig,
  sheetRange: SheetRange
): Promise<any[][]> {
  const range = sheetRange.range 
    ? `${sheetRange.sheetName}!${sheetRange.range}` 
    : `${sheetRange.sheetName}`;

  // Obter access token (via função ou valor estático)
  const accessToken = config.accessToken || 
    (config.getAccessToken ? await config.getAccessToken() : await authenticateWithServiceAccount());

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro ao ler planilha: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Erro ao ler do Google Sheets:', error);
    throw error;
  }
}

/**
 * Escreve dados em uma planilha específica
 * @param append Se true, adiciona no final; se false, substitui
 */
export async function writeSheetData(
  config: SheetsConfig,
  sheetRange: SheetRange,
  values: any[][],
  append: boolean = false
): Promise<void> {
  const range = sheetRange.range 
    ? `${sheetRange.sheetName}!${sheetRange.range}` 
    : `${sheetRange.sheetName}`;

  // Obter access token (via função ou valor estático)
  const accessToken = config.accessToken || 
    (config.getAccessToken ? await config.getAccessToken() : await authenticateWithServiceAccount());

  try {
    const url = append
      ? `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}:append?valueInputOption=RAW`
      : `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}?valueInputOption=RAW`;

    const method = append ? 'POST' : 'PUT';

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
        ...(append ? {} : { range }),
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
  config: SheetsConfig,
  sheetName: string,
  headers: string[],
  data: any[][]
): Promise<void> {
  // Obter access token
  const accessToken = config.accessToken || 
    (config.getAccessToken ? await config.getAccessToken() : await authenticateWithServiceAccount());

  try {
    // Primeiro, limpa a planilha
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${sheetName}!A:Z:clear`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Depois, escreve cabeçalhos + dados
    const allValues = [headers, ...data];
    await writeSheetData(
      config,
      { sheetName, range: 'A:Z' },
      allValues,
      false
    );
  } catch (error) {
    console.error('Erro ao limpar e reescrever planilha:', error);
    throw error;
  }
}

/**
 * Atualiza uma linha específica na planilha baseado em ID
 */
export async function updateRowById(
  config: SheetsConfig,
  sheetName: string,
  rowId: string,
  idColumnIndex: number,
  newValues: any[]
): Promise<void> {
  try {
    // Primeiro, encontra a linha com o ID
    const allData = await readSheetData(config, { sheetName });
    if (!allData || allData.length === 0) {
      throw new Error('Planilha vazia ou não encontrada');
    }

    const headers = allData[0];
    const dataRows = allData.slice(1);

    // Encontra o índice da linha
    const rowIndex = dataRows.findIndex(row => row[idColumnIndex] === rowId);
    
    if (rowIndex === -1) {
      throw new Error(`Linha com ID ${rowId} não encontrada`);
    }

    // Atualiza a linha (rowIndex + 2 porque Sheets começa em 1 e pula header)
    const range = `${sheetName}!A${rowIndex + 2}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex + 2}`;
    await writeSheetData(config, { sheetName, range }, [newValues], false);
  } catch (error) {
    console.error('Erro ao atualizar linha:', error);
    throw error;
  }
}

/**
 * Verifica se a planilha existe e cria se não existir
 */
export async function ensureSheetExists(
  config: SheetsConfig,
  sheetName: string
): Promise<boolean> {
  try {
    // Tenta ler a planilha
    await readSheetData(config, { sheetName, range: 'A1' });
    return true;
  } catch (error: any) {
    // Se não existir, cria
    if (error.message?.includes('Unable to parse range') || error.message?.includes('not found')) {
      // Obter access token
      const accessToken = config.accessToken || 
        (config.getAccessToken ? await config.getAccessToken() : await authenticateWithServiceAccount());
      
      try {
        const createResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}:batchUpdate`,
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

