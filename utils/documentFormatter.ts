/**
 * Utilitários para formatação de documentos (CPF, CNPJ, RG)
 */

/**
 * Remove caracteres não numéricos
 */
function onlyNumbers(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formata CPF (000.000.000-00)
 */
export function formatCPF(value: string): string {
  const numbers = onlyNumbers(value);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

/**
 * Formata CNPJ (00.000.000/0000-00)
 */
export function formatCNPJ(value: string): string {
  const numbers = onlyNumbers(value);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
}

/**
 * Formata RG (00.000.000-0)
 */
export function formatRG(value: string): string {
  const numbers = onlyNumbers(value);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}-${numbers.slice(8, 9)}`;
}

/**
 * Formata documento baseado no tipo
 */
export function formatDocument(value: string, tipo: DocumentType | undefined): string {
  if (!value || !tipo) return value;
  
  switch (tipo) {
    case DocumentType.CPF:
      return formatCPF(value);
    case DocumentType.CNPJ:
      return formatCNPJ(value);
    case DocumentType.RG:
      return formatRG(value);
    default:
      return value;
  }
}

/**
 * Valida tamanho máximo do documento baseado no tipo
 */
export function getMaxLength(tipo: DocumentType | undefined): number {
  switch (tipo) {
    case DocumentType.CPF:
      return 11; // 11 dígitos
    case DocumentType.CNPJ:
      return 14; // 14 dígitos
    case DocumentType.RG:
      return 9; // 9 dígitos
    default:
      return 20;
  }
}

