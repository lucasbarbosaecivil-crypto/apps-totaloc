/**
 * Serviço de Sincronização com Google Sheets
 * Gerencia a sincronização bidirecional de dados
 */

import {
  EquipmentModel,
  StockItem,
  Client,
  ServiceOrder,
  Retirada,
} from '../types';
import {
  SheetsConfig,
  readSheetData,
  writeSheetData,
  clearAndWriteSheet,
  ensureSheetExists,
} from './googleSheetsService';
import { authenticateWithServiceAccount, getServiceAccountConfig } from './serviceAccountAuth';
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
 */
export class SheetsSyncService {
  private config: SheetsConfig | null = null;
  private syncStatus: SyncStatus = {
    isSyncing: false,
    lastSync: null,
    error: null,
  };

  /**
   * Configura o serviço com credenciais
   * Se não fornecido, usa Service Account
   */
  setConfig(config?: SheetsConfig) {
    if (config) {
      this.config = config;
    } else {
      // Usa Service Account por padrão
      const saConfig = getServiceAccountConfig();
      this.config = {
        spreadsheetId: saConfig.spreadsheetId,
        getAccessToken: saConfig.getAccessToken,
      };
    }
  }

  /**
   * Verifica se está configurado
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Obtém status de sincronização
   */
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Garante que todas as planilhas necessárias existem
   */
  async ensureSheetsExist(): Promise<void> {
    if (!this.config) throw new Error('Serviço não configurado');

    await Promise.all([
      ensureSheetExists(this.config, 'EQUIPAMENTOS'),
      ensureSheetExists(this.config, 'CLIENTES'),
      ensureSheetExists(this.config, 'ORDENS_SERVICO'),
      ensureSheetExists(this.config, 'OS_ITENS'),
      ensureSheetExists(this.config, 'RETIRADAS'),
    ]);
  }

  // ==================== EQUIPAMENTOS ====================

  async loadEquipamentos(): Promise<EquipmentModel[]> {
    if (!this.config) throw new Error('Serviço não configurado');

    try {
      const rows = await readSheetData(this.config, { sheetName: 'EQUIPAMENTOS' });
      if (!rows || rows.length === 0) return [];

      const headers = rows[0];
      return rows.slice(1).map(row => rowToEquipamento(row, headers));
    } catch (error: any) {
      if (error.message?.includes('Unable to parse range')) {
        // Planilha vazia, retorna array vazio
        return [];
      }
      throw error;
    }
  }

  async saveEquipamentos(data: EquipmentModel[]): Promise<void> {
    if (!this.config) throw new Error('Serviço não configurado');

    this.syncStatus.isSyncing = true;
    try {
      await ensureSheetExists(this.config, 'EQUIPAMENTOS');
      const rows = data.map(equipamentoToRow);
      await clearAndWriteSheet(this.config, 'EQUIPAMENTOS', EQUIPAMENTOS_HEADERS, rows);
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

  async loadClientes(): Promise<Client[]> {
    if (!this.config) throw new Error('Serviço não configurado');

    try {
      const rows = await readSheetData(this.config, { sheetName: 'CLIENTES' });
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

  async saveClientes(data: Client[]): Promise<void> {
    if (!this.config) throw new Error('Serviço não configurado');

    this.syncStatus.isSyncing = true;
    try {
      await ensureSheetExists(this.config, 'CLIENTES');
      const rows = data.map(clienteToRow);
      await clearAndWriteSheet(this.config, 'CLIENTES', CLIENTES_HEADERS, rows);
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

  async loadOrdens(): Promise<ServiceOrder[]> {
    if (!this.config) throw new Error('Serviço não configurado');

    try {
      // Carrega ordens
      const ordemRows = await readSheetData(this.config, { sheetName: 'ORDENS_SERVICO' });
      if (!ordemRows || ordemRows.length === 0) return [];

      const ordemHeaders = ordemRows[0];
      const ordens = ordemRows.slice(1).map(row => rowToOrdem(row, ordemHeaders));

      // Carrega itens
      const itemRows = await readSheetData(this.config, { sheetName: 'OS_ITENS' });
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

  async saveOrdens(data: ServiceOrder[]): Promise<void> {
    if (!this.config) throw new Error('Serviço não configurado');

    this.syncStatus.isSyncing = true;
    try {
      await ensureSheetExists(this.config, 'ORDENS_SERVICO');
      await ensureSheetExists(this.config, 'OS_ITENS');

      // Salva ordens
      const ordemRows = data.map(ordemToRow);
      await clearAndWriteSheet(this.config, 'ORDENS_SERVICO', ORDENS_HEADERS, ordemRows);

      // Salva itens (normalizados)
      const itemRows: any[][] = [];
      data.forEach(os => {
        os.items.forEach(item => {
          itemRows.push(osItemToRow(os.id, item));
        });
      });
      await clearAndWriteSheet(this.config, 'OS_ITENS', OS_ITENS_HEADERS, itemRows);

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

  async loadRetiradas(): Promise<Retirada[]> {
    if (!this.config) throw new Error('Serviço não configurado');

    try {
      const rows = await readSheetData(this.config, { sheetName: 'RETIRADAS' });
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

  async saveRetiradas(data: Retirada[]): Promise<void> {
    if (!this.config) throw new Error('Serviço não configurado');

    this.syncStatus.isSyncing = true;
    try {
      await ensureSheetExists(this.config, 'RETIRADAS');
      const rows = data.map(retiradaToRow);
      await clearAndWriteSheet(this.config, 'RETIRADAS', RETIRADAS_HEADERS, rows);
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

  async syncAll(data: {
    catalogo: EquipmentModel[];
    stock: StockItem[];
    clients: Client[];
    orders: ServiceOrder[];
    retiradas: Retirada[];
  }): Promise<void> {
    await Promise.all([
      this.saveEquipamentos(data.catalogo),
      // Estoque não é mais salvo - é calculado dinamicamente baseado em equipamentos e locações
      // this.saveEstoque(data.stock),
      this.saveClientes(data.clients),
      this.saveOrdens(data.orders),
      this.saveRetiradas(data.retiradas),
    ]);
  }

  async loadAll(): Promise<{
    catalogo: EquipmentModel[];
    stock: StockItem[];
    clients: Client[];
    orders: ServiceOrder[];
    retiradas: Retirada[];
  }> {
    const [catalogo, clients, orders, retiradas] = await Promise.all([
      this.loadEquipamentos(),
      this.loadClientes(),
      this.loadOrdens(),
      this.loadRetiradas(),
    ]);

    // Estoque não é mais carregado do Sheets - é calculado dinamicamente
    return { catalogo, stock: [], clients, orders, retiradas };
  }
}

// Instância singleton
export const sheetsSyncService = new SheetsSyncService();

