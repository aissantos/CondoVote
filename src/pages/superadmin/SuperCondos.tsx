import React, { useState, useEffect } from 'react';
import { Building2, Search, Plus, MapPin, Loader2, ImagePlus, UserCircle, X, Ticket, Copy, Check, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import { useCondos } from '../../hooks/useCondos';
import { useToast } from '../../hooks/useToast';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function SuperCondos() {
  const { 
    condos, managers, loading, searchingCnpj, submitting, 
    fetchData, searchCNPJ, createCondo, updateCondo, deleteCondo, toggleCondoStatus 
  } = useCondos();
  const toast = useToast();
  
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Confirm Delete state
  const [pendingDeleteCondo, setPendingDeleteCondo] = useState<{ id: string; name: string } | null>(null);
  
  // Modal state para formulário GUI UI View
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCondoId, setEditingCondoId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cnpj: '', corporate_name: '', trade_name: '',
    address: '', neighborhood: '', city: '', state: '', zip_code: '',
    manager_id: ''
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCnpjSearch = async () => {
    try {
      const data = await searchCNPJ(formData.cnpj);
      setFormData(prev => ({
        ...prev,
        ...data
      }));
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const handleCopyCode = (code: string | null) => {
    if(!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  const openCreateModal = () => {
    setEditingCondoId(null);
    setFormData({
      cnpj: '', corporate_name: '', trade_name: '',
      address: '', neighborhood: '', city: '', state: '', zip_code: '',
      manager_id: ''
    });
    setLogoFile(null);
    setLogoPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (condo: any) => {
    setEditingCondoId(condo.id);
    setFormData({
      cnpj: condo.cnpj,
      corporate_name: condo.corporate_name,
      trade_name: condo.trade_name || '',
      address: condo.address || '',
      neighborhood: condo.neighborhood || '',
      city: condo.city || '',
      state: condo.state || '',
      zip_code: condo.zip_code || '',
      manager_id: condo.manager_id || ''
    });
    setLogoFile(null);
    setLogoPreview(condo.logo_url || null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => setPendingDeleteCondo({ id, name });

  const confirmDeleteCondo = async () => {
    if (!pendingDeleteCondo) return;
    setPendingDeleteCondo(null);
    try {
      await deleteCondo(pendingDeleteCondo.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir: ' + msg);
    }
  };

  const handleToggle = async (id: string, status: boolean) => {
    try {
      await toggleCondoStatus(id, status);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao alterar status: ' + msg);
    }
  };

  const handleSaveCondo = async () => {
    try {
      if (editingCondoId) {
        await updateCondo(editingCondoId, formData, logoFile);
      } else {
        await createCondo(formData, logoFile);
      }
      
      // Cleanup UI
      setIsModalOpen(false);
      setEditingCondoId(null);
      setFormData({
        cnpj: '', corporate_name: '', trade_name: '',
        address: '', neighborhood: '', city: '', state: '', zip_code: '',
        manager_id: ''
      });
      setLogoFile(null);
      setLogoPreview(null);
    } catch (err) {
      if (err instanceof Error) toast.error('Erro ao salvar condomínio: ' + err.message);
    }
  };

  const filtered = condos.filter(c => 
    c.corporate_name.toLowerCase().includes(search.toLowerCase()) || 
    c.cnpj.includes(search)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Building2 className="text-blue-500" />
            Condomínios Registrados
          </h2>
          <p className="text-slate-400 mt-1">Gerencie os clientes (instâncias SaaS) ativos na plataforma.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} />
          Cadastrar Cliente
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 size-5" />
            <input 
              type="text"
              placeholder="Buscar por nome ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center text-blue-500">
            <Loader2 className="animate-spin size-8" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Condomínio / CNPJ</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Localização</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Síndico Responsável</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Código de Convite</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      Nenhum condomínio cadastrado no CRM.
                    </td>
                  </tr>
                ) : (
                  filtered.map((condo) => (
                    <tr key={condo.id} className={`hover:bg-slate-700/20 transition-colors ${condo.is_active === false ? 'opacity-50' : ''}`}>
                      <td className="p-4 flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {condo.logo_url ? (
                            <img src={condo.logo_url} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="text-slate-500" size={20} />
                          )}
                          {condo.is_active === false && (
                            <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center">
                              <PowerOff size={16} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight flex items-center gap-2">
                            {condo.trade_name || condo.corporate_name}
                            {condo.is_active === false && <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Inativo</span>}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{condo.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                          <MapPin size={14} className="text-slate-500" />
                          {condo.city} - {condo.state}
                        </div>
                      </td>
                      <td className="p-4">
                        {condo.manager ? (
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs font-bold shrink-0">
                              {condo.manager.full_name?.charAt(0) || 'U'}
                            </div>
                            <span className="text-sm font-semibold text-slate-300">{condo.manager.full_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-700/50 text-slate-400 uppercase tracking-widest">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {condo.invite_code ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-xs font-mono font-bold tracking-wider">
                              {condo.invite_code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(condo.invite_code)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                              title="Copiar código de convite"
                            >
                              {copiedCode === condo.invite_code ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Antigo (S/N)</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(condo)}
                            className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"
                            title="Editar Condomínio"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleToggle(condo.id, condo.is_active)}
                            className={`p-2 rounded-lg transition-colors ${condo.is_active !== false ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500' : 'bg-green-500/10 hover:bg-green-500/20 text-green-500'}`}
                            title={condo.is_active !== false ? "Suspender Acesso" : "Reativar Acesso"}
                          >
                            {condo.is_active !== false ? <PowerOff size={16} /> : <Power size={16} />}
                          </button>
                          <button 
                            onClick={() => handleDelete(condo.id, condo.corporate_name)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                            title="Deletar Definitivamente"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CADASTRAR CONDOMÍNIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 shrink-0">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="text-blue-500" />
                {editingCondoId ? 'Editar Instância' : 'Cadastrar Nova Instância'}
              </h3>
              <button disabled={submitting} onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Box CNPJ Search */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Buscar Instituição (CNPJ)</label>
                  <input 
                    type="text" 
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                    placeholder="Somente Números"
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <button 
                  onClick={handleCnpjSearch}
                  disabled={searchingCnpj || formData.cnpj.length < 14}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2.5 px-4 rounded-xl transition-colors shrink-0 flex items-center gap-2"
                >
                  {searchingCnpj ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                  Integrar Dados
                </button>
              </div>

              {/* Formulário Dados Preenchidos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Razão Social</label>
                  <input type="text" value={formData.corporate_name} onChange={(e) => setFormData({...formData, corporate_name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Nome de Fachada / Fantasia</label>
                  <input type="text" value={formData.trade_name} onChange={(e) => setFormData({...formData, trade_name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-blue-500 outline-none" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Logradouro / Endereço</label>
                  <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-blue-500 outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Bairro</label>
                  <input type="text" value={formData.neighborhood} onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">CEP</label>
                  <input type="text" value={formData.zip_code} onChange={(e) => setFormData({...formData, zip_code: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-blue-500 outline-none font-mono" />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Cidade</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Estado (UF)</label>
                  <input type="text" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-blue-500 outline-none" />
                </div>
              </div>

              {/* Box Gerenciamento e Assets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Síndico Líder (Admin)</label>
                  <select 
                    value={formData.manager_id}
                    onChange={(e) => setFormData({...formData, manager_id: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="">-- Selecionar Gestor --</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-2">Apenas usuários já promovidos a `ADMIN` aparecem na lista.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Logomarca (Upload)</label>
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImagePlus className="text-slate-600" size={24} />
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer"
                    />
                  </div>
                </div>

              </div>
              
            </div>
            
            <div className="p-6 border-t border-slate-700 bg-slate-900/80 flex justify-end gap-3 shrink-0">
              <button disabled={submitting} onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-700 rounded-xl transition-colors">
                Cancelar
              </button>
              <button disabled={submitting} onClick={handleSaveCondo} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
                {submitting ? 'Salvando Database...' : 'Finalizar Instância'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDeleteCondo}
        onClose={() => setPendingDeleteCondo(null)}
        onConfirm={confirmDeleteCondo}
        title="Excluir Condomínio"
        message={`Atenção: A exclusão de [${pendingDeleteCondo?.name}] é permanente e removerá todos os dados atrelados (Pautas, Votos, Moradores). Esta ação é irreversível.`}
        confirmLabel="Excluir Permanentemente"
      />
    </div>
  );
}
