
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { useUser, mapDbUserToAppUser, findUserInTables } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { User } from '../types';

const Login = () => {
  const navigate = useNavigate();
  const { manualLogin } = useUser();
  const { t } = useSettings();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isUnconfirmed, setIsUnconfirmed] = useState(false);
  
  const [isRecovery, setIsRecovery] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");

  const handleResendEmail = async () => {
    if (!email) {
      setErrorMessage("Por favor, introduce tu correo electrónico primero.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: 'https://partners.fundswin.ai/#/login'
        }
      });
      if (error) throw error;
      setRecoveryMessage("Correo de confirmación re-enviado. Por favor, revisa tu bandeja de entrada (y la carpeta de SPAM).");
      setIsUnconfirmed(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Error al re-enviar el correo.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setIsUnconfirmed(false);
    setRecoveryMessage("");

    try {
      let userData = null;
      let authUserId = null;

      // 1. GESTIÓN DE CREDENCIALES (Con Bypass para Usuarios Demo)
      const demoAccounts: Record<string, any> = {
        'prescriptor@redes.ai': { id: '00000000-0000-4000-a000-000000000001', nivel: 1, table: 'Prescritor', nombre: 'Test Prescriptor' },
        'colaborador@redes.ai': { id: '00000000-0000-4000-a000-000000000002', nivel: 2, table: 'Colaborador', nombre: 'Test Colaborador' },
        'delegado@redes.ai': { id: '00000000-0000-4000-a000-000000000003', nivel: 3, table: 'Delegado_Sin_Redaccion', nombre: 'Test Delegado' },
        'franquicia@redes.ai': { id: '00000000-0000-4000-a000-000000000004', nivel: 4, table: 'Delegado_Oficina_Tecnica', nombre: 'Test Franquicia' }
      };

      const lowerEmail = email.toLowerCase().trim();
      if (demoAccounts[lowerEmail] && password === 'Redes2024!') {
          const acc = demoAccounts[lowerEmail];
          authUserId = acc.id;
          
          // Construct demo user data in-place to avoid DB fetching issues
          userData = {
              id: authUserId,
              nombre_completo: acc.nombre,
              email: lowerEmail,
              correo: lowerEmail,
              telefono: '600000000',
              nivel_elegido: acc.nivel,
              contrasena: 'Redes2024!',
              estado_actual: 'producción activa',
              application_status: 'approved',
              contract_signed: true,
              m1_completed: true, m2_completed: true, m3_completed: true, m4_completed: true, m5_completed: true,
              test_passed: true
          };

          // Also try to insert in background for persistence if RLS allows, but don't block
          supabase.from(acc.table).upsert({
                id: authUserId,
                nombre_completo: acc.nombre,
                email: lowerEmail,
                telefono: '600000000',
                nivel_elegido: acc.nivel,
                contrasena: 'Redes2024!',
                estado_actual: 'producción activa',
                application_status: 'approved',
                contract_signed: true
          }).then();

      } else if (email.trim() === 'admin@redescomerciales.ai' && password === 'admin123') {
          authUserId = '00000000-0000-0000-0000-000000000000'; 
      } else {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
          
          if (authError) {
              if (authError.message.toLowerCase().includes("email not confirmed") || authError.message.toLowerCase().includes("confirm")) {
                  setIsUnconfirmed(true);
                  throw new Error("Debes confirmar tu correo electrónico para poder acceder.");
              }
              throw new Error("Credenciales incorrectas. Por favor, revisa tus datos.");
          }
          authUserId = authData.user.id;
      }

      // 2. BUSQUEDA DE DATOS EN TODAS LAS TABLAS (Si no es demo/admin bypass)
      if (!userData) {
          const result = await findUserInTables(authUserId);
          if (result) {
              userData = result.data;
          }
      }

      if (!userData && email === 'admin@redescomerciales.ai') {
          userData = {
              id: authUserId,
              nombre_completo: 'Administrador General',
              correo: 'admin@redescomerciales.ai',
              nivel_elegido: 4,
              m1_completed: true, m2_completed: true, m3_completed: true, m4_completed: true, m5_completed: false,
              contract_signed: false,
              estado_actual: 'en formación'
          };
      }

      if (!userData) throw new Error("No se ha encontrado tu perfil. Contacta con soporte.");

      const userAppObject = mapDbUserToAppUser(userData);

      manualLogin(userAppObject);
      
      if (userAppObject.is_admin_session) {
        navigate('/admin');
      } else {
        navigate('/portal');
      }

    } catch (err: any) {
      setErrorMessage(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setErrorMessage(t('login.recovery_error_email')); return; }
    setLoading(true);
    setErrorMessage("");
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
        setRecoveryMessage(t('login.recovery_success'));
    } catch (err: any) {
        setErrorMessage(err.message || "Error.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-brand-light dark:bg-brand-darkBg flex items-center justify-center py-12 px-4 transition-colors">
      <div className="max-w-md w-full space-y-10 bg-white dark:bg-brand-darkCard p-10 md:p-12 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="text-center">
            <div className="mx-auto mb-8 flex flex-col items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-white shadow-sm overflow-hidden">
                  <svg viewBox="0 0 100 100" className="w-10 h-10">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                    <line x1="50" y1="25" x2="30" y2="45" stroke="#1D5A96" strokeWidth="2.5" />
                    <line x1="50" y1="25" x2="70" y2="45" stroke="#1D5A96" strokeWidth="2.5" />
                    <line x1="30" y1="45" x2="50" y2="75" stroke="#1D5A96" strokeWidth="2.5" />
                    <line x1="70" y1="45" x2="50" y2="75" stroke="#1D5A96" strokeWidth="2.5" />
                    
                    <circle cx="30" cy="45" r="8" fill="#E31E24" />
                    <circle cx="70" cy="45" r="8" fill="#E31E24" />
                    <circle cx="50" cy="75" r="10" fill="#E31E24" />
                    
                    <circle cx="50" cy="25" r="4" fill="#1D5A96" />
                    <circle cx="30" cy="45" r="3" fill="#1D5A96" />
                    <circle cx="70" cy="45" r="3" fill="#1D5A96" />
                    <circle cx="50" cy="75" r="3" fill="#1D5A96" />
                    <circle cx="82" cy="60" r="4" fill="#1D5A96" />
                  </svg>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-3xl font-black tracking-tighter text-brand-dark dark:text-white leading-none">
                    Redes<span className="text-brand-primary">comerciales.ai</span>
                  </span>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.15em] mt-1">
                    TRANSFORMA COLABORADORES EN UNA RED DE VENTAS ACTIVA
                  </span>
                </div>
              </div>
            </div>
          <h2 className="text-3xl font-extrabold text-brand-dark dark:text-white tracking-tight mb-3 leading-tight">
            {isRecovery ? t('login.recovery_title') : t('login.title')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium px-4">
            {isRecovery ? t('login.recovery_subtitle') : t('login.subtitle')}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={isRecovery ? handleRecovery : handleLogin}>
          <div className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-brand-dark dark:text-gray-300 mb-2 ml-1">{t('login.email')}</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>
                    </span>
                    <input type="email" required className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-brand-darkBg border border-gray-200 dark:border-gray-700 dark:text-white rounded-lg focus:ring-1 focus:ring-brand-primary outline-none text-sm transition-all" placeholder={t('login.email_placeholder')} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
            </div>

            {!isRecovery && (
                <div>
                    <label className="block text-sm font-bold text-brand-dark dark:text-gray-300 mb-2 ml-1">{t('login.password')}</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </span>
                        <input type={showPassword ? "text" : "password"} required className="block w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-brand-darkBg border border-gray-200 dark:border-gray-700 dark:text-white rounded-lg focus:ring-1 focus:ring-brand-primary outline-none text-sm transition-all" placeholder={t('login.pass_placeholder')} value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="button" className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-brand-primary" onClick={() => setShowPassword(!showPassword)}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                    </div>
                </div>
            )}
          </div>

          {errorMessage && (
            <div className={`p-4 rounded-xl border flex flex-col gap-2 ${isUnconfirmed ? 'bg-brand-primary/5 border-brand-primary/20' : 'bg-red-50 border-red-100'}`}>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600">
                        {isUnconfirmed ? 'Confirmación Pendiente' : 'Error'}
                    </span>
                </div>
                <p className={`text-xs font-bold leading-tight ${isUnconfirmed ? 'text-brand-dark dark:text-gray-200' : 'text-red-600'}`}>
                    {errorMessage}
                </p>
                {isUnconfirmed && (
                    <div className="mt-2 space-y-3">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                            Por favor, <strong>revisa tu carpeta de SPAM</strong> si no encuentras el correo en la bandeja de entrada.
                        </p>
                        <button 
                            type="button" 
                            onClick={handleResendEmail}
                            disabled={loading}
                            className="text-[10px] bg-brand-primary text-white px-3 py-1.5 rounded-md font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                        >
                            {loading ? "Re-enviando..." : "Re-enviar correo de confirmación"}
                        </button>
                    </div>
                )}
            </div>
          )}

          {recoveryMessage && <div className="text-brand-success text-[10px] font-bold text-center bg-brand-success/10 p-3 rounded-lg border border-brand-success/20 uppercase tracking-widest">{recoveryMessage}</div>}

          <div className="pt-2">
            <button type="submit" disabled={loading} className="w-full py-4 bg-brand-primary text-white font-bold rounded-lg shadow-xl hover:brightness-110 active:scale-95 transition-all text-md uppercase tracking-widest">
              {loading ? "..." : (isRecovery ? t('matcher.modal.btn') : t('login.btn'))}
            </button>
          </div>

          <div className="space-y-4 text-center pt-2">
             {!isRecovery && (
                <>
                    <p className="text-[12px] text-gray-500 font-medium">
                        {t('login.new')}{' '}
                        <Link to="/registro" className="text-brand-secondary font-bold hover:underline">{t('login.register_link')}</Link>
                    </p>
                    <button type="button" onClick={() => setIsRecovery(true)} className="text-brand-primary text-xs font-bold hover:underline">{t('login.forgot')}</button>
                </>
             )}
             {isRecovery && <button type="button" onClick={() => setIsRecovery(false)} className="text-brand-primary text-xs font-bold hover:underline">{t('login.back')}</button>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
