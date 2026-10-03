import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import api from '@/services/api';
import { PanelHeading, IncidentIcon } from './SimulacroControl';
import { useCatalogo, type Sector, type TipoIncidencia } from '@/hooks/useCatalogo';

const ICONOS = ['flame', 'cloud', 'barrier', 'person', 'zap', 'droplet', 'wind', 'alert', 'heart', 'lock', 'flask', 'dots'];
const COLORES = [
  { id: 'red', hex: '#ef4444' }, { id: 'amber', hex: '#f59e0b' }, { id: 'orange', hex: '#f97316' },
  { id: 'blue', hex: '#3b82f6' }, { id: 'green', hex: '#22c55e' },
];
const GRAVEDADES = [
  { id: 'critica', label: 'Crítica' }, { id: 'moderada', label: 'Moderada' }, { id: 'informativa', label: 'Informativa' },
];

const msgError = (e: unknown) =>
  (e as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje ?? 'No se pudo completar la acción.';

/** Botón de borrar con doble toque (evita borrar por error). Se desarma solo. */
function BotonBorrar({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  const [armado, setArmado] = useState(false);
  return (
    <button
      type="button" disabled={disabled}
      className={`cat-btn danger ${armado ? 'armado' : ''}`}
      aria-label={armado ? 'Confirmar eliminación' : 'Eliminar'}
      onBlur={() => setArmado(false)}
      onClick={() => { if (!armado) { setArmado(true); window.setTimeout(() => setArmado(false), 3500); } else { setArmado(false); onConfirm(); } }}
    >
      {armado ? <>¿Seguro?</> : <Trash2 size={16} />}
    </button>
  );
}

function Interruptor({ activo, onChange, label }: { activo: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={activo} aria-label={label}
            className={`cat-switch ${activo ? 'on' : ''}`} onClick={() => onChange(!activo)}><i /></button>
  );
}

export default function Catalogo({ parte = 'todo' }: { parte?: 'todo' | 'sectores' | 'tipos' }) {
  const { todosSectores, todosTipos, recargar } = useCatalogo();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const correr = async (accion: () => Promise<{ data?: { resultado?: string } } | void>, okTexto: string) => {
    setBusy(true); setAviso(null);
    try {
      const r = await accion();
      const res = (r as { data?: { resultado?: string } } | undefined)?.data?.resultado;
      const extra = res === 'desactivado' ? ' (ya tenía incidencias, así que quedó desactivado y el historial se conserva)' : '';
      setAviso({ ok: true, texto: okTexto + extra });
      await recargar();
      window.setTimeout(() => setAviso(null), 5000);
      return true;
    } catch (e) {
      setAviso({ ok: false, texto: msgError(e) });
      return false;
    } finally { setBusy(false); }
  };

  // ── Sectores ─────────────────────────────────────────────────────────────
  const [sNombre, setSNombre] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sEdit, setSEdit] = useState<{ id: number; nombre: string; descripcion: string } | null>(null);

  const agregarSector = async () => {
    const ok = await correr(() => api.post('/api/catalogo/sectores', { nombre: sNombre, descripcion: sDesc }), 'Sector agregado.');
    if (ok) { setSNombre(''); setSDesc(''); }
  };
  const guardarSector = async () => {
    if (!sEdit) return;
    const ok = await correr(() => api.patch(`/api/catalogo/sectores/${sEdit.id}`, { nombre: sEdit.nombre, descripcion: sEdit.descripcion }), 'Sector actualizado.');
    if (ok) setSEdit(null);
  };

  // ── Tipos de incidencia ──────────────────────────────────────────────────
  type FormTipo = { codigo?: string; nombre: string; gravedad: string; icono: string; color: string };
  const VACIO: FormTipo = { nombre: '', gravedad: 'moderada', icono: 'alert', color: 'amber' };
  const [nuevo, setNuevo] = useState<FormTipo>(VACIO);
  const [tEdit, setTEdit] = useState<FormTipo | null>(null);

  const agregarTipo = async () => {
    const ok = await correr(() => api.post('/api/catalogo/tipos', nuevo), 'Tipo de incidencia agregado.');
    if (ok) setNuevo(VACIO);
  };
  const guardarTipo = async () => {
    if (!tEdit?.codigo) return;
    const { codigo, ...datos } = tEdit;
    const ok = await correr(() => api.patch(`/api/catalogo/tipos/${codigo}`, datos), 'Tipo actualizado.');
    if (ok) setTEdit(null);
  };

  // OJO: función que devuelve JSX (no un componente): si fuera componente se recrearía en cada
  // tecla y el campo de texto perdería el foco.
  const selector = (f: FormTipo, set: (v: FormTipo) => void) => (
    <div className="cat-tipo-form">
      <input className="cat-input" placeholder="Nombre (ej: Fuga de gas)" maxLength={60}
             value={f.nombre} onChange={(e) => set({ ...f, nombre: e.target.value })} />
      <div className="cat-row-wrap">
        <label className="cat-mini">Gravedad
          <select className="cat-input" value={f.gravedad} onChange={(e) => set({ ...f, gravedad: e.target.value })}>
            {GRAVEDADES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </label>
        <div className="cat-mini">Color
          <div className="cat-colors">
            {COLORES.map((c) => (
              <button type="button" key={c.id} aria-label={c.id} style={{ background: c.hex }}
                      className={f.color === c.id ? 'sel' : ''} onClick={() => set({ ...f, color: c.id })} />
            ))}
          </div>
        </div>
      </div>
      <div className="cat-mini">Ícono
        <div className="cat-icons">
          {ICONOS.map((i) => (
            <button type="button" key={i} aria-label={i} className={f.icono === i ? 'sel' : ''} onClick={() => set({ ...f, icono: i })}>
              <IncidentIcon type={i} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section className="panel cat-panel">
      {parte === 'todo' && <PanelHeading number="5" title="Sectores e incidentes" subtitle="Lo que cargues acá lo ven todos los dispositivos al instante." color="amber" />}
      {parte !== 'todo' && <p className="cat-sub">Lo que cargues acá lo ven todos los dispositivos al instante.</p>}

      {aviso && <div className={`cat-aviso ${aviso.ok ? 'ok' : 'error'}`} role="status">{aviso.texto}</div>}

      {parte !== 'tipos' && (<>
      <h3 className="cat-title">Sectores <span>{todosSectores.filter((s) => s.activo).length}</span></h3>
      <div className="cat-add">
        <input className="cat-input" placeholder="Nombre del sector (ej: Gimnasio)" maxLength={100}
               value={sNombre} onChange={(e) => setSNombre(e.target.value)} />
        <input className="cat-input" placeholder="Descripción (opcional)" maxLength={300}
               value={sDesc} onChange={(e) => setSDesc(e.target.value)} />
        <button type="button" className="cat-add-btn" disabled={busy || sNombre.trim().length < 2} onClick={() => void agregarSector()}>
          <Plus size={17} /> Agregar sector
        </button>
      </div>

      <ul className="cat-list">
        {todosSectores.map((s: Sector) => (
          <li key={s.id_sector} className={s.activo ? '' : 'inactivo'}>
            {sEdit?.id === s.id_sector ? (
              <div className="cat-edit">
                <input className="cat-input" value={sEdit.nombre} maxLength={100} onChange={(e) => setSEdit({ ...sEdit, nombre: e.target.value })} />
                <input className="cat-input" value={sEdit.descripcion} maxLength={300} placeholder="Descripción" onChange={(e) => setSEdit({ ...sEdit, descripcion: e.target.value })} />
                <div className="cat-actions">
                  <button type="button" className="cat-btn ok" disabled={busy} onClick={() => void guardarSector()} aria-label="Guardar"><Check size={16} /></button>
                  <button type="button" className="cat-btn" onClick={() => setSEdit(null)} aria-label="Cancelar"><X size={16} /></button>
                </div>
              </div>
            ) : (
              <>
                <div className="cat-info">
                  <strong>{s.nombre}</strong>
                  <span>{s.activo ? (s.descripcion || '—') : 'Desactivado'}</span>
                </div>
                <div className="cat-actions">
                  <Interruptor activo={s.activo} label={`Sector ${s.nombre} activo`}
                               onChange={(v) => void correr(() => api.patch(`/api/catalogo/sectores/${s.id_sector}`, { activo: v }), v ? 'Sector activado.' : 'Sector desactivado.')} />
                  <button type="button" className="cat-btn" aria-label="Editar"
                          onClick={() => setSEdit({ id: s.id_sector, nombre: s.nombre, descripcion: s.descripcion ?? '' })}><Pencil size={16} /></button>
                  <BotonBorrar disabled={busy} onConfirm={() => void correr(() => api.delete(`/api/catalogo/sectores/${s.id_sector}`), 'Sector eliminado.')} />
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      </>)}

      {parte !== 'sectores' && (<>
      <h3 className="cat-title">Tipos de incidencia <span>{todosTipos.filter((t) => t.activo).length}</span></h3>
      <div className="cat-add tipo">
        {selector(nuevo, setNuevo)}
        <button type="button" className="cat-add-btn" disabled={busy || nuevo.nombre.trim().length < 2} onClick={() => void agregarTipo()}>
          <Plus size={17} /> Agregar tipo de incidencia
        </button>
      </div>

      <ul className="cat-list">
        {todosTipos.map((t: TipoIncidencia) => (
          <li key={t.codigo} className={t.activo ? '' : 'inactivo'}>
            {tEdit?.codigo === t.codigo ? (
              <div className="cat-edit">
                {selector(tEdit, setTEdit)}
                <div className="cat-actions">
                  <button type="button" className="cat-btn ok" disabled={busy} onClick={() => void guardarTipo()} aria-label="Guardar"><Check size={16} /></button>
                  <button type="button" className="cat-btn" onClick={() => setTEdit(null)} aria-label="Cancelar"><X size={16} /></button>
                </div>
              </div>
            ) : (
              <>
                <span className={`cat-ico ${t.color}`}><IncidentIcon type={t.icono} /></span>
                <div className="cat-info">
                  <strong>{t.nombre}</strong>
                  <span>{t.activo ? `Gravedad ${t.gravedad}` : 'Desactivado'}</span>
                </div>
                <div className="cat-actions">
                  {t.codigo !== 'otro' && (
                    <Interruptor activo={t.activo} label={`Tipo ${t.nombre} activo`}
                                 onChange={(v) => void correr(() => api.patch(`/api/catalogo/tipos/${t.codigo}`, { activo: v }), v ? 'Tipo activado.' : 'Tipo desactivado.')} />
                  )}
                  <button type="button" className="cat-btn" aria-label="Editar"
                          onClick={() => setTEdit({ codigo: t.codigo, nombre: t.nombre, gravedad: t.gravedad, icono: t.icono, color: t.color })}><Pencil size={16} /></button>
                  {t.codigo !== 'otro' && (
                    <BotonBorrar disabled={busy} onConfirm={() => void correr(() => api.delete(`/api/catalogo/tipos/${t.codigo}`), 'Tipo eliminado.')} />
                  )}
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      </>)}
    </section>
  );
}
