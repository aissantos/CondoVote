import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormField } from './FormField';
import React from 'react';

type FormFieldProps = React.ComponentProps<typeof FormField>;

const meta: Meta<FormFieldProps> = {
  component: FormField,
  title: 'UI/FormField',
  tags: ['autodocs'],
};
export default meta;

export const Default: StoryObj<FormFieldProps> = {
  args: {
    label: 'Nome Completo',
    required: true,
    children: (a11y: Record<string, unknown>) => <input {...a11y} type="text" placeholder="Digite seu nome" className="border p-2 rounded w-full" />,
  },
};

export const WithError: StoryObj<FormFieldProps> = {
  args: {
    label: 'CPF',
    error: 'CPF inválido. Verifique o número digitado.',
    required: true,
    children: (a11y: Record<string, unknown>) => <input {...a11y} type="text" value="123.456.789-00" readOnly className="border-red-500 border p-2 rounded w-full bg-red-50" />,
  },
};

export const WithHint: StoryObj<FormFieldProps> = {
  args: {
    label: 'Senha',
    hint: 'Mínimo 8 caracteres, com letras e números.',
    children: (a11y: Record<string, unknown>) => <input {...a11y} type="password" placeholder="********" className="border p-2 rounded w-full" />,
  },
};
