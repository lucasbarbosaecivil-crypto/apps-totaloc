/**
 * Serviço de Sincronização com Google Sheets
 * Gerencia a sincronização bidirecional de dados
 * Agora usa OAuth 2.0 (token do usuário) ao invés de Service Account
 */

import {
  EquipmentModel,
  StockItem,
  Client,
  ServiceOrder,
  Retirada,
} from '../types';
import {
  readSheetData,
  writeSheetData,
  clearAndWriteSheet,
  ensureSheetExists,
} from './googleSheetsService';
import {
  // Equipamentos
  EQUIPAMENTOS_HEADERS,
  equipamentoToRow,
  rowToEquipamento,
  // Clientes
  CLIENTES_HEADERS,
  clienteToRow,
  rowToCliente,
  // Ordens
  ORDENS_HEADERS,
  ordemToRow,
  rowToOrdem,
  // OS Itens
  OS_ITENS_HEADERS,
  osItemToRow,
  rowToOSItem,
  // Retiradas
  RETIRADAS_HEADERS,
  retiradaToRow,
  rowToRetirada,
} from './sheetsMappers';

export interface SyncStatus {
  isSyncing: boolean;
  lastSync: Date | null;
  error: string | null;
}

/**
 * Classe principal de sincronização
 * Agora requer accessToken e spreadsheetId em cada chamada (OAuth 2.0)
 */
export class SheetsSyncService {
  private syncStatus: SyncStatus = {
    isSyncing: false,
    lastSync: null,
    error: null,
  };

  /**
   * Obtém status de sincronização
   */
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Garante que todas as planilhas necessárias existem
   */
  async ensureSheetsExist(accessToken: string, spreadsheetId: string): Promise<void> {
    await Promise.all([
      ensureSheetExists(accessToken, spreadsheetId, 'EQUIPAMENTOS'),
      ensureSheetExists(accessToken, spreadsheetId, 'CLIENTES'),
      ensureSheetExists(accessToken, spreadsheetId, 'ORDENS_SERVICO'),
      ensureSheetExists(accessToken, spreadsheetId, 'OS_ITENS'),
      ensureSheetExists(accessToken, spreadsheetId, 'RETIRADAS'),
    ]);
  }

  // ==================== EQUIPAMENTOS ====================

  async loadEquipamentos(accessToken: string, spreadsheetId: string): Promise<EquipmentModel[]> {
    // Tenta diferentes variações do nome da aba (case-insensitive)
    const possibleSheetNames = ['EQUIPAMENTOS', 'Equipamentos', 'equipamentos', 'EQUIPAMENTOS ', ' Equipamentos'];
    
    for (const sheetName of possibleSheetNames) {
      try {
        console.log(`📥 Tentando carregar equipamentos da aba "${sheetName}"...`);
        const rows = await readSheetData(accessToken, spreadsheetId, { sheetName: sheetName.trim() });
        console.log(`📊 Linhas lidas: ${rows?.length || 0}`);
        
        if (!rows || rows.length === 0) {
          console.log(`⚠️ Aba "${sheetName}" está vazia, tentando próximo nome...`);
          continue;
        }

        const headers = rows[0];
        console.log('📋 Cabeçalhos encontrados:', headers);
        
        // Verifica se encontrou pelo menos um cabeçalho esperado
        const expectedHeaders = ['ID_Equipamento', 'Nome', 'Valor_Diaria'];
        const hasExpectedHeader = expectedHeaders.some(expected => 
          headers.some(h => h && (h.toString().trim() === expected || h.toString().trim().toLowerCase() === expected.toLowerCase()))
        );
        
        if (!hasExpectedHeader) {
          console.log(`⚠️ Cabeçalhos não correspondem ao esperado na aba "${sheetName}", tentando próximo...`);
          continue;
        }
        
        const dataRows = rows.slice(1);
        console.log(`📦 Linhas de dados: ${dataRows.length}`);
        
        if (dataRows.length === 0) {
          console.log(`⚠️ Nenhuma linha de dados encontrada na aba "${sheetName}"`);
          return [];
        }
        
        const equipamentos = dataRows.map((row, index) => {
          try {
            const equipamento = rowToEquipamento(row, headers);
            // Validação básica: deve ter ID e Nome
            if (!equipamento.id || !equipamento.nome) {
              console.warn(`⚠️ Linha ${index + 2} ignorada: falta ID ou Nome`, row);
              return null;
            }
            return equipamento;
          } catch (err: any) {
            console.error(`❌ Erro ao converter linha ${index + 2}:`, err.message, 'Linha:', row);
            return null;
          }
        }).filter((eq): eq is EquipmentModel => eq !== null);
        
        console.log(`✅ ${equipamentos.length} equipamentos carregados com sucesso da aba "${sheetName}"`);
        return equipamentos;
      } catch (error: any) {
        // Se for erro de "não encontrado", tenta próximo nome
        if (error.message?.includes('Unable to parse range') || 
            error.message?.includes('not found') ||
            error.message?.includes('400')) {
          console.log(`⚠️ Aba "${sheetName}" não encontrada, tentando próximo nome...`);
          continue;
        }
        // Se for outro erro, loga e tenta próximo
        console.error(`❌ Erro ao carregar da aba "${sheetName}":`, error.message);
        continue;
      }
    }
    
    // Se chegou aqui, nenhuma variação funcionou
    console.error('❌ Não foi possível carregar equipamentos de nenhuma aba. Verifique:');
    console.error('   1. Se a aba existe na planilha');
    console.error('   2. Se o nome da aba está correto (pode ser "EQUIPAMENTOS", "Equipamentos", etc.)');
    console.error('   3. Se há dados na aba');
    return [];
  }

  async saveEquipamentos(accessToken: string, spreadsheetId: string, data: EquipmentModel[]): Promise<void> {
    this.syncStatus.isSyncing = true;
    try {
      // 🛡️ PROTEÇÃO: Verifica se há dados antes de salvar
      if (!data || data.length === 0) {
        console.warn('⚠️ Tentativa de salvar equipamentos vazios. Operação cancelada.');
        return;
      }

      await ensureSheetExists(accessToken, spreadsheetId, 'EQUIPAMENTOS');
      const rows = data.map(equipamentoToRow);
      
      // Debug: Log dos dados sendo salvos (primeiros 3 equipamentos)
      console.log('💾 Salvando equipamentos na planilha:');
      console.log('📋 Headers:', EQUIPAMENTOS_HEADERS);
      if (rows.length > 0) {
        console.log('📦 Primeira linha de dados:', rows[0]);
        console.log('💰 Valor_Diaria (posição 5):', rows[0][5], 'Tipo:', typeof rows[0][5]);
      }
      
      await clearAndWriteSheet(accessToken, spreadsheetId, 'EQUIPAMENTOS', EQUIPAMENTOS_HEADERS, rows);
      console.log(`✅ ${data.length} equipamentos salvos com sucesso na planilha`);
      this.syncStatus.lastSync = new Date();
      this.syncStatus.error = null;
    } catch (error: any) {
      this.syncStatus.error = error.message;
      throw error;
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  // ==================== CLIENTES ====================

  async loadClientes(accessToken: string, spreadsheetId: string): Promise<Client[]> {
    try {
      const rows = await readSheetData(accessToken, spreadsheetId, { sheetName: 'CLIENTES' });
      if (!rows || rows.length === 0) return [];

      const headers = rows[0];
      return rows.slice(1).map(row => rowToCliente(row, headers));
    } catch (error: any) {
      if (error.message?.includes('Unable to parse range')) {
        return [];
      }
      throw error;
    }
  }

  async saveClientes(accessToken: string, spreadsheetId: string, data: Client[]): Promise<void> {
    this.syncStatus.isSyncing = true;
    try {
      // 🛡️ PROTEÇÃO: Verifica se há dados antes de salvar
      if (!data || data.length === 0) {
        console.warn('⚠️ Tentativa de salvar clientes vazios. Operação cancelada.');
        return;
      }

      await ensureSheetExists(accessToken, spreadsheetId, 'CLIENTES');
      const rows = data.map(clienteToRow);
      await clearAndWriteSheet(accessToken, spreadsheetId, 'CLIENTES', CLIENTES_HEADERS, rows);
      this.syncStatus.lastSync = new Date();
      this.syncStatus.error = null;
    } catch (error: any) {
      this.syncStatus.error = error.message;
      throw error;
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  // ==================== ORDENS DE SERVIÇO ====================

  async loadOrdens(accessToken: string, spreadsheetId: string): Promise<ServiceOrder[]> {
    try {
      // Carrega ordens
      const ordemRows = await readSheetData(accessToken, spreadsheetId, { sheetName: 'ORDENS_SERVICO' });
      if (!ordemRows || ordemRows.length === 0) return [];

      const ordemHeaders = ordemRows[0];
      const ordens = ordemRows.slice(1).map(row => rowToOrdem(row, ordemHeaders));

      // Carrega itens
      const itemRows = await readSheetData(accessToken, spreadsheetId, { sheetName: 'OS_ITENS' });
      if (itemRows && itemRows.length > 0) {
        const itemHeaders = itemRows[0];
        const items = itemRows.slice(1).map(row => rowToOSItem(row, itemHeaders));

        // Agrupa itens por OS
        ordens.forEach(os => {
          os.items = items
            .filter(i => i.osId === os.id)
            .map(i => i.item);
        });
      }

      return ordens;
    } catch (error: any) {
      if (error.message?.includes('Unable to parse range')) {
        return [];
      }
      throw error;
    }
  }

  async saveOrdens(accessToken: string, spreadsheetId: string, data: ServiceOrder[]): Promise<void> {
    this.syncStatus.isSyncing = true;
    try {
      // 🛡️ PROTEÇÃO: Verifica se há ordens antes de salvar
      if (!data || data.length === 0) {
        console.warn('⚠️ Tentativa de salvar ordens vazias. Operação cancelada.');
        return;
      }

      await ensureSheetExists(accessToken, spreadsheetId, 'ORDENS_SERVICO');
      await ensureSheetExists(accessToken, spreadsheetId, 'OS_ITENS');

      // Salva ordens
      const ordemRows = data.map(ordemToRow);
      await clearAndWriteSheet(accessToken, spreadsheetId, 'ORDENS_SERVICO', ORDENS_HEADERS, ordemRows);

      // Salva itens (normalizados)
      // Nota: OS_ITENS pode estar vazio se as ordens não tiverem itens, então não salvamos se vazio
      const itemRows: any[][] = [];
      data.forEach(os => {
        if (os.items && os.items.length > 0) {
          os.items.forEach(item => {
            itemRows.push(osItemToRow(os.id, item));
          });
        }
      });
      
      // Só salva OS_ITENS se houver itens
      if (itemRows.length > 0) {
        await clearAndWriteSheet(accessToken, spreadsheetId, 'OS_ITENS', OS_ITENS_HEADERS, itemRows);
      } else {
        console.log('ℹ️ Nenhum item de OS para salvar (OS_ITENS vazio, mas ordens foram salvas)');
      }

      this.syncStatus.lastSync = new Date();
      this.syncStatus.error = null;
    } catch (error: any) {
      this.syncStatus.error = error.message;
      throw error;
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  // ==================== RETIRADAS ====================

  async loadRetiradas(accessToken: string, spreadsheetId: string): Promise<Retirada[]> {
    try {
      const rows = await readSheetData(accessToken, spreadsheetId, { sheetName: 'RETIRADAS' });
      if (!rows || rows.length === 0) return [];

      const headers = rows[0];
      return rows.slice(1).map(row => rowToRetirada(row, headers));
    } catch (error: any) {
      if (error.message?.includes('Unable to parse range')) {
        // Planilha vazia
        return [];
      }
      throw error;
    }
  }

  async saveRetiradas(accessToken: string, spreadsheetId: string, data: Retirada[]): Promise<void> {
    this.syncStatus.isSyncing = true;
    try {
      // 🛡️ PROTEÇÃO: Verifica se há dados antes de salvar
      if (!data || data.length === 0) {
        console.warn('⚠️ Tentativa de salvar retiradas vazias. Operação cancelada.');
        return;
      }

      await ensureSheetExists(accessToken, spreadsheetId, 'RETIRADAS');
      const rows = data.map(retiradaToRow);
      await clearAndWriteSheet(accessToken, spreadsheetId, 'RETIRADAS', RETIRADAS_HEADERS, rows);
      this.syncStatus.lastSync = new Date();
      this.syncStatus.error = null;
    } catch (error: any) {
      this.syncStatus.error = error.message;
      throw error;
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  // ==================== SINCRONIZAÇÃO COMPLETA ====================

  async syncAll(
    accessToken: string,
    spreadsheetId: string,
    data: {
      catalogo: EquipmentModel[];
      stock: StockItem[];
      clients: Client[];
      orders: ServiceOrder[];
      retiradas: Retirada[];
    }
  ): Promise<void> {
    // 🛡️ PROTEÇÃO CRÍTICA: Verifica se há dados antes de sincronizar
    // Isso previne que arrays vazios apaguem dados existentes na planilha
    // Só bloqueia se TODOS os arrays estiverem vazios
    const hasAnyData = 
      (data.catalogo && data.catalogo.length > 0) ||
      (data.clients && data.clients.length > 0) ||
      (data.orders && data.orders.length > 0) ||
      (data.retiradas && data.retiradas.length > 0);

    if (!hasAnyData) {
      const errorMsg = '🚨 BLOQUEADO: Tentativa de sincronizar dados vazios. Isso apagaria todos os dados da planilha. Carregue os dados primeiro!';
      console.error(errorMsg);
      console.error('Estado atual:', {
        catalogo: data.catalogo?.length || 0,
        clients: data.clients?.length || 0,
        orders: data.orders?.length || 0,
        retiradas: data.retiradas?.length || 0,
      });
      throw new Error(errorMsg);
    }

    console.log('🔄 Iniciando sincronização com dados:', {
      equipamentos: data.catalogo?.length || 0,
      clientes: data.clients?.length || 0,
      ordens: data.orders?.length || 0,
      retiradas: data.retiradas?.length || 0,
    });

    // Salva cada categoria, mas as funções save* individuais vão ignorar silenciosamente se estiverem vazias
    // Isso permite que algumas categorias possam estar vazias enquanto outras têm dados
    const promises: Promise<void>[] = [];
    
    if (data.catalogo && data.catalogo.length > 0) {
      promises.push(this.saveEquipamentos(accessToken, spreadsheetId, data.catalogo));
    }
    
    // Estoque não é mais salvo - é calculado dinamicamente baseado em equipamentos e locações
    
    if (data.clients && data.clients.length > 0) {
      promises.push(this.saveClientes(accessToken, spreadsheetId, data.clients));
    }
    
    if (data.orders && data.orders.length > 0) {
      promises.push(this.saveOrdens(accessToken, spreadsheetId, data.orders));
    }
    
    if (data.retiradas && data.retiradas.length > 0) {
      promises.push(this.saveRetiradas(accessToken, spreadsheetId, data.retiradas));
    }

    await Promise.all(promises);
  }

  async loadAll(accessToken: string, spreadsheetId: string): Promise<{
    catalogo: EquipmentModel[];
    stock: StockItem[];
    clients: Client[];
    orders: ServiceOrder[];
    retiradas: Retirada[];
  }> {
    const [catalogo, clients, orders, retiradas] = await Promise.all([
      this.loadEquipamentos(accessToken, spreadsheetId),
      this.loadClientes(accessToken, spreadsheetId),
      this.loadOrdens(accessToken, spreadsheetId),
      this.loadRetiradas(accessToken, spreadsheetId),
    ]);

    // Estoque não é mais carregado do Sheets - é calculado dinamicamente
    return { catalogo, stock: [], clients, orders, retiradas };
  }
}

// Instância singleton
export const sheetsSyncService = new SheetsSyncService();
