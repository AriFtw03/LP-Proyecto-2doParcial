import { useState } from 'react';
import { Sidebar } from './components/common/Sidebar';
import type { ViewType } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { PetCatalog } from './components/pets/PetCatalog';
import { PetInventory } from './components/pets/PetInventory';
import { AdoptionList } from './components/adoptions/AdoptionList';
import { ShiftCalendar } from './components/shifts/ShiftCalendar';
import { AdoptionModal } from './components/adoptions/AdoptionModal';
import type { Pet } from './types/pet';
import type { AdoptionInput } from './types/adoption';
import { adoptionService } from './services/adoptionService';

export function App() {
  const [currentView, setCurrentView] = useState<ViewType>('catalog');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isAdoptionModalOpen, setIsAdoptionModalOpen] = useState(false);
  const [catalogRefreshKey, setCatalogRefreshKey] = useState(0);

  const handleOpenAdoptionModal = (pet: Pet) => {
    setSelectedPet(pet);
    setIsAdoptionModalOpen(true);
  };

  const handleCloseAdoptionModal = () => {
    setSelectedPet(null);
    setIsAdoptionModalOpen(false);
  };

  const handleCreateAdoption = async (data: AdoptionInput) => {
    await adoptionService.create(data);
    setCatalogRefreshKey((prev) => prev + 1);
  };

  const getViewConfig = () => {
    switch (currentView) {
      case 'catalog':
        return {
          title: 'Catálogo de Mascotas para Adopción',
          subtitle: 'Explora los animales disponibles y postula para su adopción.',
        };
      case 'inventory':
        return {
          title: 'Expedientes Médicos y de Salud',
          subtitle: 'Registro clínico, fichas de ingreso y estado de las mascotas rescatadas.',
        };
      case 'adoptions':
        return {
          title: 'Gestión de Solicitudes de Adopción',
          subtitle: 'Revisión y transición de estados de solicitudes ciudadanas.',
        };
      case 'shifts':
        return {
          title: 'Calendario de Turnos de Voluntariado',
          subtitle: 'Asignación de tareas operativas y control de cuidadores.',
        };
    }
  };

  const viewConfig = getViewConfig();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar currentView={currentView} onSelectView={setCurrentView} />

      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Header title={viewConfig.title} subtitle={viewConfig.subtitle} />

        <div className="flex-1">
          {currentView === 'catalog' && (
            <PetCatalog key={catalogRefreshKey} onAdoptClick={handleOpenAdoptionModal} />
          )}
          {currentView === 'inventory' && <PetInventory />}
          {currentView === 'adoptions' && <AdoptionList />}
          {currentView === 'shifts' && <ShiftCalendar />}
        </div>
      </main>

      {isAdoptionModalOpen && selectedPet && (
        <AdoptionModal
          isOpen={isAdoptionModalOpen}
          onClose={handleCloseAdoptionModal}
          pet={selectedPet}
          onSubmit={handleCreateAdoption}
          key={selectedPet.id}
        />
      )}
    </div>
  );
}

export default App;
