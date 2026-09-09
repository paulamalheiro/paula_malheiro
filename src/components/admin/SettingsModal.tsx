import React, { useState, useEffect } from 'react';
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
  ShieldCheck
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
  const [activeTab, setActiveTab] = useState<SettingsTab>('password');

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

  // Carrega logs ao abrir o modal ou mudar para a aba de logs
  const loadLogs = async () => {
    setIsLoadingLogs(true);
    setLogsError(null);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (err: any) {
      setLogsError(err?.message || 'Falha ao carregar histórico de auditoria.');
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

  const formatLogDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return {
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  const getActionBadgeColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('cria') || act.includes('cadastr')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (act.includes('exclu') || act.includes('delet') || act.includes('remov')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (act.includes('senha') || act.includes('seguran')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header do Modal */}
        <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-sans font-bold text-gray-900 leading-tight">
                Configurações do Painel
              </h2>
              <p className="text-xs text-gray-500">
                Logado como: <span className="font-semibold text-gray-700">{user?.email || 'admin@paulamalheiro.com.br'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="px-6 pt-3 flex gap-2 border-b border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <KeyRound size={15} /> Alteração de Senha
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <History size={15} /> Histórico de Alterações
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md mx-auto py-2">
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Registro de Atividades Recentes
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Histórico cronológico de ações realizadas neste painel e persistidas no PocketBase.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadLogs}
                  disabled={isLoadingLogs}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-accent bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} className={isLoadingLogs ? 'animate-spin' : ''} />
                  Atualizar
                </button>
              </div>

              {logsError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <span>{logsError}</span>
                </div>
              )}

              {isLoadingLogs ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span className="text-xs font-medium">Carregando histórico...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <History size={32} className="mx-auto mb-2 opacity-40 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-600">Nenhuma ação registrada ainda.</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Modificações em empreendimentos, banners e campanhas aparecerão aqui automaticamente.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-2xl shadow-xs">
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
                    {logs.map((log) => {
                      const { date, time } = formatLogDate(log.created);
                      return (
                        <div key={log.id} className="p-3.5 hover:bg-gray-50/70 transition-colors flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getActionBadgeColor(
                                log.action
                              )}`}
                            >
                              {log.action}
                            </span>
                            <div className="flex items-center gap-3 text-[11px] text-gray-500 font-mono">
                              <span className="inline-flex items-center gap-1">
                                <Calendar size={11} className="text-gray-400" /> {date}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock size={11} className="text-gray-400" /> {time}
                              </span>
                            </div>
                          </div>

                          {log.details && (
                            <p className="text-xs text-gray-700 font-medium leading-relaxed">
                              {log.details}
                            </p>
                          )}

                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <User size={11} className="text-gray-400" />
                            <span>{log.user_email || 'admin@paulamalheiro.com.br'}</span>
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
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
