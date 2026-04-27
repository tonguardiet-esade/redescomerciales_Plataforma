
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { User, UserLevel } from '../types';
import { trackRegistration } from '../services/backendEvents';

const countries = [
  { code: 'ES', name: 'España', flag: 'https://flagcdn.com/w20/es.png', prefix: '+34' },
  { code: 'AD', name: 'Andorra', flag: 'https://flagcdn.com/w20/ad.png', prefix: '+376' },
  { code: 'PT', name: 'Portugal', flag: 'https://flagcdn.com/w20/pt.png', prefix: '+351' },
  { code: 'FR', name: 'Francia', flag: 'https://flagcdn.com/w20/fr.png', prefix: '+33' },
  { code: 'IT', name: 'Italia', flag: 'https://flagcdn.com/w20/it.png', prefix: '+39' },
  { code: 'DE', name: 'Alemania', flag: 'https://flagcdn.com/w20/de.png', prefix: '+49' },
  { code: 'GB', name: 'Reino Unido', flag: 'https://flagcdn.com/w20/gb.png', prefix: '+44' },
  { code: 'MX', name: 'México', flag: 'https://flagcdn.com/w20/mx.png', prefix: '+52' },
  { code: 'AR', name: 'Argentina', flag: 'https://flagcdn.com/w20/ar.png', prefix: '+54' },
  { code: 'CO', name: 'Colombia', flag: 'https://flagcdn.com/w20/co.png', prefix: '+57' },
  { code: 'CL', name: 'Chile', flag: 'https://flagcdn.com/w20/cl.png', prefix: '+56' },
  { code: 'PE', name: 'Perú', flag: 'https://flagcdn.com/w20/pe.png', prefix: '+51' },
  { code: 'VE', name: 'Venezuela', flag: 'https://flagcdn.com/w20/ve.png', prefix: '+58' },
  { code: 'EC', name: 'Ecuador', flag: 'https://flagcdn.com/w20/ec.png', prefix: '+593' },
  { code: 'UY', name: 'Uruguay', flag: 'https://flagcdn.com/w20/uy.png', prefix: '+598' },
  { code: 'PY', name: 'Paraguay', flag: 'https://flagcdn.com/w20/py.png', prefix: '+595' },
  { code: 'BO', name: 'Bolivia', flag: 'https://flagcdn.com/w20/bo.png', prefix: '+591' },
  { code: 'PA', name: 'Panamá', flag: 'https://flagcdn.com/w20/pa.png', prefix: '+507' },
  { code: 'CR', name: 'Costa Rica', flag: 'https://flagcdn.com/w20/cr.png', prefix: '+506' },
  { code: 'DO', name: 'Rep. Dominicana', flag: 'https://flagcdn.com/w20/do.png', prefix: '+1' },
  { code: 'SV', name: 'El Salvador', flag: 'https://flagcdn.com/w20/sv.png', prefix: '+503' },
  { code: 'GT', name: 'Guatemala', flag: 'https://flagcdn.com/w20/gt.png', prefix: '+502' },
  { code: 'HN', name: 'Honduras', flag: 'https://flagcdn.com/w20/hn.png', prefix: '+504' },
  { code: 'US', name: 'USA', flag: 'https://flagcdn.com/w20/us.png', prefix: '+1' },
  { code: 'BR', name: 'Brasil', flag: 'https://flagcdn.com/w20/br.png', prefix: '+55' },
];

const Register = () => {
  const navigate = useNavigate();
  const { manualLogin } = useUser();
  const { t } = useSettings();
  
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [nivel, setNivel] = useState("1");
  const [vertical, setVertical] = useState("RedesComerciales.ai");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleResendAfterRegister = async () => {
    setLoading(true);
    setResendMessage("");
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: 'https://portal.redescomerciales.ai/#/login'
        }
      });
      if (error) throw error;
      setResendMessage("Correo re-enviado con éxito.");
    } catch (err: any) {
      setErrorMessage(err.message || "Error al re-enviar.");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: "1", translationKey: "register.role.1", tableName: "Prescritor", available: true },
    { id: "2", translationKey: "register.role.2", tableName: "Colaborador", available: true },
    { id: "3", translationKey: "register.role.3", tableName: "Delegado_Sin_Redaccion", available: true },
    { id: "4", translationKey: "register.role.4", tableName: "Delegado_Oficina_Tecnica", available: true }
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMessage("");
    if (password !== confirmPassword) { setErrorMessage("Las contraseñas no coinciden."); return; }
    setLoading(true);

    try {
      const selectedRole = roles.find(r => r.id === nivel);
      const targetTable = selectedRole?.tableName || "Prescritor";
      const nivelInt = parseInt(nivel);
      const fullPhone = `${selectedCountry.prefix} ${telefono}`;

      //Comprobar si el email ya está registrado
      const { count, error: checkError } = await supabase
        .from(targetTable)
        .select('*', { count: 'exact', head: true })
        .eq('correo', email);

      if (checkError) throw checkError;
      if (count && count > 0) {
        setErrorMessage("Este correo ya está registrado. Por favor, inicia sesión.");
        setLoading(false);
        return;
      }

      const isTestEmail = email.toLowerCase().endsWith('@redescomerciales.ai');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            nombre_completo: nombre, 
            telefono: fullPhone, 
            nivel_seleccionado: selectedRole ? t(selectedRole.translationKey) : "1",
            is_admin: isTestEmail // Mark as admin in metadata
          },
          emailRedirectTo: 'https://portal.redescomerciales.ai/#/login'  
        }
      });

      if (error) throw error;
      const authUser = data.user;
      if (!authUser) throw new Error("No user returned");

      const { error: insertError } = await supabase
        .from(targetTable)
        .insert({
          id: authUser.id,
          nombre_completo: nombre,
          correo: email,
          telefono: fullPhone,
          contrasena: password,
          nivel_elegido: nivelInt,
          estado_actual: isTestEmail ? 'en activo' : 'en formación',
          application_status: isTestEmail ? 'approved' : 'not_started',
          contract_signed: isTestEmail
        });

      if (insertError && insertError.code !== '23505') throw insertError;

      // --- PASO 1 INTEGRACIÓN HUBSPOT ---
      trackRegistration({ email, nombre, nivel: nivelInt });
      
      if (!data.session) {
          setEmailSent(true);
      } else {
          manualLogin({
            id: authUser.id, nombre, email, telefono: fullPhone,
            nivel_elegido: nivelInt as UserLevel, fecha_registro: new Date().toISOString(),
            m1_completed: false, m2_completed: false, m3_completed: false, m4_completed: false, m5_completed: false,
            test_score: null, test_passed: false, task_score: null, task_status: 'pending', estado_actual: 'en formación',
            vertical: vertical
          });
          navigate('/portal');
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
      return (
        <div className="min-h-screen bg-brand-light dark:bg-brand-darkBg flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-brand-darkCard p-12 rounded-xl shadow-2xl text-center border border-gray-100 dark:border-gray-800">
                <div className="mx-auto h-16 w-16 rounded-xl bg-brand-success/10 dark:bg-brand-success/20 flex items-center justify-center mb-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-success dark:text-brand-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-3xl font-extrabold text-brand-dark dark:text-white mb-4 uppercase">{t('register.email_sent_title')}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 font-medium leading-relaxed">
                    Hemos enviado un correo de confirmación a <span className="font-bold text-brand-primary">{email}</span>.
                </p>
                
                <div className="bg-brand-primary/5 p-6 rounded-2xl mb-10 text-left border border-brand-primary/10">
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Paso Obligatorio
                    </p>
                    <p className="text-sm text-brand-dark dark:text-gray-300 font-bold mb-3 leading-snug">
                        Debes confirmar tu email para poder entrar. Sin este paso, el sistema no te permitirá el acceso a la plataforma.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Si no encuentras el correo en tu bandeja principal, por favor <strong>revisa tu carpeta de SPAM</strong> o correo no deseado.
                    </p>
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={handleResendAfterRegister}
                        disabled={loading}
                        className="w-full py-4 bg-gray-50 dark:bg-gray-800 text-brand-primary font-black rounded-xl uppercase tracking-widest text-[10px] border border-brand-primary/20 hover:bg-brand-primary/5 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Re-enviando...' : 'Re-enviar correo de confirmación'}
                    </button>
                    {resendMessage && (
                        <p className="text-[10px] text-brand-success font-bold uppercase animate-fade-in text-center">{resendMessage}</p>
                    )}
                    <Link to="/login" className="block w-full py-4 bg-brand-primary text-white font-bold rounded-lg shadow-xl uppercase text-sm tracking-widest text-center hover:brightness-110 transition-all">Ir al Login</Link>
                </div>
            </div>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-brand-light dark:bg-brand-darkBg flex items-center justify-center py-12 px-4 transition-colors">
      <div className="max-w-md w-full space-y-10 bg-white dark:bg-brand-darkCard p-10 md:p-12 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 animate-fade-in relative z-10">
        
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
            {t('register.title')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed px-4">
            {t('register.subtitle')}
          </p>
        </div>
        
        <form className="mt-8 space-y-5" onSubmit={handleRegister}>
          {/* Nombre Completo */}
          <div>
            <label className="block text-sm font-bold text-brand-dark dark:text-gray-300 mb-2 ml-1">{t('register.name')}</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </span>
                <input type="text" required placeholder={t('register.name_placeholder')} className="block w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-brand-darkBg border border-gray-200 dark:border-gray-700 dark:text-white rounded-lg focus:ring-1 focus:ring-brand-primary outline-none text-sm transition-all" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-brand-dark dark:text-gray-300 mb-2 ml-1">{t('register.email')}</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>
                </span>
                <input type="email" required placeholder={t('register.email_placeholder')} className="block w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-brand-darkBg border border-gray-200 dark:border-gray-700 dark:text-white rounded-lg focus:ring-1 focus:ring-brand-primary outline-none text-sm transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          {/* Teléfono */}
          <div className="relative">
            <label className="block text-sm font-bold text-brand-dark dark:text-gray-300 mb-2 ml-1">{t('register.phone')}</label>
            <div className="flex w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-brand-darkBg overflow-visible">
                <div className="px-3 flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 transition-colors rounded-l-lg" onClick={() => setIsCountryMenuOpen(!isCountryMenuOpen)}>
                    <img src={selectedCountry.flag} alt={selectedCountry.code} className="w-5 h-auto rounded-sm" />
                    <span className="text-xs font-bold text-brand-dark dark:text-white">{selectedCountry.prefix}</span>
                </div>
                <input type="text" required placeholder={t('register.phone_placeholder')} className="flex-1 px-4 py-3 bg-transparent text-brand-dark dark:text-white outline-none text-sm" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            {isCountryMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-brand-dark border border-gray-100 dark:border-gray-700 rounded-lg shadow-2xl z-50 overflow-y-auto max-h-60 animate-fade-in custom-scrollbar">
                {countries.map((c) => (
                  <button key={c.code} type="button" className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left border-b border-gray-50 dark:border-gray-800 last:border-0" onClick={() => { setSelectedCountry(c); setIsCountryMenuOpen(false); }}>
                    <img src={c.flag} alt={c.code} className="w-5 h-auto rounded-sm shadow-sm" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-brand-primary leading-none mb-1">{c.prefix}</span>
                      <span className="text-[11px] font-bold text-brand-dark dark:text-white leading-none">{c.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nivel Deseado */}
          <div>
            <label className="block text-sm font-bold text-brand-dark dark:text-gray-300 mb-2 ml-1">{t('register.level')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </span>
              <select value={nivel} onChange={(e) => setNivel(e.target.value)} className="block w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-brand-darkBg border border-gray-200 dark:border-gray-700 text-brand-dark dark:text-white rounded-lg focus:ring-1 focus:ring-brand-primary outline-none text-sm font-bold appearance-none cursor-pointer">
                  {roles.map((role) => (
                    <option key={role.id} value={role.id} disabled={!role.available} className="dark:bg-brand-dark">
                      {t(role.translationKey)} {!role.available ? '(Próximamente)' : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-bold text-brand-dark dark:text-gray-300 mb-2 ml-1">{t('register.pass')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </span>
              <input type={showPassword ? "text" : "password"} required placeholder={t('register.pass_placeholder')} className="block w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-brand-darkBg border border-gray-200 dark:border-gray-700 text-brand-dark dark:text-white rounded-lg focus:ring-1 focus:ring-brand-primary outline-none text-sm transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-brand-primary" onClick={() => setShowPassword(!showPassword)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </button>
            </div>
          </div>

          {/* Repetir Contraseña */}
          <div>
            <label className="block text-sm font-bold text-brand-dark dark:text-gray-300 mb-2 ml-1">{t('register.pass_confirm')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </span>
              <input type={showPassword ? "text" : "password"} required placeholder={t('register.pass_placeholder')} className={`block w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-brand-darkBg border ${password && confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} text-brand-dark dark:text-white rounded-lg focus:ring-1 focus:ring-brand-primary outline-none text-sm transition-all`} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>

          {errorMessage && <div className="text-red-500 text-[10px] font-black text-center bg-red-50 p-3 rounded-lg border border-red-100 uppercase tracking-widest animate-pulse">{errorMessage}</div>}

          <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full py-4 bg-brand-primary text-white font-bold rounded-lg shadow-xl hover:brightness-105 active:scale-95 transition-all text-md uppercase tracking-widest">
              {loading ? "..." : t('register.btn')}
            </button>
          </div>
          
          <div className="text-center pt-2">
            <p className="text-[12px] text-gray-500 font-medium">
               {t('register.existing')} <Link to="/login" className="text-brand-secondary font-bold hover:underline">{t('register.login_link')}</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
