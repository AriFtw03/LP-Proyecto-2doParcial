import React from 'react';
import { CheckCircle2, Clock, Heart, XCircle, Sparkles } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toLowerCase();

  const getConfig = () => {
    switch (normalized) {
      case 'disponible':
        return {
          style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: Sparkles,
        };
      case 'aprobada':
        return {
          style: 'bg-teal-50 text-teal-700 border-teal-200',
          icon: CheckCircle2,
        };
      case 'en proceso':
      case 'pendiente':
        return {
          style: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
        };
      case 'adoptado':
        return {
          style: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Heart,
        };
      case 'rechazada':
        return {
          style: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: XCircle,
        };
      default:
        return {
          style: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: Sparkles,
        };
    }
  };

  const { style, icon: Icon } = getConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${style}`}
    >
      <Icon size={12} aria-hidden="true" className="shrink-0" />
      <span>{status}</span>
    </span>
  );
};
