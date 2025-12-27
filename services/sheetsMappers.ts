/**
 * Mappers para converter dados entre App State e Google Sheets
 */

import {
  EquipmentModel,
  StockItem,
  Client,
  ServiceOrder,
  OSItem,
  RentalUnit,
  OSStatus,
  DocumentType,
  Retirada,
  Despesa,
} from '../types';

// ==================== EQUIPAMENTOS (Catálogo) ====================

export const EQUIPAMENTOS_HEADERS = [
  'ID_Equipamento',
  'Nome',
  'Descricao',
  'Foto',
  'Num_Serie',
  'Valor_Diaria',
  'Unidade',
  'Quantidade',
];

export function equipamentoToRow(model: EquipmentModel): any[] {
  // Garantir que valorUnitario seja sempre um número válido (0 se undefined/null)
  const valorUnitario = (model.valorUnitario !== undefined && model.valorUnitario !== null) 
    ? Number(model.valorUnitario) 
    : 0;
  
  // Garantir que quantidade seja number ou vazio (string vazia se undefined/null)
  const quantidade = (model.quantidade !== undefined && model.quantidade !== null)
    ? Number(model.quantidade)
    : '';
  
  return [
    model.id,
    model.nome,
    model.descricao || '',
    model.foto || '',
    model.numSerie || '',
    valorUnitario, // Sempre será um número válido
    model.unidade || 'Diária',
    quantidade, // Number ou string vazia
  ];
}

export function rowToEquipamento(row: any[], headers: string[]): EquipmentModel {
  // Função helper que busca coluna de forma case-insensitive e ignora espaços
  const getCol = (colName: string) => {
    // Primeiro tenta match exato
    let idx = headers.indexOf(colName);
    if (idx >= 0) {
      return row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : '';
    }
    
    // Se não encontrou, tenta case-insensitive
    idx = headers.findIndex(h => 
      h && (h.toString().trim().toLowerCase() === colName.toLowerCase() ||
           h.toString().trim() === colName)
    );
    if (idx >= 0) {
      return row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : '';
    }
    
    return '';
  };

  // Tenta encontrar Valor_Diaria ou Valor_Unitario (compatibilidade)
  const valorStr = getCol('Valor_Diaria') || getCol('Valor_Unitario') || '0';
  const valor = parseFloat(valorStr.replace(',', '.')) || 0;
  
  const quantidadeStr = getCol('Quantidade');
  const quantidade = quantidadeStr ? parseFloat(quantidadeStr.replace(',', '.')) : undefined;
  
  const unidadeStr = getCol('Unidade') || 'Diária';
  const unidade = unidadeStr.toLowerCase().includes('mês') || unidadeStr.toLowerCase().includes('mes') 
    ? RentalUnit.MES 
    : RentalUnit.DIARIA;

  const id = getCol('ID_Equipamento');
  const nome = getCol('Nome');
  
  if (!id || !nome) {
    throw new Error(`Linha inválida: ID ou Nome está vazio. ID: "${id}", Nome: "${nome}"`);
  }

  return {
    id: id,
    nome: nome,
    descricao: getCol('Descricao') || '',
    valorUnitario: valor,
    unidade: unidade,
    foto: getCol('Foto') || undefined,
    numSerie: getCol('Num_Serie') || undefined,
    quantidade: quantidade,
  };
}

// ==================== ESTOQUE ====================

export const ESTOQUE_HEADERS = [
  'ID_Item',
  'ID_Equipamento',
  'Num_Serie',
  'Foto',
];

export function estoqueToRow(item: StockItem): any[] {
  return [
    item.id,
    item.modelId,
    item.id, // Num_Serie é o mesmo que ID
    item.foto || '',
  ];
}

export function rowToEstoque(row: any[], headers: string[]): StockItem {
  const getCol = (colName: string) => {
    const idx = headers.indexOf(colName);
    return idx >= 0 ? row[idx] : '';
  };

  return {
    id: getCol('ID_Item') || getCol('Num_Serie') || '',
    modelId: getCol('ID_Equipamento') || '',
    foto: getCol('Foto') || '',
  };
}

// ==================== CLIENTES ====================

export const CLIENTES_HEADERS = [
  'ID_Cliente',
  'Nome',
  'Telefone',
  'Email',
  'Rua',
  'Numero',
  'Cidade',
  'Tipo_Documento',
  'Documento',
];

export function clienteToRow(client: Client): any[] {
  return [
    client.id,
    client.nome,
    client.telefone || '',
    client.email || '',
    client.rua || '',
    client.numero || '',
    client.cidade || '',
    client.tipoDocumento || '',
    client.documento || '',
  ];
}

export function rowToCliente(row: any[], headers: string[]): Client {
  const getCol = (colName: string) => {
    const idx = headers.indexOf(colName);
    return idx >= 0 ? (row[idx] || '') : '';
  };

  // Compatibilidade com dados antigos (endereco como string única)
  const enderecoAntigo = getCol('Endereco');
  let rua = getCol('Rua');
  let numero = getCol('Numero');
  let cidade = getCol('Cidade');

  // Se não tiver campos separados mas tiver endereco antigo, tenta parsear
  if (!rua && !numero && !cidade && enderecoAntigo) {
    // Tenta separar formato comum: "Rua, 123 - Cidade"
    const partes = enderecoAntigo.split(' - ');
    if (partes.length === 2) {
      cidade = partes[1];
      const ruaNumero = partes[0].split(', ');
      if (ruaNumero.length === 2) {
        rua = ruaNumero[0];
        numero = ruaNumero[1];
      } else {
        rua = partes[0];
      }
    } else {
      rua = enderecoAntigo;
    }
  }

  return {
    id: getCol('ID_Cliente') || '',
    nome: getCol('Nome') || '',
    telefone: getCol('Telefone') || '',
    email: getCol('Email') || '',
    rua: rua || undefined,
    numero: numero || undefined,
    cidade: cidade || undefined,
    endereco: enderecoAntigo || undefined, // Mantém para compatibilidade
    tipoDocumento: getCol('Tipo_Documento') as DocumentType | undefined,
    documento: getCol('Documento') || undefined,
  };
}

// ==================== ORDENS DE SERVIÇO ====================

export const ORDENS_HEADERS = [
  'ID_OS',
  'ID_Cliente',
  'Status_OS',
  'Desconto_Manual',
  'Valor_Total_Previsto',
  'Valor_Total_Real',
  'Data_Criacao',
];

export function ordemToRow(os: ServiceOrder): any[] {
  // Garantir que valores numéricos sejam sempre números válidos
  const descontoManual = (os.descontoManual !== undefined && os.descontoManual !== null)
    ? Number(os.descontoManual)
    : 0;
  
  const valorTotalPrevisto = (os.valorTotalPrevisto !== undefined && os.valorTotalPrevisto !== null)
    ? Number(os.valorTotalPrevisto)
    : 0;
  
  // valorTotalReal pode ser undefined (string vazia se não definido)
  const valorTotalReal = (os.valorTotalReal !== undefined && os.valorTotalReal !== null)
    ? Number(os.valorTotalReal)
    : '';
  
  return [
    os.id,
    os.clientId,
    os.status,
    descontoManual, // Sempre será um número válido
    valorTotalPrevisto, // Sempre será um número válido
    valorTotalReal, // Number ou string vazia
    new Date().toISOString().split('T')[0],
  ];
}

export function rowToOrdem(row: any[], headers: string[]): ServiceOrder {
  const getCol = (colName: string) => {
    const idx = headers.indexOf(colName);
    return idx >= 0 ? row[idx] : '';
  };

  return {
    id: getCol('ID_OS') || '',
    clientId: getCol('ID_Cliente') || '',
    status: (getCol('Status_OS') as OSStatus) || OSStatus.ATIVO,
    descontoManual: parseFloat(getCol('Desconto_Manual')) || 0,
    valorTotalPrevisto: parseFloat(getCol('Valor_Total_Previsto')) || 0,
    valorTotalReal: getCol('Valor_Total_Real') 
      ? parseFloat(getCol('Valor_Total_Real')) 
      : undefined,
    items: [], // Será preenchido pela tabela OS_ITENS
  };
}

// ==================== OS ITENS (Normalizado) ====================

export const OS_ITENS_HEADERS = [
  'ID_OS',
  'ID_Item_Estoque',
  'ID_Equipamento',
  'Quantidade',
  'Valor_No_Contrato',
  'Data_Inicio',
  'Data_Fim_Prevista',
  'Data_Devolucao_Real',
];

export function osItemToRow(osId: string, item: OSItem): any[] {
  // Garantir que quantidade seja number ou string vazia
  const quantidade = (item.quantidade !== undefined && item.quantidade !== null)
    ? Number(item.quantidade)
    : '';
  
  // Garantir que valorNoContrato seja sempre um número válido
  const valorNoContrato = (item.valorNoContrato !== undefined && item.valorNoContrato !== null)
    ? Number(item.valorNoContrato)
    : 0;
  
  return [
    osId,
    item.stockItemId || '', // ID específico do item (se houver)
    item.equipmentModelId || '', // ID do modelo (se locação por quantidade)
    quantidade, // Number ou string vazia
    valorNoContrato, // Sempre será um número válido
    item.dataInicio,
    item.dataFimPrevista,
    item.dataDevolucaoReal || '',
  ];
}

export function rowToOSItem(row: any[], headers: string[]): { osId: string; item: OSItem } {
  const getCol = (colName: string) => {
    const idx = headers.indexOf(colName);
    return idx >= 0 ? row[idx] : '';
  };

  const stockItemId = getCol('ID_Item_Estoque') || undefined;
  const equipmentModelId = getCol('ID_Equipamento') || undefined;
  const quantidade = getCol('Quantidade') ? parseFloat(getCol('Quantidade')) : undefined;

  return {
    osId: getCol('ID_OS') || '',
    item: {
      stockItemId: stockItemId,
      equipmentModelId: equipmentModelId,
      quantidade: quantidade,
      valorNoContrato: parseFloat(getCol('Valor_No_Contrato')) || 0,
      dataInicio: getCol('Data_Inicio') || '',
      dataFimPrevista: getCol('Data_Fim_Prevista') || '',
      dataDevolucaoReal: getCol('Data_Devolucao_Real') || undefined,
    },
  };
}

// ==================== RETIRADAS ====================

export const RETIRADAS_HEADERS = [
  'ID_Retirada',
  'Data_Retirada',
  'Socio_Retirada',
  'Valor',
];

export function retiradaToRow(r: Retirada): any[] {
  // Garantir que valor seja sempre um número válido (0 se undefined/null)
  const valor = (r.valor !== undefined && r.valor !== null)
    ? Number(r.valor)
    : 0;
  
  return [
    r.id,
    r.dataRetirada,
    r.socioRetirada,
    valor, // Sempre será um número válido
  ];
}

export function rowToRetirada(row: any[], headers: string[]): Retirada {
  const getCol = (colName: string) => {
    const idx = headers.indexOf(colName);
    return idx >= 0 ? row[idx] : '';
  };

  return {
    id: getCol('ID_Retirada') || '',
    dataRetirada: getCol('Data_Retirada') || '',
    socioRetirada: getCol('Socio_Retirada') || '',
    valor: parseFloat(getCol('Valor')) || 0,
  };
}

// ==================== DESPESAS ====================

export const DESPESAS_HEADERS = [
  'ID_Despesa',
  'Data',
  'Agrupador',
  'Descricao',
  'Valor',
];

export function despesaToRow(d: Despesa): any[] {
  // Garantir que valor seja sempre um número válido (0 se undefined/null)
  const valor = (d.valor !== undefined && d.valor !== null)
    ? Number(d.valor)
    : 0;
  
  return [
    d.id,
    d.data,
    d.agrupador,
    d.descricao,
    valor, // Sempre será um número válido
  ];
}

export function rowToDespesa(row: any[], headers: string[]): Despesa {
  const getCol = (colName: string) => {
    const idx = headers.indexOf(colName);
    return idx >= 0 ? row[idx] : '';
  };

  return {
    id: getCol('ID_Despesa') || '',
    data: getCol('Data') || '',
    agrupador: getCol('Agrupador') || '',
    descricao: getCol('Descricao') || '',
    valor: parseFloat(getCol('Valor')) || 0,
  };
}
