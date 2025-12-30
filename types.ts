
export enum EquipmentStatus {
  DISPONIVEL = 'Disponível',
  LOCADO = 'Locado',
  MANUTENCAO = 'Manutenção'
}

export enum OSStatus {
  ATIVO = 'Ativo',
  FINALIZADO = 'Finalizado',
  CANCELADO = 'Cancelado'
}

export enum RentalUnit {
  DIARIA = 'Diária',
  MES = 'Mês'
}

export interface EquipmentModel {
  id: string;
  nome: string;
  descricao: string;
  valorUnitario: number;
  unidade: RentalUnit;
  foto?: string;
  numSerie?: string;
  quantidade?: number; // Quantidade disponível (opcional, só para equipamentos pequenos sem controle por ID)
}

export interface StockItem {
  id: string; 
  modelId: string;
  foto: string;
}

export enum DocumentType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  RG = 'RG'
}

export interface Client {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  endereco?: string; // Mantido para compatibilidade com dados antigos
  rua?: string;
  numero?: string;
  cidade?: string;
  tipoDocumento?: DocumentType;
  documento?: string;
}

export interface OSItem {
  stockItemId?: string; // ID específico do item (quando controle por ID)
  equipmentModelId?: string; // ID do modelo (quando locação por quantidade)
  quantidade?: number; // Quantidade locada (quando não controle por ID)
  valorNoContrato: number;
  unidade?: RentalUnit; // Unidade de locação (Diária ou Mês)
  dataInicio: string;
  dataFimPrevista: string;
  dataDevolucaoReal?: string;
}

export interface ServiceOrder {
  id: string;
  clientId: string;
  items: OSItem[]; 
  descontoManual: number;
  status: OSStatus;
  valorTotalPrevisto: number;
  valorTotalReal?: number;
  dataConclusao?: string; // Data de conclusão da ordem
  observacao?: string; // Observações sobre a locação
}

export enum AgrupadorDespesa {
  MANUTENCAO = 'Manutenção',
  ALUGUEL = 'Aluguel',
  ENERGIA = 'Energia',
  AGUA = 'Água',
  COMBUSTIVEL = 'Combustível',
  VEICULO = 'Veículo',
  OUTROS = 'Outros'
}

export interface Despesa {
  id: string;
  data: string; // Data da despesa (formato YYYY-MM-DD)
  agrupador: string; // Categoria/agrupador da despesa
  descricao: string; // Descrição da despesa
  valor: number; // Valor da despesa
}

export interface Retirada {
  id: string;
  dataRetirada: string; // Data da retirada (formato YYYY-MM-DD)
  socioRetirada: string; // Nome do sócio que fez a retirada
  valor: number; // Valor da retirada
}

export interface User {
  id: string;
  nome: string;
  senha: string; // Senha padrão: totalloc2025
}

export type TabType = 'dashboard' | 'catalogo' | 'estoque' | 'clientes' | 'locacoes' | 'historico' | 'despesas' | 'retiradas' | 'ai-assistant';
