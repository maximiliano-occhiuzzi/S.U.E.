import { useEffect, useState, type FormEvent } from 'react';
import { Users, Plus, X, KeyRound, RotateCcw, UserX, UserCheck, Loader2 } from 'lucide-react';
import api from '@/services/api';
import StatusOverlay from '@/components/StatusOverlay';

type Rol = 'directivo' | 'docente';

type Usuario = {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean | 0 | 1;
  tiene_pin: boolean | 0 | 1;
  created_at: string;
};

const ROLES: Rol[] = ['directivo', 'docente'];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'docente' as Rol });
  const [createPhase, setCreatePhase] = useState<'idle' | 'loading' | 'success'>('idle');

  const [passwordFor,  setPasswordFor]  = useState<Usuario | null>(null);
  const [newPassword,  setNewPassword]  = useState('');

  const cargar = () => {
    setLoading(true);
    api.get('/api/usuarios')
      .then(({ data }) => setUsuarios(data?.usuarios ?? []))
      .catch(() => setError('No se pudo cargar la lista de usuarios.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const crearUsuario = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    setCreatePhase('loading');
    try {
      await api.post('/api/usuarios', form);
      setCreatePhase('success');
      await new Promise(resolve => setTimeout(resolve, 900));
      setShowForm(false);
      setForm({ nombre: '', email: '', password: '', rol: 'docente' });
      cargar();
    } catch (err: any) {
      setFormError(err?.response?.data?.mensaje ?? 'No se pudo crear el usuario.');
    } finally {
      setSaving(false);
      setCreatePhase('idle');
    }
  };

  const cambiarRol = async (u: Usuario, rol: Rol) => {
    await api.patch(`/api/usuarios/${u.id_usuario}`, { rol });
    cargar();
  };

  const toggleActivo = async (u: Usuario) => {
    if (u.activo) {
      if (!confirm(`¿Dar de baja a ${u.nombre}? Podrás reactivarlo después.`)) return;
      await api.delete(`/api/usuarios/${u.id_usuario}`);
    } else {
      await api.patch(`/api/usuarios/${u.id_usuario}`, { activo: true });
    }
    cargar();
  };

  const resetPin = async (u: Usuario) => {
    if (!confirm(`¿Resetear el PIN de ${u.nombre}? Deberá configurar uno nuevo al ingresar.`)) return;
    await api.post(`/api/usuarios/${u.id_usuario}/reset-pin`);
    cargar();
  };

  const cambiarPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordFor) return;
    setSaving(true);
    setFormError(null);
    try {
      await api.patch(`/api/usuarios/${passwordFor.id_usuario}/password`, { password: newPassword });
      setPasswordFor(null);
      setNewPassword('');
    } catch (err: any) {
      setFormError(err?.response?.data?.mensaje ?? 'No se pudo cambiar la contraseña.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel usuarios-panel full-span">
      <div className="panel-heading">
        <div className="section-number violet"><Users size={16} /></div>
        <div>
          <h2>Usuarios</h2>
          <p>Alta y gestión de directivos y docentes del sistema.</p>
        </div>
        <button className="send-button usuarios-new-btn" type="button" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {error && <p className="login-error">{error}</p>}

      <div className="history-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>PIN</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="table-empty"><Loader2 className="spin-icon" size={20} /> Cargando...</td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan={6} className="table-empty"><Users size={22} /> No hay usuarios cargados</td></tr>
            ) : usuarios.map(u => (
              <tr key={u.id_usuario}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    className="rol-select"
                    value={u.rol}
                    onChange={e => void cambiarRol(u, e.target.value as Rol)}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td>{u.tiene_pin ? 'Sí' : 'No configurado'}</td>
                <td>
                  <span className={`status-pill ${u.activo ? '' : 'inactive'}`}>
                    {u.activo ? 'Activo' : 'Dado de baja'}
                  </span>
                </td>
                <td className="usuarios-actions">
                  <button type="button" title="Resetear PIN" onClick={() => void resetPin(u)}><RotateCcw size={15} /></button>
                  <button type="button" title="Cambiar contraseña" onClick={() => setPasswordFor(u)}><KeyRound size={15} /></button>
                  <button type="button" title={u.activo ? 'Dar de baja' : 'Reactivar'} onClick={() => void toggleActivo(u)}>
                    {u.activo ? <UserX size={15} /> : <UserCheck size={15} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo usuario</h3>
              <button type="button" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={crearUsuario} className="incident-form">
              <label className="field-label">
                Nombre completo
                <input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
              </label>
              <label className="field-label">
                Email institucional
                <input required type="email" placeholder="nombre@fatimarem.edu.ar" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <span>Debe ser @fatimarem.edu.ar</span>
              </label>
              <label className="field-label">
                Contraseña provisoria
                <input required type="password" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </label>
              <label className="field-label">
                Rol
                <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value as Rol })}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              {formError && <p className="login-error">{formError}</p>}
              <button className="send-button" type="submit" disabled={saving}>
                {saving ? 'Creando...' : 'Crear usuario'}
              </button>
            </form>
          </div>
        </div>
      )}

      {passwordFor && (
        <div className="modal-overlay" onClick={() => setPasswordFor(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cambiar contraseña — {passwordFor.nombre}</h3>
              <button type="button" onClick={() => setPasswordFor(null)}><X size={18} /></button>
            </div>
            <form onSubmit={cambiarPassword} className="incident-form">
              <label className="field-label">
                Nueva contraseña
                <input required type="password" minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </label>
              {formError && <p className="login-error">{formError}</p>}
              <button className="send-button" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}

      <StatusOverlay
        show={createPhase !== 'idle'}
        phase={createPhase === 'loading' ? 'loading' : 'success'}
        title={createPhase === 'loading' ? 'Guardando usuario' : 'Usuario creado'}
        subtitle={createPhase === 'loading' ? 'Espere por favor...' : 'El usuario fue agregado con éxito'}
      />
    </section>
  );
}
