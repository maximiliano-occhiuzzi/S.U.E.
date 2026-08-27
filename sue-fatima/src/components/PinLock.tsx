import { LockKeyhole } from 'lucide-react';
export default function PinLock({ onUnlock }: { onUnlock: () => void }) { return <div className="pin-lock"><LockKeyhole size={28} /><h2>Acceso protegido</h2><p>Ingresa tu PIN para continuar.</p><input type="password" inputMode="numeric" placeholder="****" /><button onClick={onUnlock}>Continuar</button></div>; }
