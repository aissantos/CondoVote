import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from './FormField';
import React from 'react';

const meta: Meta<typeof FormField> = {
  component: FormField,
  title: 'UI/FormField',
  tags: ['autodocs'],
};
export default meta;

export const Default: StoryObj = {
  args: {
    label: 'Nome Completo',
    required: true,
    children: (a11y: any) => <input {...a11y} type="text" placeholder="Digite seu nome" className="border p-2 rounded w-full" />,
  },
};

export const WithError: StoryObj = {
  args: {
    label: 'CPF',
    error: 'CPF inválido. Verifique o número digitado.',
    required: true,
    children: (a11y: any) => <input {...a11y} type="text" value="123.456.789-00" readOnly className="border-red-500 border p-2 rounded w-full bg-red-50" />,
  },
};

export const WithHint: StoryObj = {
  args: {
    label: 'Senha',
    hint: 'Mínimo 8 caracteres, com letras e números.',
    children: (a11y: any) => <input {...a11y} type="password" placeholder="********" className="border p-2 rounded w-full" />,
  },
};
