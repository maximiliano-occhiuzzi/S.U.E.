import { ChevronDown, ClipboardList, Eye } from 'lucide-react';
import { useState } from 'react';
import api from '@/services/api';

export type Simulacro = {
  id_simulacro:      number;
  fecha_inicio:      string;
  fecha_fin?:        string;
  tipo?:             string;
  duracion?:         string;
  total_incidencias?: number;
  estado?:           string;
  directivo?:        string;
  observaciones?:    string;
};

type Incidencia = {
  id_reporte:      number;
  tipo_incidencia: string;
  gravedad:        string;
  estado_sector:   string;
  detalle?:        string;
  fecha_reporte:   string;
  sector?:         string;
  docente?:        string;
};

const GRAVEDAD_COLOR: Record<string, string> = {
  critica:     '#dc2626',
  moderada:    '#d97706',
  informativa: '#16a34a',
};

const ESTADO_LABEL: Record<string, string> = {
  evacuado_ok:  'Evacuado OK',
  en_proceso:   'En proceso',
  peligro:      'Peligro',
};

export default function Historial({ items }: { items: Simulacro[] }) {
  const [open,    setOpen]    = useState<number | null>(null);
  const [incids,  setIncids]  = useState<Record<number, Incidencia[]>>({});
  const [loading, setLoading] = useState<number | null>(null);

  const expand = async (item: Simulacro) => {
    if (open === item.id_simulacro) { setOpen(null); return; }
    setOpen(item.id_simulacro);
    if (!incids[item.id_simulacro]) {
      setLoading(item.id_simulacro);
      try {
        const { data } = await api.get(`/api/incidencias/${item.id_simulacro}`);
        setIncids(prev => ({ ...prev, [item.id_simulacro]: data?.incidencias ?? [] }));
      } catch {}
      finally { setLoading(null); }
    }
  };

  return (
    <section className="panel history-panel">
      <div className="panel-heading">
        <div className="section-number amber">4</div>
        <div>
          <h2>Historial</h2>
          <p>Registro de simulacros realizados y sus detalles.</p>
        </div>
      </div>

      <div className="history-table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Directivo</th>
              <th>Duración</th>
              <th>Incidencias</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-empty">
                  <ClipboardList size={22} />
                  No hay simulacros anteriores
                </td>
              </tr>
            ) : items.map(item => (
              <>
                <tr key={item.id_simulacro} onClick={() => void expand(item)}>
                  <td>#{item.id_simulacro}</td>
                  <td>{new Date(item.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{item.tipo ?? 'simulacro'}</td>
                  <td>{item.directivo ?? '—'}</td>
                  <td>{item.duracion ?? '—'}</td>
                  <td>{item.total_incidencias ?? 0}</td>
                  <td><span className="status-pill">{item.estado ?? 'finalizado'}</span></td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={16} />
                    <ChevronDown size={15} className={open === item.id_simulacro ? 'rotate' : ''} />
                  </td>
                </tr>

                {open === item.id_simulacro && (
                  <tr className="expanded-row" key={`${item.id_simulacro}-detail`}>
                    <td colSpan={8} style={{ padding: '1rem', background: '#f8fafc' }}>
                      {item.observaciones && (
                        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12, fontStyle: 'italic' }}>
                          Observaciones: {item.observaciones}
                        </p>
                      )}

                      {loading === item.id_simulacro ? (
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>Cargando incidencias...</p>
                      ) : (incids[item.id_simulacro] ?? []).length === 0 ? (
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>Sin incidencias registradas.</p>
                      ) : (
                        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' }}>
                              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Tipo</th>
                              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Gravedad</th>
                              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Sector</th>
                              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Docente</th>
                              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Estado</th>
                              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Hora</th>
                              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Detalle</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(incids[item.id_simulacro] ?? []).map(inc => (
                              <tr key={inc.id_reporte} style={{ borderTop: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '6px 8px', textTransform: 'capitalize' }}>
                                  {inc.tipo_incidencia.replace(/_/g, ' ')}
                                </td>
                                <td style={{ padding: '6px 8px' }}>
                                  <span style={{ color: GRAVEDAD_COLOR[inc.gravedad] ?? '#64748b', fontWeight: 600, fontSize: 11 }}>
                                    {inc.gravedad?.toUpperCase()}
                                  </span>
                                </td>
                                <td style={{ padding: '6px 8px' }}>{inc.sector ?? '—'}</td>
                                <td style={{ padding: '6px 8px' }}>{inc.docente ?? '—'}</td>
                                <td style={{ padding: '6px 8px' }}>{ESTADO_LABEL[inc.estado_sector] ?? inc.estado_sector}</td>
                                <td style={{ padding: '6px 8px' }}>
                                  {new Date(inc.fecha_reporte).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td style={{ padding: '6px 8px', color: '#64748b', fontStyle: 'italic' }}>
                                  {inc.detalle ?? '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}