
import React from 'react';

export const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
};

export const DB_BLUEPRINT = [
  {
    name: 'EQUIPAMENTOS',
    description: 'Cadastro principal de ativos para locação.',
    columns: [
      { name: 'ID_Equipamento', type: 'Text', key: true, formula: 'UNIQUEID()', obs: 'Chave Primária' },
      { name: 'Nome', type: 'Text', key: false, obs: 'Nome do equipamento' },
      { name: 'Descricao', type: 'Longtext', key: false, obs: 'Detalhes técnicos' },
      { name: 'Foto', type: 'Image', key: false, obs: 'Link/Arquivo de imagem' },
      { name: 'Num_Serie', type: 'Text', key: false, obs: 'Número de série físico' },
      { name: 'Valor_Diaria', type: 'Price', key: false, obs: 'Preço base por dia' }
    ]
  },
  {
    name: 'CLIENTES',
    description: 'Gestão de contatos e endereços de entrega.',
    columns: [
      { name: 'ID_Cliente', type: 'Text', key: true, formula: 'UNIQUEID()', obs: 'Chave Primária' },
      { name: 'Nome', type: 'Text', key: false, obs: 'Nome Completo / Razão Social' },
      { name: 'Telefone', type: 'Phone', key: false, obs: 'Contato principal' },
      { name: 'Email', type: 'Email', key: false, obs: 'Faturamento/Comunicação' },
      { name: 'Endereco', type: 'Address', key: false, obs: 'Local de entrega' }
    ]
  },
  {
    name: 'ORDENS_SERVICO',
    description: 'Movimentação de locações (Onde a mágica acontece).',
    columns: [
      { name: 'ID_OS', type: 'Text', key: true, formula: 'UNIQUEID()', obs: 'Chave Primária' },
      { name: 'ID_Cliente', type: 'Ref', ref: 'CLIENTES', obs: 'ForeignKey: Quem alugou' },
      { name: 'ID_Equipamento', type: 'Ref', ref: 'EQUIPAMENTOS', obs: 'ForeignKey: O que alugou' },
      { name: 'Data_Inicio', type: 'Date', key: false, obs: 'Início da locação' },
      { name: 'Data_Fim_Prevista', type: 'Date', key: false, obs: 'Retorno esperado' },
      { name: 'Data_Devolucao_Real', type: 'Date', key: false, obs: 'Data que voltou ao estoque' },
      { name: 'Status_OS', type: 'Enum', key: false, options: ['Ativo', 'Finalizado'], obs: 'Define se o item está locado' },
      { name: 'Valor_Total', type: 'Price', key: false, obs: 'Valor final do contrato' }
    ]
  },
  {
    name: 'DESPESAS',
    description: 'Controle financeiro de manutenção e operação.',
    columns: [
      { name: 'ID_Despesa', type: 'Text', key: true, formula: 'UNIQUEID()', obs: 'Chave Primária' },
      { name: 'Descricao', type: 'Text', key: false, obs: 'O que foi pago' },
      { name: 'Valor', type: 'Price', key: false, obs: 'Custo da operação' },
      { name: 'Data', type: 'Date', key: false, obs: 'Data do pagamento' },
      { name: 'Categoria', type: 'Enum', options: ['Manutenção', 'Combustível', 'Impostos', 'Outros'], obs: 'Classificação' }
    ]
  }
];
