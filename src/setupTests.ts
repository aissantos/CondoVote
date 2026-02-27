import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Realiza a limpeza da árvore do React a cada fim de teste para evitar vazamentos de estado
afterEach(() => {
  cleanup();
});
