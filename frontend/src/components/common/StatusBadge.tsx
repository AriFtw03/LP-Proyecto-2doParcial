import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toLowerCase();

  const getStyle = () => {
    switch (normalized) {
      case 'disponible':
      case 'aprobada':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'en proceso':
      case 'pendiente':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'adoptado':
      case 'rechazada':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getStyle()}`}
    >
      {status}
    </span>
  );
};
