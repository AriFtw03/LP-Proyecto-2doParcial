// APORTE: MATIAS COLLAGUAZO
import React, { useState, useId } from 'react';
import type { Pet } from '../../types/pet';
import type { AdoptionInput, HousingType, ExperienceLevel } from '../../types/adoption';
import { Modal } from '../common/Modal';
import { User, Home, Heart, Phone, Mail, MapPin, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdoptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet | null;
  onSubmit: (data: AdoptionInput) => Promise<void>;
}

export const AdoptionModal: React.FC<AdoptionModalProps> = ({ isOpen, onClose, pet, onSubmit }) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudadDireccion, setCiudadDireccion] = useState('');
  const [tipoVivienda, setTipoVivienda] = useState<HousingType>('casa_propia');
  const [tienePatioEspacio, setTienePatioEspacio] = useState(false);
  const [otrasMascotas, setOtrasMascotas] = useState(false);
  const [descripcionOtrasMascotas, setDescripcionOtrasMascotas] = useState('');
  const [experienciaPrevia, setExperienciaPrevia] = useState<ExperienceLevel>('ha_tenido_antes');
  const [motivoAdopcion, setMotivoAdopcion] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const addressId = useId();
  const housingId = useId();
  const patioId = useId();
  const otherPetsId = useId();
  const otherPetsDescId = useId();
  const experienceId = useId();
  const motiveId = useId();

  if (!isOpen || !pet) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nombre.trim();
    const cleanCorreo = correo.trim();
    const cleanTelefono = telefono.trim();
    const cleanCiudad = ciudadDireccion.trim();
    const cleanMotivo = motivoAdopcion.trim();
    const cleanDescMascotas = descripcionOtrasMascotas.trim();

    if (!cleanNombre || !cleanCorreo || !cleanTelefono || !cleanCiudad || !cleanMotivo) {
      setError('Por favor completa todos los campos requeridos marcados con (*).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanCorreo)) {
      setError('Ingresa un correo electrónico con formato válido.');
      return;
    }

    const phoneRegex = /^[+0-9\s\-().]{7,20}$/;
    const digitCount = (cleanTelefono.match(/[0-9]/g) || []).length;
    if (!phoneRegex.test(cleanTelefono) || digitCount < 7) {
      setError('Ingresa un número telefónico válido (mínimo 7 dígitos).');
      return;
    }

    if (otrasMascotas && cleanDescMascotas.length > 200) {
      setError('La descripción de otras mascotas no debe superar los 200 caracteres.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit({
        mascota_id: pet.id,
        nombre_solicitante: cleanNombre,
        correo_contacto: cleanCorreo,
        telefono_contacto: cleanTelefono,
        ciudad_direccion: cleanCiudad,
        tipo_vivienda: tipoVivienda,
        tiene_patio_espacio: tienePatioEspacio ? 1 : 0,
        otras_mascotas: otrasMascotas ? 1 : 0,
        descripcion_otras_mascotas: otrasMascotas && cleanDescMascotas ? cleanDescMascotas : null,
        experiencia_previa: experienciaPrevia,
        motivo_adopcion: cleanMotivo,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1600);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al registrar la postulación.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Formulario de Solicitud de Adopción`} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3.5 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-200 flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3.5 bg-emerald-50 text-emerald-700 text-sm rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>¡Solicitud enviada exitosamente! El equipo del refugio revisará tu postulación.</span>
          </div>
        )}

        {/* Resumen de la Mascota */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center relative">
              {pet.foto_url ? (
                <img
                  src={pet.foto_url}
                  alt={pet.nombre}
                  className="w-full h-full object-cover relative z-10"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <span className="text-2xl select-none absolute inset-0 flex items-center justify-center z-0 bg-slate-100">
                {pet.especie.toLowerCase() === 'gato' ? '🐱' : pet.especie.toLowerCase() === 'perro' ? '🐶' : '🐾'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-800 text-base">{pet.nombre}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                  {pet.especie}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Raza: {pet.raza || 'Mestizo'}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 font-semibold shadow-2xs">
              ID #{pet.id}
            </span>
          </div>
        </div>

        {/* BLOQUE 1: Contacto y Residencia */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm pb-2 border-b border-slate-100">
            <User size={17} />
            <h4>1. Datos de Contacto y Residencia</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label htmlFor={nameId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nombre Completo *
              </label>
              <input
                id={nameId}
                type="text"
                required
                maxLength={100}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Carlos Mendoza"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label htmlFor={emailId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mail size={12} className="text-slate-400" />
                Correo Electrónico *
              </label>
              <input
                id={emailId}
                type="email"
                required
                maxLength={100}
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="Ej: cmendoza@ejemplo.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor={phoneId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone size={12} className="text-slate-400" />
                Teléfono de Contacto *
              </label>
              <input
                id={phoneId}
                type="tel"
                required
                maxLength={20}
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: +593 99 123 4567"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label htmlFor={addressId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin size={12} className="text-slate-400" />
                Ciudad / Dirección *
              </label>
              <input
                id={addressId}
                type="text"
                required
                maxLength={150}
                value={ciudadDireccion}
                onChange={(e) => setCiudadDireccion(e.target.value)}
                placeholder="Ej: Guayaquil, Cdla. Alborada"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor={housingId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Home size={12} className="text-slate-400" />
              Tipo de Vivienda *
            </label>
            <select
              id={housingId}
              value={tipoVivienda}
              onChange={(e) => setTipoVivienda(e.target.value as HousingType)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="casa_propia">Casa Propia</option>
              <option value="casa_alquiler">Casa en Alquiler</option>
              <option value="departamento_propio">Departamento Propio</option>
              <option value="departamento_alquiler">Departamento en Alquiler</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        {/* BLOQUE 2: Entorno y Convivencia */}
        <div className="space-y-3.5 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm pb-2 border-b border-slate-100">
            <Sparkles size={17} />
            <h4>2. Entorno y Tenencia Responsable</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label
              htmlFor={patioId}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                tienePatioEspacio ? 'bg-teal-50/60 border-teal-300' : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <input
                id={patioId}
                type="checkbox"
                checked={tienePatioEspacio}
                onChange={(e) => setTienePatioEspacio(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 block">Patio o Espacio Abierto Seguro</span>
                <span className="text-slate-500">¿La vivienda cuenta con patio, terraza o jardín cerrado?</span>
              </div>
            </label>

            <label
              htmlFor={otherPetsId}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                otrasMascotas ? 'bg-teal-50/60 border-teal-300' : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <input
                id={otherPetsId}
                type="checkbox"
                checked={otrasMascotas}
                onChange={(e) => setOtrasMascotas(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 block">Convivencia con Otras Mascotas</span>
                <span className="text-slate-500">¿Conviven actualmente otros animales en el domicilio?</span>
              </div>
            </label>
          </div>

          {/* Campo condicional si tiene otras mascotas */}
          {otrasMascotas && (
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 animate-fadeIn">
              <label htmlFor={otherPetsDescId} className="block text-xs font-semibold text-amber-900 uppercase tracking-wider mb-1">
                Detalle de las Otras Mascotas
              </label>
              <input
                id={otherPetsDescId}
                type="text"
                maxLength={200}
                value={descripcionOtrasMascotas}
                onChange={(e) => setDescripcionOtrasMascotas(e.target.value)}
                placeholder="Ej: 1 perro criollo de 4 años esterilizado y 1 gato amigable"
                className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <div className="text-right text-[11px] text-amber-700 mt-1">
                {descripcionOtrasMascotas.length}/200 caracteres
              </div>
            </div>
          )}

          <div>
            <label htmlFor={experienceId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Experiencia Previa con Mascotas *
            </label>
            <select
              id={experienceId}
              value={experienciaPrevia}
              onChange={(e) => setExperienciaPrevia(e.target.value as ExperienceLevel)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="primera_vez">Primera vez que tendré una mascota</option>
              <option value="ha_tenido_antes">He tenido mascotas antes con experiencia básica</option>
              <option value="cuidador_experimentado">Cuidador experimentado / con amplia experiencia</option>
            </select>
          </div>
        </div>

        {/* BLOQUE 3: Motivación y Compromiso */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm pb-2 border-b border-slate-100">
            <Heart size={17} />
            <h4>3. Motivación y Compromiso de Cuidado</h4>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor={motiveId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                ¿Por qué deseas adoptar a {pet.nombre}? *
              </label>
              <span
                className={`text-xs font-mono ${
                  motivoAdopcion.trim().length < 20 ? 'text-amber-600 font-medium' : 'text-slate-400'
                }`}
              >
                {motivoAdopcion.length} caracteres {motivoAdopcion.trim().length < 20 ? '(mín. 20 sugerido)' : ''}
              </span>
            </div>
            <textarea
              id={motiveId}
              required
              rows={3}
              value={motivoAdopcion}
              onChange={(e) => setMotivoAdopcion(e.target.value)}
              placeholder="Explica tus motivos, rutina diaria, tiempo disponible para paseos y compromiso con su bienestar veterinario..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-y"
            />
          </div>
        </div>

        {/* Footer y Acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || success}
            className="px-5 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-xs"
          >
            {isSubmitting ? 'Enviando postulación...' : 'Enviar Solicitud de Adopción'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

