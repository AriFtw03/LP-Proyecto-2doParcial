import React from 'react';
import { PawPrint, HeartHandshake, CalendarCheck, Home, ShieldCheck } from 'lucide-react';

export type ViewType = 'catalog' | 'inventory' | 'adoptions' | 'shifts';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  const menuItems = [
    { id: 'catalog' as ViewType, label: 'Catálogo de Adopción', icon: Home, author: 'Arianna & Matías' },
    { id: 'inventory' as ViewType, label: 'Expedientes Médicos', icon: PawPrint, author: 'Arianna Feijoo' },
    { id: 'adoptions' as ViewType, label: 'Gestión de Solicitudes', icon: HeartHandshake, author: 'Matías Collaguazo' },
    { id: 'shifts' as ViewType, label: 'Turnos de Voluntariado', icon: CalendarCheck, author: 'Diego Alfonzo' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col shrink-0 select-none">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-500/20">
          <PawPrint size={22} aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-base leading-tight">Refugio de Mascotas</h1>
          <p className="text-xs text-slate-400 font-medium">Sistema de Gestión</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5" aria-label="Navegación principal">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-teal-50/80 text-teal-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={19}
                  className={`transition-colors ${
                    isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </div>
              {isActive && (
                <span className="w-1.5 h-5 bg-teal-600 rounded-full" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/60 m-3 rounded-xl border border-slate-100 space-y-1 text-xs">
        <div className="flex items-center gap-1.5 text-teal-700 font-semibold">
          <ShieldCheck size={14} />
          <span>ESPOL · SOFG1009</span>
        </div>
        <p className="text-slate-500 font-medium">Lenguajes de Programación 2P</p>
      </div>
    </aside>
  );
};
