// src/lib/validators.ts

/**
 * Valida CPF brasileiro incluindo os dois dígitos verificadores.
 * Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11).
 *
 * @param cpf - CPF com ou sem formatação
 * @returns true se válido, false caso contrário
 *
 * @example
 *   validateCPF('529.982.247-25') // true
 *   validateCPF('111.111.111-11') // false
 */
export function validateCPF(cpf: string): boolean {
  // Remove máscara
  const digits = cpf.replace(/\D/g, '');

  // Deve ter exatamente 11 dígitos
  if (digits.length !== 11) return false;

  // Rejeitar sequências uniformes (CPFs conhecidamente inválidos)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Calcular primeiro dígito verificador
  const sum1 = digits
    .slice(0, 9)
    .split('')
    .reduce((acc, d, i) => acc + Number(d) * (10 - i), 0);
  const rem1 = (sum1 * 10) % 11;
  const check1 = rem1 === 10 || rem1 === 11 ? 0 : rem1;

  if (check1 !== Number(digits[9])) return false;

  // Calcular segundo dígito verificador
  const sum2 = digits
    .slice(0, 10)
    .split('')
    .reduce((acc, d, i) => acc + Number(d) * (11 - i), 0);
  const rem2 = (sum2 * 10) % 11;
  const check2 = rem2 === 10 || rem2 === 11 ? 0 : rem2;

  return check2 === Number(digits[10]);
}

/**
 * Formata um CPF numérico para o formato XXX.XXX.XXX-XX
 */
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}
