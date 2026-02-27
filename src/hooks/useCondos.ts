import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

type Profile = {
  id: string;
  full_name: string | null;
  role: string;
};

export type Condo = {
  id: string;
  cnpj: string;
  corporate_name: string;
  trade_name: string;
  city: string;
  state: string;
  logo_url: string | null;
  manager_id: string | null;
  manager?: Profile | null;
};

export type CondoFormData = {
  cnpj: string;
  corporate_name: string;
  trade_name: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  manager_id: string;
};

export function useCondos() {
  const [condos, setCondos] = useState<Condo[]>([]);
  const [managers, setManagers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchingCnpj, setSearchingCnpj] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [condosResp, managersResp] = await Promise.all([
        supabase
          .from('condos')
          .select(`*, manager:profiles(id, full_name, role)`)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('role', 'ADMIN')
      ]);

      if (condosResp.data) setCondos(condosResp.data as Condo[]);
      if (managersResp.data) setManagers(managersResp.data as Profile[]);
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCNPJ = async (cnpjString: string) => {
    const cleanCnpj = cnpjString.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      throw new Error('CNPJ deve conter 14 dígitos.');
    }
    
    setSearchingCnpj(true);
    try {
      const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (!resp.ok) throw new Error('CNPJ não encontrado ou erro na API da Receita Federal.');
      
      const data = await resp.json();
      return {
        corporate_name: data.razao_social || '',
        trade_name: data.nome_fantasia || data.razao_social || '',
        address: `${data.logradouro}, ${data.numero}${data.complemento ? ' - ' + data.complemento : ''}`,
        neighborhood: data.bairro || '',
        city: data.municipio || '',
        state: data.uf || '',
        zip_code: data.cep || ''
      };
    } finally {
      setSearchingCnpj(false);
    }
  };

  const createCondo = async (formData: CondoFormData, logoFile: File | null) => {
    if (!formData.cnpj || !formData.corporate_name) {
      throw new Error('CNPJ e Razão Social são obrigatórios.');
    }
    
    setSubmitting(true);
    let uploadedLogoUrl = null;

    try {
      // 1. Storage Upload
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${formData.cnpj.replace(/\D/g, '')}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('condos')
          .upload(fileName, logoFile);
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('condos').getPublicUrl(fileName);
        uploadedLogoUrl = publicUrlData.publicUrl;
      }

      // 2. Database Insert
      const { error: insertError } = await supabase.from('condos').insert([{
        cnpj: formData.cnpj.replace(/\D/g, ''),
        corporate_name: formData.corporate_name,
        trade_name: formData.trade_name,
        address: formData.address,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code.replace(/\D/g, ''),
        logo_url: uploadedLogoUrl,
        manager_id: formData.manager_id || null
      }]);

      if (insertError) throw insertError;
      
      // Refresh memory list
      await fetchData();

    } finally {
      setSubmitting(false);
    }
  };

  return {
    condos,
    managers,
    loading,
    searchingCnpj,
    submitting,
    fetchData,
    searchCNPJ,
    createCondo
  };
}
