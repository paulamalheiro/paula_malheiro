import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Search, 
  RefreshCw, 
  Clock, 
  Eye, 
  Users, 
  ShieldCheck, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  fetchAccessLogsFromDb, 
  fetchClientsFromDb,
  cleanCpf, 
  type AccessLog, 
  type Client 
} from '../../lib/supabase';

export const AccessLogsManager: React.FC = () => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsData, clientsData] = await Promise.all([
        fetchAccessLogsFromDb(),
        fetchClientsFromDb(),
      ]);
      setLogs(logsData);
      setClients(clientsData);
    } catch (err) {
      console.error('Erro ao carregar logs de acesso:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Mapeia o status atual do cliente pelo CPF
  const clientStatusMap = useMemo(() => {
    const map = new Map<string, boolean>();
    clients.forEach((c) => {
      map.set(cleanCpf(c.cpf), c.active);
    });
    return map;
  }, [clients]);

  // Filtro de busca em tempo real
  const filteredLogs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return logs;
    const rawTerm = cleanCpf(term);

    return logs.filter((l) => {
      const matchName = l.client_name ? l.client_name.toLowerCase().includes(term) : false;
      const matchCpf = l.cpf ? l.cpf.toLowerCase().includes(term) : false;
      const matchRawCpf = rawTerm.length > 0 ? cleanCpf(l.cpf || '').includes(rawTerm) : false;
      return matchName || matchCpf || matchRawCpf;
    });
  }, [logs, searchTerm]);

  // Métricas
  const totalAcessos = useMemo(() => {
    return logs.reduce((acc, cur) => acc + (cur.access_count || 1), 0);
  }, [logs]);

  const uniqueClientsCount = logs.length;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Data não informada';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-1.5">
            <Activity size={14} /> Auditoria & Acessos
          </span>
          <h2 className="text-2xl font-sans font-bold text-primary mt-1">
            Logs de Acesso • Evolução das Obras
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Registro de todas as autenticações de clientes para acompanhamento dos empreendimentos.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Atualizar Lista
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Eye size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Total de Acessos</span>
            <span className="text-2xl font-sans font-bold text-primary">{totalAcessos}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Clientes Únicos</span>
            <span className="text-2xl font-sans font-bold text-primary">{uniqueClientsCount}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div className="overflow-hidden">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Última Entrada</span>
            <span className="text-xs font-bold text-gray-800 truncate block">
              {logs[0] ? formatDate(logs[0].last_access) : 'Nenhum acesso registrado'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabela de Logs */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              Histórico de Acessos ({filteredLogs.length})
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Visualização dos clientes que se identificaram por CPF e abriram a galeria.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente ou CPF..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
            Carregando logs de acesso...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs space-y-2">
            <Activity size={32} className="mx-auto text-gray-300" />
            <p className="font-bold text-gray-600">Nenhum registro de acesso encontrado.</p>
            <p className="text-[11px]">Assim que os clientes realizarem login para ver as obras, o histórico aparecerá aqui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">CPF</th>
                  <th className="py-3 px-4 text-center">Total de Acessos</th>
                  <th className="py-3 px-4">Último Acesso</th>
                  <th className="py-3 px-4 text-right">Status do Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => {
                  const isActive = clientStatusMap.get(cleanCpf(log.cpf)) ?? true;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 text-sm">{log.client_name}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-gray-700">
                        {log.cpf}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                          {log.access_count} {log.access_count === 1 ? 'acesso' : 'acessos'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-gray-400" />
                          <span>{formatDate(log.last_access)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}
                        >
                          {isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
