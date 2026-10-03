import { useFoto } from '@/hooks/useFoto';

type Props = { nombre?: string; size?: number; className?: string };

/** Círculo con la foto de perfil; si no hay, la inicial del nombre. */
export default function Avatar({ nombre, size = 32, className = '' }: Props) {
  const { url } = useFoto();
  return (
    <span className={`avatar-circle ${className}`} style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {url ? <img src={url} alt="" draggable={false} /> : (nombre?.trim()[0]?.toUpperCase() ?? '?')}
    </span>
  );
}
