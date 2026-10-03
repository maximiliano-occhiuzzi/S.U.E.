import { MapPin, ShieldAlert } from 'lucide-react';

/** Lugar al que va toda la institución durante un simulacro. Cambiar acá si cambia. */
export const PUNTO_DE_ENCUENTRO = 'Campo deportivo de la institución';

/**
 * Aviso para los DOCENTES mientras hay un simulacro activo: qué hacer y adónde ir.
 * Es fijo y simple a propósito: en una evacuación hay que leerlo de un vistazo.
 */
export default function AvisoEvacuacion({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`evac-aviso ${compact ? 'compact' : ''}`} role="alert" aria-live="polite">
      <div className="evac-aviso-head">
        <span className="evac-aviso-icon"><ShieldAlert size={22} strokeWidth={2.4} /></span>
        <div>
          <small>SIMULACRO EN CURSO</small>
          <strong>Mantené la calma, no entres en pánico</strong>
        </div>
      </div>

      <p>
        Vamos <b>todos</b> al punto de encuentro, <b>con cuidado</b> y siguiendo a quienes guían el simulacro.
      </p>

      <div className="evac-aviso-lugar">
        <MapPin size={18} />
        <span>
          <small>Punto de encuentro</small>
          <b>{PUNTO_DE_ENCUENTRO}</b>
        </span>
      </div>
    </section>
  );
}
