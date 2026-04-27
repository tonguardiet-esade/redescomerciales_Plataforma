import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ text: "Las contraseñas no coinciden", type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // 1. Actualizar en Supabase Auth (Sistema de Seguridad)
      const { data, error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;

      // 2. Sincronizar con tu Tabla Personalizada (Para que se vea en tu base de datos)
      const user = data.user;
      if (user) {
         const tables = ["Prescritor", "Colaborador", "Delegado_Sin_Redaccion", "Delegado_Oficina_Tecnica"];
         
         // Buscamos en qué tabla está el usuario y actualizamos su contraseña allí también
         for (const table of tables) {
            // Verificamos si el usuario existe en esta tabla
            const { count } = await supabase
                .from(table)
                .select('id', { count: 'exact', head: true })
                .eq('id', user.id);
            
            if (count && count > 0) {
                // Si existe, actualizamos la columna 'contrasena'
                const { error: dbError } = await supabase
                    .from(table)
                    .update({ contrasena: password })
                    .eq('id', user.id);
                
                if (dbError) {
                    console.error(`Error actualizando tabla ${table}`, dbError);
                } else {
                    console.log(`Contraseña sincronizada correctamente en tabla ${table}`);
                }
                break; // Ya lo encontramos, no hace falta seguir buscando
            }
         }
      }

      setMessage({ text: "Contraseña actualizada correctamente. Redirigiendo...", type: 'success' });
      
      setTimeout(() => {
        navigate('/portal');
      }, 2000);

    } catch (err: any) {
      setMessage({ text: err.message || "Error al actualizar contraseña", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-card">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 bg-brand-success/10 rounded-full flex items-center justify-center mb-4 text-brand-success">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-brand-dark">Nueva Contraseña</h2>
          <p className="text-gray-500 text-sm mt-2">Introduce tu nueva contraseña para recuperar el acceso.</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repetir Contraseña</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'success' ? 'bg-brand-success/10 text-brand-success' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-primary text-white font-bold rounded-lg shadow-md hover:bg-opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? 'Actualizando...' : 'Guardar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;