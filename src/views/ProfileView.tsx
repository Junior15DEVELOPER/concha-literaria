import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Flame, 
  Trophy, 
  Target, 
  BookOpen, 
  Clock, 
  Download, 
  Upload, 
  Calendar, 
  Share2, 
  Edit, 
  Shield, 
  Sparkles,
  Lock,
  Check,
  LogOut,
  Trash2,
  Palette
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { ConchaLogo } from '../components/common/ConchaLogo';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export const ProfileView: React.FC = () => {
  const { 
    user, 
    userBooks, 
    sessions, 
    quotes, 
    achievements, 
    currentStreak, 
    longestStreak, 
    activeDates,
    updateUserProfile,
    exportDataJson,
    importDataJson
  } = useApp();

  const { user: authUser, isAuthenticated, logout, token } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'rewind' | 'settings'>('stats');

  // Edit Profile Modal
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(authUser?.name || user.name);
  const [bioInput, setBioInput] = useState(authUser?.profile?.bio || user.bio || '');
  const [avatarInput, setAvatarInput] = useState(authUser?.profile?.avatarUrl || user.avatarUrl);

  // Settings Goals Modal
  const [yearlyGoalInput, setYearlyGoalInput] = useState(authUser?.profile?.readingGoalYear || user.readingGoalYear);
  const [dailyMinutesInput, setDailyMinutesInput] = useState(authUser?.profile?.dailyMinutesGoal || user.dailyMinutesGoal);

  // Delete account state
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // JSON Export / Import state
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isCopiedShare, setIsCopiedShare] = useState(false);

  // Computed Real Statistics
  const booksReadCount = userBooks.filter((b) => b.status === 'read').length;
  const booksReadingCount = userBooks.filter((b) => b.status === 'reading').length;
  const totalPagesRead = sessions.reduce((acc, s) => acc + (s.pagesRead || 0), 0);
  const totalSeconds = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);

  // Calendar Heatmap data (past 28 days)
  const getPastDays = (numDays = 28) => {
    const days: { dateStr: string; dayNum: number; hasRead: boolean; pages: number }[] = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySessions = sessions.filter((s) => s.timestamp === dateStr);
      const pages = daySessions.reduce((acc, s) => acc + (s.pagesRead || 0), 0);
      days.push({
        dateStr,
        dayNum: d.getDate(),
        hasRead: activeDates.has(dateStr),
        pages
      });
    }
    return days;
  };

  const heatmapDays = getPastDays(28);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: nameInput,
      bio: bioInput,
      avatarUrl: avatarInput,
      readingGoalYear: yearlyGoalInput,
      dailyMinutesGoal: dailyMinutesInput
    });

    if (token) {
      try {
        await fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: nameInput,
            bio: bioInput,
            avatarUrl: avatarInput,
            readingGoalYear: yearlyGoalInput,
            dailyMinutesGoal: dailyMinutesInput
          })
        });
      } catch (err) {
        console.warn('[ProfileView] Não foi possível sincronizar perfil remotamente.');
      }
    }

    toast('Perfil atualizado com sucesso!', 'success');
    setIsEditingProfile(false);
  };

  const handleSelectTheme = async (newTheme: 'light' | 'dark' | 'sepia') => {
    updateUserProfile({ themePreference: newTheme });
    document.documentElement.classList.remove('dark', 'theme-sepia');
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    if (newTheme === 'sepia') document.documentElement.classList.add('theme-sepia');

    if (token) {
      try {
        await fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ themePreference: newTheme })
        });
      } catch (err) {
        console.warn('[ProfileView] Falha ao salvar tema no servidor.');
      }
    }
    toast(`Tema ${newTheme === 'light' ? 'Claro' : newTheme === 'dark' ? 'Escuro' : 'Sépia'} ativado!`, 'info');
  };

  const handleDeleteAccountConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/users/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: deletePassword })
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Erro ao excluir conta', 'error');
        setIsDeleting(false);
        return;
      }

      toast('Sua conta e dados foram permanentemente excluídos.', 'info');
      logout();
      setIsDeleteAccountOpen(false);
    } catch {
      toast('Erro de conexão ao excluir conta.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    const json = exportDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `concha-literaria-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJson(content);
      setImportStatus(success ? '✓ Dados importados com sucesso!' : 'Erro ao importar arquivo JSON.');
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  const handleShareRewind = () => {
    setIsCopiedShare(true);
    setTimeout(() => setIsCopiedShare(false), 2000);
  };

  return (
    <div className="space-y-6 pb-24 pt-2 px-4 animate-fade-in max-w-md mx-auto">
      {/* 1. Profile Header Card */}
      <div className="bg-surface border border-border/80 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary shadow-xs"
            />
            <div>
              <h2 className="font-serif font-bold text-lg text-ink leading-tight">
                {user.name}
              </h2>
              <p className="text-xs text-ink-muted">{user.handle}</p>
              <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-accent">
                <Flame className="w-3.5 h-3.5 fill-accent" />
                <span>{currentStreak} dias seguidos</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditingProfile(true)}
            className="p-2 rounded-full border border-border text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
            title="Editar perfil"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>

        {user.bio && (
          <p className="text-xs text-ink font-reading leading-relaxed bg-surface-hover/50 p-2.5 rounded-xl border border-border/40">
            {user.bio}
          </p>
        )}

        {/* Quick Numbers Bar */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-center">
          <div>
            <span className="block font-bold text-base text-ink">{booksReadCount}</span>
            <span className="text-[10px] text-ink-muted uppercase tracking-wider">Lidos</span>
          </div>
          <div>
            <span className="block font-bold text-base text-ink">{booksReadingCount}</span>
            <span className="text-[10px] text-ink-muted uppercase tracking-wider">Lendo</span>
          </div>
          <div>
            <span className="block font-bold text-base text-ink">{totalPagesRead}</span>
            <span className="text-[10px] text-ink-muted uppercase tracking-wider">Páginas</span>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tabs */}
      <div className="flex bg-surface-hover/80 p-1 rounded-2xl border border-border text-xs font-semibold">
        {[
          { id: 'stats', label: 'Estatísticas' },
          { id: 'achievements', label: `Conquistas (${achievements.filter((a) => a.isUnlocked).length})` },
          { id: 'rewind', label: 'Retrospectiva' },
          { id: 'settings', label: 'Ajustes' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 text-center rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-surface text-primary shadow-2xs font-bold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ESTATÍSTICAS COMPLETAS & CALENDÁRIO */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {/* Main Stat Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface border border-border rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                Horas de Leitura
              </span>
              <p className="text-2xl font-bold text-ink">{totalHours}h</p>
              <p className="text-[10px] text-ink-faint">Em {sessions.length} sessões registradas</p>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                Maior Sequência
              </span>
              <p className="text-2xl font-bold text-accent">{longestStreak} dias</p>
              <p className="text-[10px] text-ink-faint">Recorde de consistência</p>
            </div>
          </div>

          {/* Reading Heatmap Calendar (Past 28 days) */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Calendar className="w-4 h-4 text-primary" />
                <span>Calendário de Hábito (Últimos 28 dias)</span>
              </div>
              <span className="text-[10px] text-ink-muted">{activeDates.size} dias ativos</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {heatmapDays.map((d) => (
                <div
                  key={d.dateStr}
                  title={`${d.dateStr}: ${d.pages} págs`}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] transition-transform hover:scale-110 ${
                    d.hasRead
                      ? 'bg-primary text-white font-bold shadow-xs'
                      : 'bg-surface-hover border border-border/40 text-ink-faint'
                  }`}
                >
                  <span>{d.dayNum}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONQUISTAS E GAMIFICAÇÃO */}
      {activeTab === 'achievements' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>
              {achievements.filter((a) => a.isUnlocked).length} de {achievements.length} medalhas conquistadas
            </span>
          </div>

          <div className="space-y-2.5">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                  ach.isUnlocked
                    ? 'bg-surface border-border shadow-xs'
                    : 'bg-surface-hover/40 border-border/50 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                    ach.isUnlocked ? 'bg-primary/10' : 'bg-surface border border-border'
                  }`}
                >
                  {ach.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-ink truncate">{ach.title}</h4>
                    {ach.isUnlocked && (
                      <span className="text-[10px] font-bold text-sage bg-sage-light px-2 py-0.5 rounded-full">
                        ✓ Desbloqueada
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5 line-clamp-1">{ach.description}</p>

                  {!ach.isUnlocked && (
                    <div className="w-full bg-border-subtle h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-primary/70 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.round((ach.currentValue / ach.requiredValue) * 100))}%`
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RETROSPECTIVA / REWIND ANUAL */}
      {activeTab === 'rewind' && (
        <div className="space-y-4 text-center">
          {/* Visual Shareable Card */}
          <div className="p-6 bg-gradient-to-br from-[#8B3224] via-[#5C1E14] to-[#250905] text-white rounded-3xl shadow-xl space-y-4 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
            <ConchaLogo variant="symbol" size="md" theme="light" />

            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gold">
                Retrospectiva Literária {new Date().getFullYear()}
              </p>
              <h3 className="font-serif text-2xl font-bold mt-1">
                Jornada de {user.name}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/15 text-left">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                <span className="text-[10px] text-white/70 block uppercase">Livros Lidos</span>
                <span className="text-xl font-bold text-gold">{booksReadCount}</span>
              </div>
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                <span className="text-[10px] text-white/70 block uppercase">Páginas Percorridas</span>
                <span className="text-xl font-bold text-white">{totalPagesRead}</span>
              </div>
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                <span className="text-[10px] text-white/70 block uppercase">Horas Imerso</span>
                <span className="text-xl font-bold text-white">{totalHours}h</span>
              </div>
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                <span className="text-[10px] text-white/70 block uppercase">Maior Streak</span>
                <span className="text-xl font-bold text-accent">{longestStreak} dias</span>
              </div>
            </div>

            <p className="text-[10px] text-white/70 font-sans tracking-wide">
              conchaliteraria.app &middot; Sua biblioteca. Seu diário. Sua jornada.
            </p>
          </div>

          <button
            onClick={handleShareRewind}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>{isCopiedShare ? '✓ Pronto para compartilhar!' : 'Compartilhar Retrospectiva'}</span>
          </button>
        </div>
      )}

      {/* TAB 4: AJUSTES & BACKUP */}
      {activeTab === 'settings' && (
        <div className="space-y-4 text-xs">
          {/* 1. Conta & Sessão */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Sua Conta</span>
            </h4>

            {isAuthenticated && authUser ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 bg-surface-hover rounded-xl border border-border/40">
                  <div>
                    <span className="font-bold text-ink block">{authUser.name}</span>
                    <span className="text-ink-muted text-[11px]">@{authUser.username} • {authUser.email}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-primary-light text-primary font-bold text-[10px]">
                    {authUser.role}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={logout}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-surface-hover border border-border hover:bg-surface font-semibold text-ink rounded-xl transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-ink-muted" />
                    <span>Sair da Conta</span>
                  </button>

                  <button
                    onClick={() => setIsDeleteAccountOpen(true)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 font-semibold text-red-600 dark:text-red-400 rounded-xl transition-colors"
                    title="Excluir conta e dados permanentemente conforme LGPD"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-surface-hover rounded-xl border border-border/40 text-center space-y-2">
                <p className="text-ink-muted text-xs">Você está navegando como visitante local.</p>
                <p className="text-ink-faint text-[11px]">Entre com sua conta para sincronizar suas leituras no PostgreSQL e acessar seus dados em qualquer dispositivo.</p>
              </div>
            )}
          </div>

          {/* 2. Tema & Aparência */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-primary" />
              <span>Tema de Leitura</span>
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectTheme('light')}
                className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                  user.themePreference === 'light'
                    ? 'border-primary bg-primary-light font-bold text-primary shadow-xs'
                    : 'border-border bg-surface-hover text-ink-muted hover:text-ink'
                }`}
              >
                ☀️ Claro
              </button>
              <button
                type="button"
                onClick={() => handleSelectTheme('dark')}
                className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                  user.themePreference === 'dark'
                    ? 'border-primary bg-primary-light font-bold text-primary shadow-xs'
                    : 'border-border bg-surface-hover text-ink-muted hover:text-ink'
                }`}
              >
                🌙 Escuro
              </button>
              <button
                type="button"
                onClick={() => handleSelectTheme('sepia')}
                className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                  user.themePreference === 'sepia'
                    ? 'border-primary bg-primary-light font-bold text-primary shadow-xs'
                    : 'border-border bg-surface-hover text-ink-muted hover:text-ink'
                }`}
              >
                📜 Sépia
              </button>
            </div>
          </div>

          {/* 3. Metas de Leitura */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span>Metas Pessoais</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-ink-muted mb-1">Livros / Ano</label>
                <input
                  type="number"
                  value={yearlyGoalInput}
                  onChange={(e) => setYearlyGoalInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-sm font-bold text-ink"
                />
              </div>
              <div>
                <label className="block text-ink-muted mb-1">Minutos / Dia</label>
                <input
                  type="number"
                  value={dailyMinutesInput}
                  onChange={(e) => setDailyMinutesInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-sm font-bold text-ink"
                />
              </div>
            </div>
            <button
              onClick={() => {
                updateUserProfile({
                  readingGoalYear: yearlyGoalInput,
                  dailyMinutesGoal: dailyMinutesInput
                });
                toast('Metas salvas com sucesso!', 'success');
              }}
              className="w-full py-2 bg-primary text-white font-bold rounded-xl shadow-2xs hover:bg-primary-hover transition-colors"
            >
              Salvar Metas
            </button>
          </div>

          {/* 4. Backup Data */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Backup & Sincronização</span>
            </h4>
            <p className="text-ink-muted text-[11px]">
              Seus dados são preservados com redundância. Você pode exportar seu histórico completo ou restaurar a qualquer momento.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-surface-hover border border-border hover:bg-surface font-bold text-ink rounded-xl transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar JSON</span>
              </button>

              <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-surface-hover border border-border hover:bg-surface font-bold text-ink rounded-xl transition-colors cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5" />
                <span>Importar JSON</span>
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>
            </div>

            {importStatus && (
              <p className="text-center font-bold text-sage text-xs">{importStatus}</p>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditingProfile} onClose={() => setIsEditingProfile(false)} title="Editar Perfil">
        <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-ink-muted mb-1">Nome Completo</label>
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm text-ink"
            />
          </div>

          <div>
            <label className="block font-medium text-ink-muted mb-1">Biografia Literária</label>
            <textarea
              rows={3}
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-ink font-reading"
            />
          </div>

          <div>
            <label className="block font-medium text-ink-muted mb-1">URL do Avatar</label>
            <input
              type="url"
              value={avatarInput}
              onChange={(e) => setAvatarInput(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-ink"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-hover transition-colors"
          >
            Salvar Alterações
          </button>
        </form>
      </Modal>

      {/* Delete Account Modal (LGPD) */}
      <Modal isOpen={isDeleteAccountOpen} onClose={() => setIsDeleteAccountOpen(false)} title="Excluir Conta Permanentemente">
        <form onSubmit={handleDeleteAccountConfirm} className="space-y-3 text-xs">
          <p className="text-ink-muted text-xs leading-relaxed">
            Esta ação é irreversível. Todas as suas leituras, notas, citações e dados pessoais serão excluídos do banco de dados em conformidade com as diretrizes de privacidade e LGPD.
          </p>

          <div>
            <label className="block font-semibold text-ink-muted mb-1">Confirme sua senha</label>
            <input
              type="password"
              required
              placeholder="Digite sua senha atual"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-red-300 dark:border-red-900/50 rounded-xl text-sm text-ink"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteAccountOpen(false)}
              className="flex-1 py-2.5 bg-surface-hover border border-border font-semibold text-ink rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isDeleting || !deletePassword}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
