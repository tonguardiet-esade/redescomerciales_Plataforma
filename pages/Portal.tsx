import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '../context/UserContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { Link, useNavigate } from 'react-router-dom';
import { UserLevel } from '../types.ts';
import { supabase } from '../services/supabaseClient.ts';
import { trackPrescription } from '../services/backendEvents';
import ColaboradorPortal from './ColaboradorPortal.tsx';
import { Mail, Zap } from 'lucide-react';

const Portal = () => {
  const { user, updateUser } = useUser();
  const { t, theme } = useSettings();
  const navigate = useNavigate();
  
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [linkedin, setLinkedin] = useState(user?.linkedin_url || '');
  const [nombreForm, setNombreForm] = useState(user?.nombre || '');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showRecForm, setShowRecForm] = useState(false);
  const [showSoonModal, setShowSoonModal] = useState(false);
  const [newRec, setNewRec] = useState({ nombre: '', email: '', empresa: '', vertical: 'RedesComerciales.ai' });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Estados para el Chat de Soporte
  const [isSupportChatOpen, setSupportChatOpen] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  const fetchChatHistory = useCallback(async () => {
    if (!user) return;
    setLoadingChat(true);
    try {
        const { data, error } = await supabase
            .from('Soporte')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            setChatHistory(data.map(m => ({
                id: m.id,
                role: m.role,
                text: m.message,
                time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })));
        } else {
            setChatHistory([
                { id: 'welcome', role: 'support', text: '¡Hola! Soy el Soporte Técnico de Marketing. ¿En qué puedo ayudarte hoy?', time: '10:00' }
            ]);
        }
    } catch (err) {
        console.error("Error fetching chat:", err);
    } finally {
        setLoadingChat(false);
    }
  }, [user]);

  useEffect(() => {
    if (isSupportChatOpen) {
        fetchChatHistory();
        
        // Suscripción en tiempo real
        const channel = supabase
            .channel(`support-${user.id}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'Soporte',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                const newMessage = payload.new;
                setChatHistory(prev => {
                    // Evitar duplicados si el mensaje ya se añadió localmente
                    if (prev.some(m => m.id === newMessage.id)) return prev;
                    return [...prev, {
                        id: newMessage.id,
                        role: newMessage.role,
                        text: newMessage.message,
                        time: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
  }, [isSupportChatOpen, user.id, fetchChatHistory]);

  const fetchUserRecommendations = useCallback(async () => {
    if (!user || !user.contract_signed) return;
    if (user.nivel_elegido !== UserLevel.PRESCRIPTOR) return;
    
    setLoadingRecs(true);
    try {
        const { data, error } = await supabase.from('Prescripciones').select('*').eq('prescriptor_id', user.id).order('fecha_creacion', { ascending: false });
        if (error) throw error;
        setRecommendations(data || []);
    } catch (err) {
        console.error("Error fetching recs:", err);
    } finally {
        setLoadingRecs(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserRecommendations();
  }, [fetchUserRecommendations]);

  const stats = useMemo(() => {
    const enProceso = recommendations.filter(r => r.estado === 'En proceso').length;
    const aceptadas = recommendations.filter(r => r.estado === 'Aceptada').length;
    const rechazadas = recommendations.filter(r => r.estado === 'Rechazada').length;
    const comisiones = aceptadas * 150; 
    
    return {
      enProceso,
      aceptadas,
      rechazadas,
      comisiones: comisiones > 0 ? `€${comisiones}` : '0€'
    };
  }, [recommendations]);

  if (!user) return null;

  const roleLevel = user.nivel_elegido;
  const status = (user.application_status || 'not_started').toLowerCase();
  const isAdmin = user.is_admin_session || user.email === 'admin@redescomerciales.ai' || user.email === 'ia@acceleralia.com';
  
  const isColaborador = roleLevel === UserLevel.COLABORADOR;
  const isMocota = roleLevel === UserLevel.MOCOTA_TIPO_1 || roleLevel === UserLevel.MOCOTA_TIPO_2;
  const isPrescriptor = roleLevel === UserLevel.PRESCRIPTOR;

  // Robust check for selected status: signed contract, explicit status, or admin testing
  const isSelected = user.contract_signed || 
                    status === 'selected' || 
                    user.estado_actual === 'producción activa' ||
                    (isAdmin && (user.contract_signed || user.m5_completed || user.test_passed)) ||
                    (user.m1_completed && user.m2_completed && user.m3_completed && user.m4_completed && (isPrescriptor ? user.m5_completed : user.test_passed) && user.contract_signed);

  const isApproved = isAdmin || isSelected || status === 'approved' || status === 'hr_interview' || status === 'sales_interview';

  useEffect(() => {
    console.log("Portal State:", {
      userId: user.id,
      nivel: user.nivel_elegido,
      status: status,
      contract_signed: user.contract_signed,
      m5_completed: user.m5_completed,
      test_passed: user.test_passed,
      isSelected: isSelected
    });
  }, [user, status, isSelected]);

  const needsApplication = (isColaborador || isMocota) && (status === 'not_started' || status === 'rejected') && !isAdmin;
  const applicationPending = (isColaborador || isMocota) && status === 'pending' && !isAdmin;

  // --- Configuration of Training Path ---
  // Fix: Defining missing 'modules' array to track training progress
  const modules = [
    { id: 1, title: t('portal.module.1'), path: '/modulo1', completed: user.m1_completed, locked: false },
    { id: 2, title: t('portal.module.2'), path: '/modulo2', completed: user.m2_completed, locked: !user.m1_completed },
    { id: 3, title: t('portal.module.3'), path: '/modulo3', completed: user.m3_completed, locked: !user.m2_completed },
    { id: 4, title: t('portal.module.4'), path: '/modulo4', completed: user.m4_completed, locked: !user.m3_completed },
    { 
      id: 5, 
      title: isPrescriptor ? 'Módulo 5: Ética y Cierre' : 'Evaluación Final', 
      path: isPrescriptor ? '/modulo5' : '/test-final', 
      completed: isPrescriptor ? user.m5_completed : user.test_passed, 
      locked: !user.m4_completed 
    },
  ];

  // Fix: Defining missing 'contract_locked' logic to control contract availability
  const contract_locked = isPrescriptor ? !user.m5_completed : !user.test_passed;

  const roleExplanations: Record<number, { what: string, role: string, note?: string }> = {
      [UserLevel.PRESCRIPTOR]: {
          what: "RedesComerciales.ai es un ecosistema de soluciones tecnológicas con Inteligencia Artificial que ayuda a empresas a transformar sus colaboradores en una red de ventas activa. A través de plataformas especializadas, facilitamos la identificación de oportunidades, la formación de equipos y la gestión comercial de alto rendimiento.",
          role: "Tu misión es identificar y conectar organizaciones que puedan beneficiarse del ecosistema RedesComerciales.ai. Es un rol de recomendación estratégica que te permite generar ingresos conectando empresas con soluciones que les ayudan a escalar sus ventas.",
          note: "En los siguientes módulos aprenderás cómo funciona el ecosistema RedesComerciales.ai y cómo realizar prescripciones correctamente."
      },
      [UserLevel.COLABORADOR]: {
          what: "Plataforma SaaS B2B que optimiza la captación de fondos públicos mediante procesos estructurados y automatización inteligente.",
          role: "Actúas como consultor inicial. Tu función es cualificar el encaje de la empresa, realizar demos de la herramienta y acompañar al cliente."
      },
      [UserLevel.MOCOTA_TIPO_1]: {
          what: "Plataforma SaaS B2B que optimiza la captación de fondos públicos mediante procesos estructurados y automatización inteligente.",
          role: "Actúas como delegado de zona. Tu función es cualificar el encaje de la empresa, realizar demos de la herramienta y liderar la gestión comercial."
      },
      [UserLevel.MOCOTA_TIPO_2]: {
          what: "Plataforma SaaS B2B que optimiza la captación de fondos públicos mediante procesos estructurados y automatización inteligente.",
          role: "Actúas como responsable de oficina técnica. Tu función es la gestión integral 360º de la plataforma y el acompañamiento experto."
      }
  };

  const currentExplanation = roleExplanations[roleLevel as keyof typeof roleExplanations] || roleExplanations[UserLevel.PRESCRIPTOR];

  // FUNCIONES DE SIMULACIÓN PARA ADMIN
  const handleSimulateApply = async () => {
      await updateUser({ 
          application_status: 'pending',
          estado_actual: 'en formación', // Aseguramos que no esté en producción
          contract_signed: false
      });
  };

  const handleSkipApplication = async () => {
      await updateUser({ 
          application_status: 'selected',
          estado_actual: 'en formación',
          contract_signed: false
      });
  };

  const handleSimulateModules = async () => {
    await updateUser({
      application_status: 'selected',
      estado_actual: 'en formación',
      m1_completed: true, 
      m2_completed: true, 
      m3_completed: true, 
      m4_completed: true, 
      m5_completed: true,
      test_passed: true,
      contract_signed: false
    });
  };

  const handleResetPortal = async () => {
    await updateUser({
      m1_completed: false, m2_completed: false, m3_completed: false, m4_completed: false, m5_completed: false,
      test_passed: false, contract_signed: false, application_status: (isAdmin || isPrescriptor) ? 'approved' : 'not_started',
      estado_actual: 'en formación'
    });
  };

  const handleAddRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
        const { error } = await supabase.from('Prescripciones').insert({
            prescriptor_id: user.id,
            prescriptor_nombre: user.nombre,
            nombre_interesado: newRec.nombre,
            email_contacto: newRec.email,
            nombre_empresa: newRec.empresa,
            vertical: newRec.vertical,
            estado: 'En proceso'
        });
        if (error) throw error;
        trackPrescription({ prescriptor_email: user.email, candidato_email: newRec.email, candidato_nombre: newRec.nombre, empresa: newRec.empresa });
        setNewRec({ nombre: '', email: '', empresa: '', vertical: 'RedesComerciales.ai' });
        setShowRecForm(false);
        fetchUserRecommendations();
    } catch (err) { alert("Error al registrar recomendación"); } finally { setSubmitting(false); }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const now = new Date();
    const time = now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0');
    
    const tempId = Date.now();
    const messageText = chatMessage;
    setChatMessage("");

    console.log("Sending message as user:", user.id);

    // Optimistic update
    setChatHistory(prev => [...prev, { id: tempId, role: 'user', text: messageText, time }]);

    try {
        const { error } = await supabase.from('Soporte').insert({
            user_id: user.id,
            user_email: user.email,
            user_name: user.nombre,
            message: messageText,
            role: 'user'
        });
        if (error) {
            console.error("Error inserting message into Soporte:", error);
            throw error;
        }
        console.log("Message sent successfully");
    } catch (err) {
        console.error("Error sending message:", err);
        alert("Error al enviar el mensaje. Verifica que la tabla 'Soporte' exista en tu base de datos.");
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile || !linkedin || !nombreForm) { alert("Por favor, sube tu CV y completa todos los campos."); return; }
    setSubmitting(true);
    const reader = new FileReader();
    reader.readAsDataURL(cvFile);
    reader.onload = async () => {
      const base64 = reader.result as string;
      await updateUser({ 
        nombre: nombreForm, 
        cv_link: base64, 
        linkedin_url: linkedin, 
        cover_letter: coverLetter,
        application_status: 'pending' 
      });
      setSubmitting(false);
    };
    reader.onerror = () => { alert("Error al procesar el archivo."); setSubmitting(false); };
  };

  if (isSelected) {
      if (isColaborador || isMocota) {
          return <ColaboradorPortal />;
      }
      return (
          <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in transition-colors duration-300">
              <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                      <h1 className="text-4xl font-black text-brand-dark dark:text-white uppercase tracking-tighter">
                          {isPrescriptor ? 'Mis Recomendaciones' : 'Panel de Gestión'}
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                          <span className="px-3 py-1 bg-brand-primary text-white text-[10px] font-black uppercase rounded-full tracking-widest">
                              {roleLevel === 1 ? 'PRESCRIPTOR' : roleLevel === 2 ? 'COLABORADOR' : roleLevel === 3 ? 'DELEGADO COMERCIAL' : 'FRANQUICIA MOCOTA'}
                          </span>
                          <span className="text-brand-success text-xs font-bold uppercase tracking-widest border-l pl-2 animate-pulse">Producción Activa</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setShowTraining(!showTraining)} 
                        className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest border transition-all shadow-sm ${showTraining ? 'bg-brand-dark text-white border-brand-dark' : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20 hover:bg-brand-primary hover:text-white'}`}
                      >
                         🎓 {showTraining ? 'Ocultar Formación' : 'Repasar Formación'}
                      </button>
                      {isAdmin && (
                        <button onClick={handleResetPortal} className="px-6 py-3 bg-brand-primary/10 text-brand-primary rounded-xl font-black text-xs uppercase tracking-widest border border-brand-primary/20 hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                            🔄 Resetear (Admin)
                        </button>
                      )}
                      {isPrescriptor ? (
                        <button onClick={() => setShowRecForm(!showRecForm)} className="px-6 py-3 bg-brand-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2">
                            {showRecForm ? 'Ver Mis Contactos' : '+ Registrar Oportunidad'}
                        </button>
                      ) : (
                        <button className="px-6 py-3 bg-brand-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all">
                            + Nueva Operación
                        </button>
                      )}
                  </div>
              </header>

              {showTraining && (
                <div className="mb-12 p-10 bg-white dark:bg-brand-darkCard rounded-[3rem] shadow-xl border-t-4 border-brand-primary animate-fade-in-up">
                    <h3 className="text-xl font-black text-brand-dark dark:text-white uppercase tracking-tighter mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-6 bg-brand-primary rounded-full"></span>
                            Biblioteca de Módulos (Consulta)
                        </div>
                        <button onClick={() => setShowTraining(false)} className="text-gray-400 hover:text-brand-primary transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </h3>
                    <div className="space-y-4">
                        {modules.map((m) => (
                          <div key={m.id} className={`flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all hover:border-brand-primary/30`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-xs ${m.completed ? 'bg-brand-success' : 'bg-brand-primary'}`}>{m.completed ? '✓' : m.id}</div>
                              <div>
                                <h4 className="text-sm font-black text-brand-dark dark:text-white uppercase tracking-tight">{m.title}</h4>
                                <p className="text-[9px] font-bold text-brand-success uppercase tracking-widest mt-1">Contenido disponible para repaso</p>
                              </div>
                            </div>
                            <Link to={m.path} className="px-6 py-2 bg-white dark:bg-brand-dark text-brand-dark dark:text-white font-black text-[10px] uppercase tracking-widest rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-sm">Entrar</Link>
                          </div>
                        ))}
                    </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <KpiCard label="En Proceso" value={stats.enProceso.toString()} />
                  <KpiCard label="Aceptadas" value={stats.aceptadas.toString()} color="text-brand-success" />
                  <KpiCard label="Rechazadas" value={stats.rechazadas.toString()} color="text-brand-primary" />
                  <KpiCard label="Comisiones" value={stats.comisiones} color="text-brand-primary" />
              </div>

              <div className="space-y-8">
                  <div className="w-full">
                      {isPrescriptor && showRecForm ? (
                          <div className="bg-white dark:bg-brand-darkCard p-10 rounded-[3rem] shadow-card border border-gray-100 dark:border-800 animate-fade-in-up">
                              <h3 className="text-xl font-black text-brand-dark dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                                  <span className="w-2 h-6 bg-brand-primary rounded-full"></span>
                                  Registrar Nueva Empresa
                              </h3>
                              <form onSubmit={handleAddRecommendation} className="space-y-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre del Interesado</label>
                                          <input required type="text" value={newRec.nombre} onChange={e => setNewRec({...newRec, nombre: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm" placeholder="Ej: Roberto Sánchez" />
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email de Contacto</label>
                                          <input required type="email" value={newRec.email} onChange={e => setNewRec({...newRec, email: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm" placeholder="roberto@empresa.com" />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre de la Empresa</label>
                                      <input required type="text" value={newRec.empresa} onChange={e => setNewRec({...newRec, empresa: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm" placeholder="RedesComerciales Partner S.L." />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Plataforma de Interés</label>
                                    <div className="grid grid-cols-3 gap-3">
                                      {['SalesAcademy', 'LeadHub', 'NetworkManager'].map((v) => (
                                        <button
                                          key={v}
                                          type="button"
                                          onClick={() => setNewRec({...newRec, vertical: v})}
                                          className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                            newRec.vertical === v 
                                              ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' 
                                              : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'
                                          }`}
                                        >
                                          {v}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <button type="submit" disabled={submitting} className="w-full py-5 bg-brand-primary text-white font-black rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50">
                                      {submitting ? 'Enviando...' : 'Enviar Recomendación al Equipo'}
                                  </button>
                              </form>
                          </div>
                      ) : (
                          <div className="bg-white dark:bg-brand-darkCard rounded-[2.5rem] shadow-card border border-gray-100 dark:border-800 overflow-hidden">
                              <div className="p-8 border-b dark:border-gray-800 flex justify-between items-center">
                                  <h3 className="font-black text-brand-dark dark:text-white uppercase tracking-widest text-xs">
                                      {isPrescriptor ? 'Historial de Recomendaciones' : 'Pipeline de Operaciones'}
                                  </h3>
                                  <button onClick={fetchUserRecommendations} className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 ${loadingRecs ? 'animate-spin' : ''}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                              </div>
                              <div className="p-2 overflow-x-auto">
                                  {isPrescriptor ? (
                                      <table className="w-full text-left">
                                          <thead>
                                              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b dark:border-gray-800">
                                                  <th className="px-6 py-4">Empresa / Contacto</th>
                                                  <th className="px-6 py-4">Estado</th>
                                                  <th className="px-6 py-4 text-right">Fecha</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y dark:divide-gray-800">
                                              {recommendations.length > 0 ? recommendations.map(r => (
                                                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                                                      <td className="px-6 py-5">
                                                          <p className="font-black text-brand-dark dark:text-white text-sm leading-tight">{r.nombre_empresa}</p>
                                                          <p className="text-[10px] text-gray-400 font-bold uppercase">{r.nombre_interesado} • {r.email_contacto}</p>
                                                      </td>
                                                      <td className="px-6 py-5">
                                                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${r.estado === 'Aceptada' ? 'bg-green-50 border-green-200 text-brand-success' : r.estado === 'Rechazada' ? 'bg-red-50 border-red-200 text-brand-primary' : 'bg-yellow-50 border-yellow-200 text-yellow-600'}`}>{r.estado}</span>
                                                      </td>
                                                      <td className="px-6 py-5 text-right text-[10px] font-bold text-gray-400">{new Date(r.fecha_creacion).toLocaleDateString()}</td>
                                                  </tr>
                                              )) : (
                                                  <tr><td colSpan={3} className="px-6 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Aún no has registrado ninguna oportunidad.</td></tr>
                                              )}
                                          </tbody>
                                      </table>
                                  ) : (
                                      <div className="space-y-1 py-10 text-center text-gray-400 font-bold uppercase text-xs">Pipeline vacío</div>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
                  
                  {isAdmin && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* HERRAMIENTAS DE VENTA */}
                        <div className="bg-white dark:bg-brand-darkCard p-9 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 relative overflow-hidden group flex flex-col justify-between min-h-[280px]">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-bl-[4rem] transition-transform group-hover:scale-110"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary shadow-inner">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-black text-brand-dark dark:text-white uppercase text-sm leading-tight">Herramientas de Venta</p>
                                        <p className="text-[10px] text-brand-primary font-bold uppercase tracking-widest mt-1">Generador de Email</p>
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Crea propuestas profesionales para inversores en segundos con nuestra IA de última generación.</p>
                            </div>
                            <button 
                              onClick={() => setShowSoonModal(true)}
                              className="w-full py-4 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 border border-white/10 relative z-10"
                            >
                              <Mail className="w-4 h-4" />
                              Generar Email para Inversores
                            </button>
                        </div>

                        {/* CANAL DE AYUDA */}
                        <div className="bg-white dark:bg-brand-darkCard p-9 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 relative overflow-hidden group flex flex-col justify-between min-h-[280px]">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-secondary/5 rounded-bl-[4rem] transition-transform group-hover:scale-110"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-brand-secondary/10 rounded-full flex items-center justify-center text-2xl shadow-inner">🛡️</div>
                                    <div>
                                        <p className="font-black text-brand-dark dark:text-white uppercase text-sm leading-tight">Soporte Técnico Marketing</p>
                                        <p className="text-[10px] text-brand-secondary font-bold uppercase tracking-widest mt-1">Soporte Directo</p>
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Resuelve tus dudas técnicas o de marketing con nuestro equipo especializado en tiempo real.</p>
                            </div>
                            <button 
                              onClick={() => setSupportChatOpen(true)}
                              className="w-full py-4 bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-primary transition-all shadow-lg shadow-brand-dark/20 relative z-10"
                            >
                              Abrir Chat de Soporte
                            </button>
                        </div>
                    </div>
                  )}
              </div>

              {/* MODAL DE CHAT SOPORTE */}
              {isSupportChatOpen && (
                <div className="fixed bottom-8 right-8 z-[100] w-full max-w-[380px] bg-white dark:bg-brand-darkCard rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-gray-800 animate-fade-in-up flex flex-col overflow-hidden">
                    <div className="bg-brand-dark p-6 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-secondary rounded-full flex items-center justify-center text-sm">🛡️</div>
                            <div>
                                <p className="font-black text-xs uppercase tracking-widest leading-none">Soporte Marketing</p>
                                <p className="text-[9px] text-brand-success font-bold uppercase mt-1">Online ahora</p>
                            </div>
                        </div>
                        <button onClick={() => setSupportChatOpen(false)} className="text-white/40 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="h-80 overflow-y-auto p-6 bg-gray-50/50 dark:bg-brand-darkBg/30 custom-scrollbar space-y-4">
                        {chatHistory.map(msg => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-brand-primary text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-bl-none'}`}>
                                    {msg.text}
                                    <p className={`text-[8px] mt-1 opacity-50 text-right`}>{msg.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-white dark:bg-brand-darkCard border-t dark:border-gray-800 flex gap-2">
                        <input 
                            type="text" 
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Escribe tu duda aquí..." 
                            className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-brand-primary dark:text-white"
                        />
                        <button onClick={handleSendMessage} className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </div>
                </div>
              )}

              {/* MODAL PRÓXIMAMENTE */}
              {showSoonModal && (
                <div 
                  className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
                  onClick={() => setShowSoonModal(false)}
                >
                  <div 
                    className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl animate-fade-in-up"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-lg shadow-brand-primary/20 transform -rotate-3">
                      🚀
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Herramienta en fase final</h3>
                    <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-10">
                      Estamos ultimando los detalles de <span className="text-brand-primary font-bold">Excel2Invest</span> para que tus prospecciones sean infalibles. ¡Disponible en pocos días!
                    </p>
                    <button 
                      onClick={() => setShowSoonModal(false)}
                      className="w-full py-5 bg-brand-primary text-white font-black rounded-2xl uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              )}
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 transition-colors duration-300">
      <div className="mb-12 animate-fade-in-up">
          {((isPrescriptor && user.m5_completed) || (!isPrescriptor && user.test_passed)) && !user.contract_signed ? (
               <div className="bg-brand-primary/5 border-2 border-brand-primary p-12 rounded-[3.5rem] text-center mb-16 shadow-2xl animate-fade-in relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent animate-pulse"></div>
                  <h2 className="text-4xl font-black text-brand-dark dark:text-white uppercase tracking-tighter mb-4">¡Formación Completada!</h2>
                  <p className="text-gray-600 dark:text-gray-300 font-bold mb-10 max-w-xl mx-auto leading-relaxed">Has superado todos los hitos de formación. El último paso es firmar el convenio de colaboración para activar tu panel de producción y empezar a registrar oportunidades.</p>
                  <button onClick={() => navigate('/contrato')} className="px-16 py-6 bg-brand-primary text-white font-black rounded-2xl uppercase tracking-[0.3em] text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">Firmar Convenio Ahora</button>
               </div>
          ) : (
            <>
                <div className="flex flex-col items-center mb-12 animate-fade-in">
                    {/* Logo eliminado */}
                    <h1 className="text-5xl font-black text-brand-dark dark:text-white flex items-center gap-4 uppercase tracking-tighter text-center justify-center">
                      BIENVENIDO A <span className="text-brand-primary">REDESCOMERCIALES.AI</span> 🚀
                    </h1>
                </div>
                <div className="space-y-6 mb-16">
                    {/* FORMULARIO DE APLICACIÓN PARA COLABORADORES */}
                    {needsApplication ? (
                        <div className="bg-white dark:bg-brand-darkCard p-12 rounded-[3.5rem] shadow-2xl border-2 border-brand-primary/20 animate-fade-in-up">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-2xl">📄</div>
                                <div>
                                    <h3 className="text-2xl font-black text-brand-dark dark:text-white uppercase tracking-tighter">Solicitud de Colaboración</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Completa tu perfil para acceder a la formación</p>
                                </div>
                            </div>
                            
                            <form onSubmit={handleApply} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                        <input 
                                            type="text" 
                                            value={nombreForm} 
                                            onChange={(e) => setNombreForm(e.target.value)}
                                            className="w-full p-5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all"
                                            placeholder="Tu nombre y apellidos"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL LinkedIn</label>
                                        <input 
                                            type="url" 
                                            value={linkedin} 
                                            onChange={(e) => setLinkedin(e.target.value)}
                                            className="w-full p-5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all"
                                            placeholder="https://linkedin.com/in/tuperfil"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Carta de Presentación</label>
                                    <textarea 
                                        value={coverLetter}
                                        onChange={(e) => setCoverLetter(e.target.value)}
                                        className="w-full p-5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all min-h-[120px]"
                                        placeholder="Cuéntanos brevemente por qué quieres unirte a RedesComerciales.ai..."
                                    ></textarea>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Currículum Vitae (PDF)</label>
                                    <div className="relative group">
                                        <input 
                                            type="file" 
                                            accept=".pdf"
                                            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            required
                                        />
                                        <div className={`w-full p-8 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all ${cvFile ? 'border-brand-success bg-green-50' : 'border-gray-200 dark:border-gray-700 group-hover:border-brand-primary/50'}`}>
                                            <div className={`text-3xl ${cvFile ? 'text-brand-success' : 'text-gray-300'}`}>{cvFile ? '✅' : '📤'}</div>
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                                                {cvFile ? cvFile.name : 'Haz clic o arrastra tu CV aquí'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="w-full py-6 bg-brand-primary text-white font-black rounded-[2rem] uppercase tracking-[0.3em] text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Enviando Solicitud...' : 'Enviar Candidatura'}
                                </button>
                            </form>
                        </div>
                    ) : applicationPending ? (
                        <div className="bg-brand-primary/5 border-2 border-brand-primary/20 p-12 rounded-[3.5rem] text-center animate-pulse">
                            <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⏳</div>
                            <h3 className="text-2xl font-black text-brand-dark dark:text-white uppercase tracking-tighter mb-2">Solicitud en Revisión</h3>
                            <p className="text-gray-500 dark:text-gray-400 font-bold max-w-md mx-auto">Nuestro equipo de talento está revisando tu perfil. Te notificaremos por email cuando puedas comenzar tu formación.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-brand-darkCard p-10 rounded-[3rem] shadow-xl border border-gray-100 dark:border-white/5 flex flex-col">
                                <h3 className="text-lg font-black text-brand-dark dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3"><span className="w-1.5 h-6 bg-brand-primary rounded-full"></span>¿Qué es RedesComerciales.ai?</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-medium text-justify">{currentExplanation.what}</p>
                            </div>
                            <div className="bg-white dark:bg-brand-darkCard p-10 rounded-[3rem] shadow-xl border border-gray-100 dark:border-white/5 flex flex-col">
                                <h3 className="text-lg font-black text-brand-dark dark:text-white uppercase tracking-widest mb-4 flex items-center gap-3"><span className="w-1.5 h-6 bg-brand-secondary rounded-full"></span>Tu Rol Seleccionado</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-medium text-justify">{currentExplanation.role}</p>
                                {currentExplanation.note && (
                                    <p className="mt-4 text-brand-primary text-[10px] font-black uppercase tracking-widest border-t border-brand-primary/10 pt-4 text-justify">
                                        {currentExplanation.note}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* BARRA DE HERRAMIENTAS ADMIN (SIMULACIÓN) */}
                    {isAdmin && (
                        <div className="bg-brand-dark text-white p-10 rounded-[3rem] shadow-2xl border-4 border-brand-primary/30 animate-fade-in relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-5 rounded-bl-full"></div>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center text-3xl shadow-lg transform rotate-3">🛠️</div>
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-primary">Simulador de Sistema (Admin)</p>
                                        <p className="text-xs text-gray-400 font-bold mt-1">Usa estos botones para previsualizar los cambios de estado.</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3 justify-center">
                                    <button onClick={handleSimulateApply} className="px-6 py-3.5 bg-white/10 text-white border border-white/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-primary transition-all shadow-lg">
                                        📩 Simular Envío
                                    </button>
                                    <button onClick={handleSkipApplication} className="px-6 py-3.5 bg-brand-secondary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg">
                                        🚀 Saltar Solicitud
                                    </button>
                                    <button onClick={handleSimulateModules} className="px-6 py-3.5 bg-brand-secondary text-brand-dark rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg">
                                        🔓 Simular Éxito Módulos
                                    </button>
                                    <button onClick={handleResetPortal} className="px-6 py-3.5 bg-white/10 text-white border border-white/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-primary hover:border-brand-primary transition-all">
                                        🔄 Resetear Proceso
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </>
          )}
      </div>

      <div className="mb-12 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h1 className="text-4xl font-black text-brand-dark dark:text-white leading-tight uppercase tracking-tighter">PANEL DE CARRERA <span className="text-brand-secondary text-sm font-black opacity-60 tracking-widest">({isPrescriptor ? 'PLAN PRESCRIPTOR' : 'PLAN PROFESIONAL'})</span></h1>
      </div>

      <div className={`space-y-4 max-w-4xl mx-auto ${(isColaborador || isMocota) && !isApproved ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
        {modules.map((m) => (
          <div key={m.id} className={`flex items-center justify-between p-8 bg-white dark:bg-brand-darkCard rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm transition-all ${m.locked ? 'opacity-30 grayscale' : 'hover:border-brand-primary/30 shadow-md group'}`}>
            <div className="flex items-center gap-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white shadow-md ${m.completed ? 'bg-brand-success' : 'bg-brand-primary'}`}>{m.completed ? '✓' : m.id}</div>
              <div>
                <h3 className="text-xl font-black text-brand-dark dark:text-white leading-none uppercase tracking-tight">{m.title}</h3>
                <p className={`text-[10px] font-black uppercase mt-2 tracking-widest ${m.completed ? 'text-brand-success' : 'text-gray-400'}`}>{m.completed ? 'COMPLETADO' : m.locked ? 'BLOQUEADO' : 'PENDIENTE'}</p>
              </div>
            </div>
            <Link to={m.locked ? '#' : m.path} className={`px-10 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${m.locked ? 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100' : m.completed ? 'bg-green-50 text-brand-success border border-green-200 hover:bg-brand-success hover:text-white shadow-sm' : 'bg-brand-primary text-white hover:brightness-110 shadow-lg'}`}>{m.completed ? 'Repasar' : 'Empezar'}</Link>
          </div>
        ))}
        <div className={`mt-10 flex items-center justify-between p-8 bg-brand-dark text-white rounded-[2.5rem] shadow-xl transition-all border-4 ${contract_locked ? 'opacity-40 grayscale border-transparent' : 'border-brand-success cursor-pointer'}`}>
            <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black shadow-md ${contract_locked ? 'bg-gray-600 text-gray-400' : 'bg-brand-success text-white'}`}>{contract_locked ? '🔒' : user.contract_signed ? '✅' : '✍️'}</div>
                <div>
                    <h3 className="text-xl font-black leading-none uppercase tracking-tight">{user.contract_signed ? 'Convenio Firmado' : 'Firma de Convenio Oficial'}</h3>
                    <p className={`text-[10px] font-black uppercase mt-2 tracking-widest ${contract_locked ? 'text-gray-400' : 'text-brand-success'}`}>{contract_locked ? 'DESBLOQUEAR AL FINALIZAR FORMACIÓN' : user.contract_signed ? 'YA PUEDES ACCEDER AL PANEL' : 'DISPONIBLE PARA FIRMAR'}</p>
                </div>
            </div>
            <button disabled={contract_locked} onClick={() => user.contract_signed ? navigate('/portal') : navigate('/contrato')} className={`px-10 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${contract_locked ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-brand-success text-white hover:brightness-110 shadow-lg ' + (!user.contract_signed ? 'animate-pulse' : '')}`}>{contract_locked ? 'Bloqueado' : user.contract_signed ? 'Ir a mi Panel' : 'Firmar Ahora'}</button>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, color = "text-brand-dark" }: { label: string, value: string, color?: string }) => (
    <div className="bg-white dark:bg-brand-darkCard p-6 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-800 transition-all hover:shadow-md text-center">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">{label}</p>
        <p className={`text-2xl font-black ${color} dark:text-white`}>{value}</p>
    </div>
);

export default Portal;