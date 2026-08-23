import React from 'react';
import { PawPrint, HeartHandshake, CalendarCheck, Home } from 'lucide-react';

export type ViewType = 'catalog' | 'inventory' | 'adoptions' | 'shifts';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  const menuItems = [
    { id: 'catalog' as ViewType, label: 'Catálogo de Adopción', icon: Home },
    { id: 'inventory' as ViewType, label: 'Expedientes Médicos', icon: PawPrint },
    { id: 'adoptions' as ViewType, label: 'Gestión de Solicitudes', icon: HeartHandshake },
    { id: 'shifts' as ViewType, label: 'Turnos de Voluntariado', icon: CalendarCheck },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-500/20">
          <PawPrint size={22} aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-base leading-tight">Refugio de Mascotas</h1>
          <p className="text-xs text-slate-500">Sistema de Gestión</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1" aria-label="Navegación principal">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-teal-600' : 'text-slate-400'} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
        <p>LP 2026 — 2do Parcial</p>
      </div>
    </aside>
  );
};
