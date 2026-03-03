// src/lib/validators.test.ts
import { describe, it, expect } from 'vitest';
import { validateCPF, formatCPF } from './validators';

describe('validateCPF', () => {
  it('valida CPF correto com máscara', () => {
    expect(validateCPF('529.982.247-25')).toBe(true);
  });

  it('valida CPF correto sem máscara', () => {
    expect(validateCPF('52998224725')).toBe(true);
  });

  it('rejeita sequência uniforme (00000000000)', () => {
    expect(validateCPF('000.000.000-00')).toBe(false);
    expect(validateCPF('00000000000')).toBe(false);
  });

  it('rejeita sequência uniforme (111...)', () => {
    expect(validateCPF('111.111.111-11')).toBe(false);
  });

  it('rejeita dígito verificador incorreto', () => {
    expect(validateCPF('529.982.247-26')).toBe(false);
  });

  it('rejeita CPF com menos de 11 dígitos', () => {
    expect(validateCPF('529.982.247')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(validateCPF('')).toBe(false);
  });
});

describe('formatCPF', () => {
  it('formata CPF de 11 dígitos', () => {
    expect(formatCPF('52998224725')).toBe('529.982.247-25');
  });

  it('aceita entrada parcial sem quebrar (3 dígitos)', () => {
    expect(formatCPF('529')).toBe('529');
  });

  it('aceita entrada parcial sem quebrar (5 dígitos)', () => {
    expect(formatCPF('52998')).toBe('529.98');
  });

  it('aceita entrada parcial sem quebrar (9 dígitos)', () => {
    expect(formatCPF('529982247')).toBe('529.982.247');
  });

  it('retorna string vazia para input vazio', () => {
    expect(formatCPF('')).toBe('');
  });
});
