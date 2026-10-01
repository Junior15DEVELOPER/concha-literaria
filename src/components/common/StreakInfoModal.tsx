import React from 'react';
import { Flame, Calendar, Trophy, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';

interface StreakInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StreakInfoModal: React.FC<StreakInfoModalProps> = ({ isOpen, onClose }) => {
  const { currentStreak, longestStreak, activeDates } = useApp();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sequência de Leitura">
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/15 text-accent mx-auto flex items-center justify-center animate-bounce">
          <Flame className="w-8 h-8 fill-accent" />
        </div>

        <div>
          <h3 className="font-serif text-2xl font-bold text-ink">
            {currentStreak} {currentStreak === 1 ? 'Dia Seguido' : 'Dias Seguidos'}
          </h3>
          <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
            {currentStreak > 0
              ? 'Parabéns pela constância! Cada dia de leitura fortalece seu hábito literário.'
              : 'Faça sua primeira sessão de leitura hoje para acender a chama da sua sequência!'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="bg-surface-hover/80 p-3 rounded-2xl border border-border">
            <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider block">
              Sequência Atual
            </span>
            <span className="text-xl font-bold text-accent">{currentStreak} dias</span>
          </div>
          <div className="bg-surface-hover/80 p-3 rounded-2xl border border-border">
            <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider block">
              Maior Recorde
            </span>
            <span className="text-xl font-bold text-ink">{longestStreak} dias</span>
          </div>
        </div>

        <div className="p-3.5 bg-surface border border-border rounded-2xl text-left space-y-1.5 text-xs text-ink-muted">
          <div className="flex items-center gap-1.5 font-bold text-ink text-xs">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Como funciona a sequência?</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Ao registrar qualquer sessão de leitura no cronômetro ou atualizar páginas lidas em um livro no dia, sua chama é alimentada e sua sequência é preservada.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-all"
        >
          Continuar Lendo
        </button>
      </div>
    </Modal>
  );
};
