// APORTE: ARIANNA FEIJOO & MATIAS COLLAGUAZO
import React, { useState, useEffect, useCallback } from 'react';
import type { Pet } from '../../types/pet';
import { petService } from '../../services/petService';
import { StatusBadge } from '../common/StatusBadge';
import { Heart, Search, X, AlertCircle, RefreshCw, Sparkles, SlidersHorizontal } from 'lucide-react';

interface PetCatalogProps {
  onAdoptClick: (pet: Pet) => void;
}

export const PetCatalog: React.FC<PetCatalogProps> = ({ onAdoptClick }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');

  const fetchPets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await petService.getAll('disponible');
      setPets(data);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('No se pudo cargar el catálogo de mascotas disponibles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    petService
      .getAll('disponible', controller.signal)
      .then((data) => {
        setPets(data);
        setError(null);
      })
      .catch((err) => {
        if (!(err instanceof Error && err.name === 'AbortError')) {
          setError('No se pudo cargar el catálogo de mascotas disponibles.');
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const filteredPets = pets.filter((pet) => {
    const matchesSearch =
      pet.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.raza.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies =
      filterSpecies === 'all' || pet.especie.toLowerCase() === filterSpecies.toLowerCase();
    return matchesSearch && matchesSpecies;
  });

  const speciesOptions = [
    { id: 'all', label: 'Todos', emoji: '🐾' },
    { id: 'perro', label: 'Perros', emoji: '🐶' },
    { id: 'gato', label: 'Gatos', emoji: '🐱' },
    { id: 'otro', label: 'Otros', emoji: '🐰' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o raza..."
            aria-label="Buscar mascotas por nombre o raza"
            className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0" role="group" aria-label="Filtro por especie">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1.5 flex items-center gap-1 hidden sm:flex">
            <SlidersHorizontal size={14} /> Especie:
          </span>
          {speciesOptions.map((opt) => {
            const isSelected = filterSpecies === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilterSpecies(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-teal-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
        <span className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-teal-600" />
          <span>Mostrando <strong>{filteredPets.length}</strong> {filteredPets.length === 1 ? 'mascota disponible' : 'mascotas disponibles'}</span>
        </span>
        {(searchTerm || filterSpecies !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setFilterSpecies('all');
            }}
            className="text-teal-600 hover:text-teal-700 underline font-semibold"
          >
            Restablecer filtros
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchPets();
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors"
          >
            <RefreshCw size={14} />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
          <RefreshCw size={28} className="animate-spin text-teal-600" />
          <span className="text-sm font-medium">Cargando catálogo de mascotas disponibles...</span>
        </div>
      ) : filteredPets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-2xl">
            🔍
          </div>
          <p className="text-slate-700 font-semibold">No se encontraron mascotas con los criterios seleccionados.</p>
          <p className="text-xs text-slate-400">Intenta buscar con otros términos o cambia el filtro de especie.</p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setFilterSpecies('all');
            }}
            className="mt-2 px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold text-xs rounded-lg transition-colors"
          >
            Ver todas las mascotas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPets.map((pet) => (
            <div
              key={pet.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col group"
            >
              <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {pet.foto_url ? (
                  <img
                    src={pet.foto_url}
                    alt={`${pet.nombre} (${pet.especie})`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-10"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center z-0">
                  <span className="text-5xl select-none" role="img" aria-label={pet.especie}>
                    {pet.especie.toLowerCase() === 'gato' ? '🐱' : pet.especie.toLowerCase() === 'perro' ? '🐶' : '🐾'}
                  </span>
                </div>
                <div className="absolute top-3 right-3 z-20 drop-shadow-sm">
                  <StatusBadge status={pet.estado_adopcion} />
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{pet.nombre}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">
                    {pet.especie} · {pet.raza}
                  </p>
                  <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700">Salud:</span> {pet.estado_salud}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAdoptClick(pet)}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors shadow-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <Heart size={16} aria-hidden="true" />
                  <span>Postular a Adopción</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
