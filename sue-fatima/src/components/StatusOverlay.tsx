import { Check } from 'lucide-react';

type Props = {
  show: boolean;
  phase: 'loading' | 'success';
  title: string;
  subtitle: string;
};

export default function StatusOverlay({ show, phase, title, subtitle }: Props) {
  if (!show) return null;

  return (
    <div className="status-overlay">
      <div className="status-card">
        <div className={`status-icon ${phase}`}>
          {phase === 'loading' ? <span className="status-spinner" /> : <Check size={30} strokeWidth={3} />}
        </div>
        <strong>{title}</strong>
        <span className={`status-subtitle ${phase}`}>{subtitle}</span>
      </div>
    </div>
  );
}
