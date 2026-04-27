import React, { useMemo, useState } from 'react';
import { useUser } from '../context/UserContext.tsx';
import { UserLevel } from '../types.ts';
import { Link } from 'react-router-dom';

const ColaboradorPortal = () => {
  const { user, updateUser } = useUser();
  const [showTraining, setShowTraining] = useState(false);

  const modules = useMemo(() => {
    if (!user) return [];
    return [
      { id: 1, title: 'Ecosistema RedesComerciales', path: '/modulo1', completed: user.m1_completed },
      { id: 2, title: 'Estrategia de Venta IA', path: '/modulo2', completed: user.m2_completed },
      { id: 3, title: 'Gestión de Leads Hub', path: '/modulo3', completed: user.m3_completed },
      { id: 4, title: 'Cierre y Contratación', path: '/modulo4', completed: user.m4_completed },
      { id: 5, title: 'Evaluación Final', path: '/test-final', completed: user.test_passed },
    ];
  }, [user]);

  const stats = useMemo(() => {
    return {
      pipelineActivo: 12,
      comisionMes: "1.250€",
      objetivoMensual: 3000,
      comisionActualNum: 1250,
      avance: 42,
      cierresFaltantes: 2
    };
  }, []);

  if (!user) return null;

  const isAdmin = user.is_admin_session || user.email === 'admin@redescomerciales.ai';

  const handleSimulateApply = async () => {
      await updateUser({ 
          application_status: 'pending',
          estado_actual: 'en formación',
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
      test_passed: false, contract_signed: false, application_status: 'not_started',
      estado_actual: 'en formación'
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
      {/* Admin Bar for Simulation */}
      {isAdmin && (
        <div className="mb-8 p-8 bg-brand-dark rounded-[2.5rem] border-2 border-brand-primary/30 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center text-xl">🛠️</div>
              <div>
                  <h4 className="text-white font-black uppercase tracking-tighter text-lg">Simulador de Sistema (Admin)</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Usa estos botones para previsualizar los cambios de estado.</p>
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
      )}

      {/* Header Emocional */}
      <div className="bg-brand-dark rounded-[3rem] p-10 md:p-16 mb-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary opacity-10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-6">
              Bienvenida, <span className="text-brand-secondary">{user.nombre}</span>.
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-bold max-w-2xl leading-tight">
              Esta semana estás a <span className="text-white underline decoration-brand-primary decoration-4 underline-offset-8">{stats.cierresFaltantes} cierres</span> de tu siguiente tramo de comisión.
            </p>
          </div>
          <button 
            onClick={() => setShowTraining(!showTraining)}
            className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/20 hover:bg-white hover:text-brand-dark transition-all shadow-xl"
          >
            🎓 {showTraining ? 'Ocultar Formación' : 'Repasar Formación'}
          </button>
        </div>
      </div>

      {showTraining && (
        <div className="mb-12 p-10 bg-white dark:bg-brand-darkCard rounded-[3rem] shadow-xl border-t-4 border-brand-primary animate-fade-in-up">
            <h3 className="text-xl font-black text-brand-dark dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                <span className="w-2 h-6 bg-brand-primary rounded-full"></span>
                Biblioteca de Formación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map((m) => (
                  <div key={m.id} className={`flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all hover:border-brand-primary/30`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-xs ${m.completed ? 'bg-brand-success' : 'bg-brand-primary'}`}>{m.completed ? '✓' : m.id}</div>
                      <div>
                        <h4 className="text-xs font-black text-brand-dark dark:text-white uppercase tracking-tight">{m.title}</h4>
                      </div>
                    </div>
                    <Link to={m.path} className="px-4 py-2 bg-white dark:bg-brand-dark text-brand-dark dark:text-white font-black text-[9px] uppercase tracking-widest rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-brand-primary hover:text-white transition-all">Ver</Link>
                  </div>
                ))}
            </div>
        </div>
      )}

      {/* Zona de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Pipeline Activo */}
        <div className="bg-white dark:bg-brand-darkCard p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Pipeline Activo</p>
          <p className="text-5xl font-black text-brand-dark dark:text-white tracking-tighter">{stats.pipelineActivo}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Casos en gestión</p>
        </div>

        {/* Comisión Mes */}
        <div className="bg-white dark:bg-brand-darkCard p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Comisión Mes</p>
          <p className="text-5xl font-black text-brand-success tracking-tighter">{stats.comisionMes}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Acumulado real</p>
        </div>

        {/* Objetivo Mensual */}
        <div className="bg-white dark:bg-brand-darkCard p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Objetivo Mensual</p>
          <p className="text-5xl font-black text-brand-dark dark:text-white tracking-tighter">{stats.objetivoMensual}€</p>
          <div className="mt-4 w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-primary transition-all duration-1000" 
              style={{ width: `${(stats.comisionActualNum / stats.objetivoMensual) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* % Avance */}
        <div className="bg-white dark:bg-brand-darkCard p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 w-full text-left">% Avance</p>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-gray-800" />
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * stats.avance) / 100} className="text-brand-primary" />
            </svg>
            <span className="absolute text-2xl font-black text-brand-dark dark:text-white">{stats.avance}%</span>
          </div>
        </div>
      </div>

      {/* Placeholder para el resto del contenido del CRM */}
      <div className="bg-white dark:bg-brand-darkCard rounded-[3rem] p-10 shadow-xl border border-gray-100 dark:border-gray-800">
        <h3 className="text-xl font-black text-brand-dark dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
          <span className="w-2 h-6 bg-brand-secondary rounded-full"></span>
          Próximas Acciones Estratégicas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4 shadow-sm">🚀</div>
              <p className="font-black text-brand-dark dark:text-white uppercase text-xs tracking-widest mb-1">Cierre de Operación #{i}04</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Prioridad Alta • 48h restantes</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColaboradorPortal;