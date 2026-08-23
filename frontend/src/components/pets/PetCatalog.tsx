// APORTE: ARIANNA FEIJOO & MATIAS COLLAGUAZO
import React, { useState, useEffect, useCallback } from 'react';
import type { Pet } from '../../types/pet';
import { petService } from '../../services/petService';
import { StatusBadge } from '../common/StatusBadge';
import { Heart, Search, Filter, AlertCircle, RefreshCw } from 'lucide-react';

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

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o raza..."
            aria-label="Buscar mascotas por nombre o raza"
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={18} className="text-slate-400 shrink-0" aria-hidden="true" />
          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            aria-label="Filtrar por especie"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="all">Todas las especies</option>
            <option value="perro">Perros</option>
            <option value="gato">Gatos</option>
            <option value="otro">Otros</option>
          </select>
        </div>
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
        <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-2">
          <RefreshCw size={24} className="animate-spin text-teal-600" />
          <span>Cargando catálogo de mascotas disponibles...</span>
        </div>
      ) : filteredPets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 font-medium">No se encontraron mascotas disponibles con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPets.map((pet) => (
            <div
              key={pet.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="h-44 bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center relative p-4">
                <span className="text-5xl select-none" role="img" aria-label={pet.especie}>
                  {pet.especie.toLowerCase() === 'gato' ? '🐱' : '🐶'}
                </span>
                <div className="absolute top-3 right-3">
                  <StatusBadge status={pet.estado_adopcion} />
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{pet.nombre}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-0.5">
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
