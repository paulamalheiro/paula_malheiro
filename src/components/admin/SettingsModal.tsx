import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  KeyRound, 
  History, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  User, 
  Clock, 
  Calendar,
  ShieldCheck,
  Layers,
  Hammer,
  Sliders,
  Megaphone,
  Search,
  Filter
} from 'lucide-react';
import { changeAdminPassword, fetchAuditLogs, type AuditLog } from '../../lib/pocketbase';
import { useAuth } from '../../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'password' | 'logs';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('logs');

  // Estados de Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados de Auditoria
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Carrega logs ao abrir o modal ou mudar para a aba de logs
  const loadLogs = async () => {
    setIsLoadingLogs(true);
    setLogsError(null);
    try {
      const data = await fetchAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn('[SettingsModal] Falha ao carregar histórico de auditoria:', err?.message);
      setLogs([]);
      setLogsError('Histórico de auditoria indisponível no momento.');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPasswordFeedback(null);
      if (activeTab === 'logs') {
        loadLogs();
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordFeedback({
        type: 'error',
        message: 'A nova senha deve possuir pelo menos 8 caracteres.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        message: 'A confirmação de nova senha não confere.',
      });
      return;
    }

    setIsSavingPassword(true);

    try {
      await changeAdminPassword(currentPassword, newPassword, confirmPassword);
      setPasswordFeedback({
        type: 'success',
        message: 'Senha atualizada com sucesso no PocketBase!',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Fecha o modal após breve feedback de sucesso
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setPasswordFeedback({
        type: 'error',
        message: err?.message || 'Falha ao atualizar a senha. Verifique a senha atual.',
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const formatLogDate = (dateStr?: any) => {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
      return { date: 'Recente', time: '--:--' };
    }
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return { date: 'Recente', time: '--:--' };
      }
      return {
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    } catch {
      return { date: 'Recente', time: '--:--' };
    }
  };

  const getSectionMeta = (section?: string | null) => {
    const sec = (section ? String(section) : '').toLowerCase();
    if (sec.includes('empreendimento') || sec.includes('imóvel') || sec.includes('imovel')) {
      return {
        label: 'Gestão de Empreendimentos',
        icon: <Layers size={13} className="shrink-0" />,
        className: 'bg-blue-50 text-blue-800 border-blue-200/80',
      };
    }
    if (sec.includes('obra') || sec.includes('construção') || sec.includes('construcao')) {
      return {
        label: 'Evolução das Obras',
        icon: <Hammer size={13} className="shrink-0" />,
        className: 'bg-amber-50 text-amber-800 border-amber-200/80',
      };
    }
    if (sec.includes('banner') || sec.includes('hero') || sec.includes('história')) {
      return {
        label: 'Banners Principais',
        icon: <Sliders size={13} className="shrink-0" />,
        className: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
      };
    }
    if (sec.includes('campanha') || sec.includes('pop') || sec.includes('popup')) {
      return {
        label: 'Campanhas & Pop-up',
        icon: <Megaphone size={13} className="shrink-0" />,
        className: 'bg-rose-50 text-rose-800 border-rose-200/80',
      };
    }
    if (sec.includes('senha') || sec.includes('seguran') || sec.includes('acesso')) {
      return {
        label: 'Segurança & Acesso',
        icon: <KeyRound size={13} className="shrink-0" />,
        className: 'bg-purple-50 text-purple-800 border-purple-200/80',
      };
    }
    return {
      label: section ? String(section) : 'Painel Geral',
      icon: <ShieldCheck size={13} className="shrink-0" />,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    };
  };

  const getActionBadgeColor = (action?: string | null) => {
    const act = (action ? String(action) : '').toLowerCase();
    if (act.includes('cria') || act.includes('cadastr') || act.includes('adicion')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (act.includes('exclu') || act.includes('delet') || act.includes('remov')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (act.includes('senha') || act.includes('seguran')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-sky-50 text-sky-800 border-sky-200';
  };

  const safeLogs = Array.isArray(logs) ? logs : [];

  // Filtro de logs por seção e pesquisa textual
  const filteredLogs = useMemo(() => {
    try {
      const q = (searchQuery || '').toLowerCase().trim();
      return safeLogs.filter((log) => {
        if (!log || typeof log !== 'object') return false;

        const secMeta = getSectionMeta(log.section);
        const matchesSection =
          selectedSectionFilter === 'all' ||
          secMeta.label === selectedSectionFilter ||
          (Boolean(log.section) && String(log.section) === selectedSectionFilter);

        const actionStr = (log.action ? String(log.action) : '').toLowerCase();
        const detailsStr = (log.details ? String(log.details) : '').toLowerCase();
        const sectionStr = (log.section ? String(log.section) : '').toLowerCase();
        const emailStr = (log.user_email ? String(log.user_email) : '').toLowerCase();

        const matchesSearch =
          !q ||
          actionStr.includes(q) ||
          detailsStr.includes(q) ||
          sectionStr.includes(q) ||
          emailStr.includes(q);

        return matchesSection && matchesSearch;
      });
    } catch (err) {
      console.warn('[SettingsModal] Erro ao filtrar logs:', err);
      return [];
    }
  }, [safeLogs, selectedSectionFilter, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-4xl lg:max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Header do Modal */}
        <div className="p-5 sm:p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-sans font-bold text-gray-900 leading-tight">
                Configurações do Painel
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Logado como: <span className="font-semibold text-gray-700">{user?.email || 'admin@paulamalheiro.com.br'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="px-5 sm:px-6 pt-3 flex gap-2 border-b border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <History size={16} /> Histórico de Alterações ({logs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <KeyRound size={16} /> Alteração de Senha
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md mx-auto py-4">
              {passwordFeedback && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-start gap-2 border ${
                    passwordFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {passwordFeedback.type === 'success' ? (
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
                  )}
                  <span>{passwordFeedback.message}</span>
                </div>
              )}

              {/* Senha Atual */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Sua senha atual"
                    className="block w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Nova Senha */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="No mínimo 8 caracteres"
                    className="block w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Recomendado usar letras, números e símbolos.
                </span>
              </div>

              {/* Confirmação de Nova Senha */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="block w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full py-3 px-4 bg-primary hover:bg-accent text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingPassword ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound size={15} /> Salvar Nova Senha
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Header do Histórico com Busca e Botão Atualizar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Histórico de Ações por Seção
                  </h3>
                  <p className="text-xs text-gray-500">
                    Acompanhe exatamente o que foi alterado e em qual seção da página cada modificação ocorreu.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="relative flex-1 sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filtrar histórico..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={loadLogs}
                    disabled={isLoadingLogs}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-accent bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <RefreshCw size={13} className={isLoadingLogs ? 'animate-spin' : ''} />
                    Atualizar
                  </button>
                </div>
              </div>

              {/* Filtros Rápidos por Seção */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs">
                {[
                  { key: 'all', label: 'Todas as Seções' },
                  { key: 'Gestão de Empreendimentos', label: 'Empreendimentos' },
                  { key: 'Evolução das Obras', label: 'Evolução das Obras' },
                  { key: 'Banners Principais', label: 'Banners Principais' },
                  { key: 'Campanhas & Pop-up', label: 'Campanhas & Pop-up' },
                  { key: 'Segurança & Acesso', label: 'Segurança' },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setSelectedSectionFilter(f.key)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                      selectedSectionFilter === f.key
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {logsError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <span>{logsError}</span>
                </div>
              )}

              {isLoadingLogs ? (
                <div className="py-16 flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <div className="w-9 h-9 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span className="text-xs font-medium">Carregando histórico do PocketBase...</span>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="py-16 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <History size={36} className="mx-auto mb-2 opacity-40 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-600">Nenhum registro encontrado para este filtro.</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {searchQuery ? 'Tente buscar com outros termos.' : 'Modificações no painel aparecerão aqui automaticamente.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-200/80 rounded-2xl shadow-xs bg-white">
                  <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
                    {filteredLogs.map((log, index) => {
                      const logId = log?.id || `log-item-${index}`;
                      const { date, time } = formatLogDate(log?.created);
                      const secMeta = getSectionMeta(log?.section);

                      return (
                        <div 
                          key={logId} 
                          className="p-4 hover:bg-gray-50/80 transition-colors flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Badge da Seção da Página */}
                              <span
                                className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border shadow-2xs ${secMeta.className}`}
                              >
                                {secMeta.icon}
                                <span>{secMeta.label}</span>
                              </span>

                              {/* Badge da Ação */}
                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getActionBadgeColor(
                                  log?.action
                                )}`}
                              >
                                {log?.action || 'Ação'}
                              </span>
                            </div>

                            {/* Data e Hora Formatada Sem Invalid Date */}
                            <div className="flex items-center gap-3 text-[11px] text-gray-500 font-mono">
                              <span className="inline-flex items-center gap-1">
                                <Calendar size={12} className="text-gray-400" /> {date}
                              </span>
                              {time !== '--:--' && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock size={12} className="text-gray-400" /> {time}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Detalhes da Ação */}
                          {log?.details && (
                            <p className="text-xs sm:text-[13px] text-gray-800 font-medium leading-relaxed pl-1">
                              {log.details}
                            </p>
                          )}

                          {/* Autor da Ação */}
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pl-1">
                            <User size={12} className="text-gray-400" />
                            <span>Executado por: <strong className="text-gray-600 font-semibold">{log?.user_email || 'admin@paulamalheiro.com.br'}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer do Modal */}
        <div className="p-4 px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            {activeTab === 'logs' ? `${filteredLogs.length} registro(s) exibido(s)` : 'Painel Administrativo Paula Malheiro'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
