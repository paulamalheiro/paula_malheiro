import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  UserX,
  CreditCard,
  Check,
  RefreshCw,
  X
} from 'lucide-react';
import { 
  fetchClientsFromDb, 
  saveClientToDb, 
  toggleClientStatusInDb, 
  deleteClientFromDb,
  formatCpf,
  cleanCpf,
  type Client 
} from '../../lib/supabase';

export const ClientsManager: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await fetchClientsFromDb();
      setClients(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao carregar clientes.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // Máscara dinâmica de CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setCpf(formatted);
  };

  // Cadastro de novo cliente
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const raw = cleanCpf(cpf);
    if (raw.length !== 11) {
      setFeedback({ type: 'error', message: 'Por favor, informe um CPF válido com 11 dígitos.' });
      return;
    }

    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Informe o nome completo do cliente.' });
      return;
    }

    setIsSaving(true);
    try {
      await saveClientToDb({
        name: name.trim(),
        cpf: cpf,
        active: true,
      });

      await loadClients();
      setName('');
      setCpf('');
      setFeedback({
        type: 'success',
        message: `Cliente cadastrado com sucesso! Acesso à Evolução das Obras liberado.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao cadastrar cliente.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Alternar chave seletora Ativo / Inativo
  const handleToggleActive = async (client: Client) => {
    const newStatus = !client.active;
    try {
      await toggleClientStatusInDb(client.id, newStatus);
      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? { ...c, active: newStatus } : c))
      );
      setFeedback({
        type: 'success',
        message: `Status de "${client.name}" alterado para ${newStatus ? 'ATIVO' : 'INATIVO'}.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao alterar status do cliente.' });
    }
  };

  // Excluir cliente
  const handleDelete = async (client: Client) => {
    if (window.confirm(`Deseja realmente remover o cliente "${client.name}" (${client.cpf})?`)) {
      try {
        await deleteClientFromDb(client.id);
        setClients((prev) => prev.filter((c) => c.id !== client.id));
        setFeedback({
          type: 'success',
          message: `Cliente "${client.name}" removido com sucesso.`,
        });
      } catch (err: any) {
        setFeedback({ type: 'error', message: err?.message || 'Erro ao excluir cliente.' });
      }
    }
  };

  // Filtro de busca em tempo real
  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return clients;
    const rawTerm = cleanCpf(term);

    return clients.filter((c) => {
      const matchName = c.name ? c.name.toLowerCase().includes(term) : false;
      const matchCpf = c.cpf ? c.cpf.toLowerCase().includes(term) : false;
      const matchRawCpf = rawTerm.length > 0 ? cleanCpf(c.cpf || '').includes(rawTerm) : false;
      return matchName || matchCpf || matchRawCpf;
    });
  }, [clients, searchTerm]);

  const activeCount = useMemo(() => clients.filter((c) => c.active).length, [clients]);
  const inactiveCount = clients.length - activeCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-1.5">
            <Users size={14} /> Gestão de Acessos
          </span>
          <h2 className="text-2xl font-sans font-bold text-primary mt-1">
            Clientes • Evolução das Obras
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cadastre os clientes autorizados a acessar a galeria de acompanhamento das obras via CPF.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60 flex items-center gap-1.5">
            <ShieldCheck size={14} /> {activeCount} Ativos
          </span>
          {inactiveCount > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">
              {inactiveCount} Inativos
            </span>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium">{feedback.message}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Formulário de Cadastro */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <UserPlus size={16} className="text-primary" />
          Cadastrar Novo Cliente
        </h3>

        <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-6 space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Nome Completo do Cliente *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carlos Eduardo de Oliveira"
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="sm:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
              <span>CPF *</span>
              <span className="text-[10px] text-gray-400 font-normal">Preenchimento automático</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <CreditCard size={16} />
              </div>
              <input
                type="text"
                required
                maxLength={14}
                value={cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 px-4 bg-primary hover:bg-accent text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>Cadastrar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Clientes Cadastrados */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              Clientes Cadastrados ({filteredClients.length})
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Alterne a chave para ativar ou suspender o acesso do cliente à visualização das fotos.
            </p>
          </div>

          {/* Campo de Busca em Tempo Real e Botão de Atualizar */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search size={15} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou CPF..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>

            <button
              type="button"
              onClick={loadClients}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50"
              title="Atualizar lista de clientes"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>

        {/* Tabela de Clientes */}
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
            Carregando lista de clientes...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs space-y-2">
            <UserX size={32} className="mx-auto text-gray-300" />
            <p className="font-bold text-gray-600">
              {searchTerm ? 'Nenhum cliente encontrado com este termo.' : 'Nenhum cliente cadastrado ainda.'}
            </p>
            <p className="text-[11px]">Utilize o formulário acima para cadastrar o primeiro cliente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Nome do Cliente</th>
                  <th className="py-3 px-4">CPF</th>
                  <th className="py-3 px-4 text-center">Acesso à Obra</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 text-sm">{client.name}</div>
                      <div className="text-[10px] text-gray-400">
                        Cadastrado em {client.created ? new Date(client.created).toLocaleDateString('pt-BR') : 'Recente'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-gray-700">
                      {client.cpf}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        {/* Switch Seletor Ativo / Inativo */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(client)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            client.active ? 'bg-emerald-500' : 'bg-gray-300'
                          }`}
                          title={client.active ? 'Acesso Ativo (Clique para desativar)' : 'Acesso Inativo (Clique para ativar)'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              client.active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-[11px] font-bold ${
                            client.active ? 'text-emerald-700' : 'text-gray-400'
                          }`}
                        >
                          {client.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(client)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Excluir cliente"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
