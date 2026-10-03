import type { CSSProperties } from 'react';

/** Bloque gris animado que reemplaza al contenido mientras carga (efecto "esqueleto"). */
export function Skeleton({
  w = '100%',
  h = 14,
  r = 8,
  style,
}: {
  w?: number | string;
  h?: number | string;
  r?: number | string;
  style?: CSSProperties;
}) {
  return <span className="skeleton" aria-hidden="true" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/** Tarjetas de incidencia en carga (Estado en vivo). */
export function SkeletonCards({ n = 3 }: { n?: number }) {
  return (
    <div className="skeleton-cards" role="status" aria-label="Cargando">
      {Array.from({ length: n }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <Skeleton w={44} h={44} r={12} />
          <div className="skeleton-card-text">
            <Skeleton w="55%" h={13} />
            <Skeleton w="35%" h={11} />
          </div>
          <Skeleton w={42} h={13} />
        </div>
      ))}
    </div>
  );
}

/** Filas de tabla en carga (Historial). */
export function SkeletonRows({ rows = 5, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="skeleton-row">
          {Array.from({ length: cols }, (_, c) => (
            <td key={c}><Skeleton h={12} w={c === 0 ? 28 : c === 1 ? 110 : '70%'} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}
