import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormField } from './FormField';
import React from 'react';

describe('FormField UI Snapshots', () => {
  it('renderiza FormField com erro corretamente (snapshot)', () => {
    const { asFragment } = render(
      <FormField label="CPF" error="CPF inválido" required>
        {(a11y) => <input {...a11y} type="text" />}
      </FormField>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('renderiza FormField com hint corretamente (snapshot)', () => {
    const { asFragment } = render(
      <FormField label="Senha" hint="Mínimo de 8 caracteres">
        {(a11y) => <input {...a11y} type="password" />}
      </FormField>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
