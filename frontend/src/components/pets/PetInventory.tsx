// APORTE: ARIANNA FEIJOO
import React, { useState, useEffect, useCallback } from 'react';
import type { Pet, PetInput } from '../../types/pet';
import { petService } from '../../services/petService';
import { StatusBadge } from '../common/StatusBadge';
import { Plus, Edit2, Trash2, Search, X, AlertCircle, RefreshCw, Activity, Heart, Sparkles, Clock } from 'lucide-react';
import { PetModal } from './PetModal';

export const PetInventory: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const fetchPets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await petService.getAll();
      setPets(data);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('No se pudieron cargar los expedientes médicos de las mascotas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    petService
      .getAll(undefined, controller.signal)
      .then((data) => {
        setPets(data);
        setError(null);
      })
      .catch((err) => {
        if (!(err instanceof Error && err.name === 'AbortError')) {
          setError('No se pudieron cargar los expedientes médicos de las mascotas.');
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const handleCreateOrUpdate = async (data: PetInput) => {
    if (editingPet) {
      await petService.update(editingPet.id, data);
    } else {
      await petService.create(data);
    }
    await fetchPets();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Confirmas que deseas eliminar este expediente de mascota?')) {
      try {
        await petService.delete(id);
        await fetchPets();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar la mascota.');
      }
    }
  };

  const filteredPets = pets.filter((pet) =>
    pet.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.raza.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.especie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCount = pets.length;
  const availableCount = pets.filter((p) => p.estado_adopcion === 'disponible').length;
  const inProcessCount = pets.filter((p) => p.estado_adopcion === 'en proceso').length;
  const adoptedCount = pets.filter((p) => p.estado_adopcion === 'adoptado').length;

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold shrink-0">
            <Activity size={20} className="text-teal-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Rescates</p>
            <p className="text-xl font-bold text-slate-800">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disponibles</p>
            <p className="text-xl font-bold text-emerald-700">{availableCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">En Proceso</p>
            <p className="text-xl font-bold text-amber-700">{inProcessCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Heart size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Adoptados</p>
            <p className="text-xl font-bold text-purple-700">{adoptedCount}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, especie o raza..."
            aria-label="Buscar mascotas en el inventario"
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

        <button
          type="button"
          onClick={() => {
            setEditingPet(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors shadow-xs shrink-0 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
        >
          <Plus size={16} aria-hidden="true" />
          <span>Nueva Mascota</span>
        </button>
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

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm border-collapse" aria-label="Inventario médico de mascotas">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-4">ID</th>
              <th scope="col" className="py-3.5 px-4">Nombre</th>
              <th scope="col" className="py-3.5 px-4">Especie / Raza</th>
              <th scope="col" className="py-3.5 px-4">Historial Médico</th>
              <th scope="col" className="py-3.5 px-4">Estado Adopción</th>
              <th scope="col" className="py-3.5 px-4">Ingreso</th>
              <th scope="col" className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex justify-center items-center gap-2">
                    <RefreshCw size={18} className="animate-spin text-teal-600" />
                    <span>Cargando inventario médico...</span>
                  </div>
                </td>
              </tr>
            ) : filteredPets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No hay registros de mascotas disponibles.
                </td>
              </tr>
            ) : (
              filteredPets.map((pet) => (
                <tr key={pet.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-slate-400">#{pet.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center relative">
                        {pet.foto_url ? (
                          <img
                            src={pet.foto_url}
                            alt=""
                            className="w-full h-full object-cover relative z-10"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <span className="text-base select-none absolute inset-0 flex items-center justify-center z-0 bg-slate-100">
                          {pet.especie.toLowerCase() === 'gato' ? '🐱' : pet.especie.toLowerCase() === 'perro' ? '🐶' : '🐾'}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-800">{pet.nombre}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{pet.especie} · {pet.raza}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate font-medium">{pet.estado_salud}</td>
                  <td className="py-3 px-4"><StatusBadge status={pet.estado_adopcion} /></td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{new Date(pet.fecha_ingreso).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPet(pet);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      aria-label={`Editar expediente de ${pet.nombre}`}
                      title="Editar"
                    >
                      <Edit2 size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(pet.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      aria-label={`Eliminar expediente de ${pet.nombre}`}
                      title="Eliminar"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <PetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateOrUpdate}
          petToEdit={editingPet}
          key={editingPet?.id ?? 'new'}
        />
      )}
    </div>
  );
};
