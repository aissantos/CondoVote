// P2.3 — Hook de paginação server-side genérico usando Supabase .range()
// Evita carregar toda a tabela para paginar no client.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  refresh: () => void;
}

/**
 * usePaginatedQuery — busca paginada server-side de qualquer tabela Supabase.
 *
 * @param table     Nome da tabela
 * @param filters   Filtros de igualdade simples { coluna: valor | undefined }
 * @param pageSize  Itens por página (default = 10)
 * @param orderBy   { column, ascending } para ordenação (default = created_at desc)
 */
export function usePaginatedQuery<T>(
  table: string,
  filters: Record<string, string | undefined>,
  pageSize = 10,
  orderBy: { column: string; ascending: boolean } = { column: 'created_at', ascending: false }
): PaginatedResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Serializar filtros para detectar mudanças
  const filtersKey = JSON.stringify(filters);

  const fetchPage = useCallback(async (currentPage: number) => {
    setLoading(true);
    setError(null);

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
       
      // @ts-ignore
      .from(table)
      .select('*', { count: 'exact' })
      .range(from, to)
      .order(orderBy.column, { ascending: orderBy.ascending });

    // Aplicar filtros — ignora valores undefined ou vazios
    const activeFilters = JSON.parse(filtersKey) as Record<string, string | undefined>;
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        // Bypass safe typing at this nested level due to TS2589 infinite loop bug
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = (query as any).eq(key, value);
      }
    });

    const { data: result, error: queryError, count } = await query;

    if (queryError) {
      setError(queryError.message);
    } else {
      setData((result as T[]) ?? []);
      setTotal(count ?? 0);
    }

    setLoading(false);
  }, [table, filtersKey, pageSize, orderBy.column, orderBy.ascending]);

  useEffect(() => {
    // Reset para página 1 quando os filtros mudarem
    setPage(1);
  }, [filtersKey]);

  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    loading,
    error,
    setPage,
    refresh: () => fetchPage(page),
  };
}
