
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { recommendRole as recommendRoleService } from '../services/geminiService';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';

const Landing = () => {
  const { user } = useUser();
  const { t } = useSettings();
  const navigate = useNavigate();

  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [matcherInput, setMatcherInput] = useState('');
  const [loadingMatcher, setLoadingMatcher] = useState(false);
  const [matcherResult, setMatcherResult] = useState<any>(null);

  const [selectedRoleDetail, setSelectedRoleDetail] = useState<any>(null);

  const handleMatcherSubmit = async () => {
    if (!matcherInput.trim()) return;
    setLoadingMatcher(true);
    const result = await recommendRoleService(matcherInput);
    setMatcherResult(result);
    setLoadingMatcher(false);
  };

  const rolesData = [
    { level: 1, key: 'role.1', modalColor: 'bg-brand-primary', hasSub: false, available: true },
    { level: 2, key: 'role.2', modalColor: 'bg-brand-primary', hasSub: false, available: true },
    { level: 3, key: 'role.3', modalColor: 'bg-brand-primary', hasSub: true, available: true },
    { level: 4, key: 'role.4', modalColor: 'bg-brand-primary', hasSub: true, available: true },
  ];

  return (
    <div className="transition-colors duration-300 dark:bg-brand-darkBg">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-4 text-center">
        <div className="max-w-4xl mx-auto z-10 relative">
          <div className="flex justify-center mb-10">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 rounded-full border-2 border-gray-100 dark:border-gray-800 flex items-center justify-center bg-white dark:bg-white shadow-md overflow-hidden">
                  <svg viewBox="0 0 100 100" className="w-12 h-12">
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
                  <span className="text-4xl md:text-5xl font-black tracking-tighter text-brand-dark dark:text-white leading-none">
                    Redes<span className="text-brand-primary">comerciales.ai</span>
                  </span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">
                    TRANSFORMA COLABORADORES EN UNA RED DE VENTAS ACTIVA
                  </span>
                </div>
              </div>
            </div>
          </div>
          <span className="inline-block py-1 px-4 rounded-md bg-brand-secondary/10 text-brand-secondary font-bold text-[10px] mb-8 uppercase tracking-[0.2em]">
            {t('hero.tag')}
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-brand-dark dark:text-white leading-tight mb-8">
            {t('hero.title').split('Redescomerciales.ai')[0]}
            <span className="text-brand-primary">Redescomerciales.ai</span>
            {t('hero.title').split('Redescomerciales.ai')[1]}
          </h1>
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            {t('hero.subtitle')}
          </p>
          
          <div className="flex flex-col items-center gap-6">
            {user ? (
               <Link to="/portal" className="px-10 py-3 bg-brand-primary text-white rounded-lg font-bold text-lg hover:scale-105 transition-all">
                  {t('nav.continue')}
                </Link>
            ) : (
                <>
                  <Link to="/registro" className="px-12 py-3.5 bg-brand-primary text-white rounded-lg font-bold text-lg hover:scale-105 transition-all">
                      {t('hero.btn')}
                  </Link>
                  <p className="text-sm text-gray-400 font-medium">
                    ¿Ya tienes una cuenta? <Link to="/login" className="text-brand-primary font-bold hover:underline">Iniciar sesión</Link>
                  </p>
                </>
            )}
          </div>
        </div>
      </section>

      {/* Ecosystem Section - Márgenes internos reducidos para mayor compacidad */}
      <section className="py-24 bg-white dark:bg-brand-darkCard/10">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-2 text-brand-dark dark:text-white leading-tight">
              {t('ecosystem.title')}
            </h2>
            <div className="w-12 h-1 bg-brand-primary/20 mx-auto mb-6 rounded-full"></div>
            <p className="text-gray-400 dark:text-gray-500 mb-20 text-lg font-medium tracking-tight">
              {t('ecosystem.subtitle')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center items-stretch">
                {rolesData.map((role) => (
                    <div 
                      key={role.level} 
                      className={`w-full bg-[#f8f9fb] dark:bg-brand-darkCard p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm transition-all group text-left flex flex-col justify-between relative overflow-hidden ${!role.available ? 'opacity-60 grayscale' : 'hover:shadow-xl'}`}
                    >
                        {!role.available && (
                          <div className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest z-10">
                            Próximamente...
                          </div>
                        )}

                        {/* Contenedor Superior */}
                        <div className="flex flex-col items-start">
                          {/* Círculo Magenta - Margen inferior reducido de mb-8 a mb-4 */}
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 text-sm font-black text-white shadow-lg ${!role.available ? 'bg-gray-400' : 'bg-brand-primary'}`}>
                            {role.level}
                          </div>
                          
                          {/* Título - min-h ajustado y margen mb-6 a mb-2 */}
                          <div className="mb-2 min-h-[56px]">
                            <h3 className="text-[20px] font-black text-brand-dark dark:text-white uppercase tracking-tighter leading-none mb-1">
                              {t(`${role.key}.title`)}
                            </h3>
                            {role.hasSub && (
                              <span className={`text-[9px] font-black uppercase tracking-widest block ${!role.available ? 'text-gray-400' : 'text-brand-primary'}`}>
                                {t(`${role.key}.sub`)}
                              </span>
                            )}
                          </div>
                          
                          {/* Descripción - Margen mb-8 a mb-4 */}
                          <div className="mb-4 min-h-[48px]">
                            <p className="text-gray-500 dark:text-gray-400 leading-snug font-medium text-[14px]">
                              {t(`${role.key}.desc`)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Botón SABER MÁS */}
                        <div className="mt-auto">
                          <button 
                            onClick={() => role.available && setSelectedRoleDetail(role)}
                            disabled={!role.available}
                            className={`w-full py-3.5 px-4 border text-[10px] uppercase tracking-[0.25em] rounded-xl font-black transition-all duration-300 shadow-sm ${!role.available ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-brand-primary/30 text-brand-primary bg-white dark:bg-brand-darkBg hover:bg-brand-primary hover:text-white hover:border-brand-primary active:scale-95'}`}
                          >
                            {role.available ? t('portal.btn.info').toUpperCase() : 'BLOQUEADO'}
                          </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* IA Matcher Section */}
      <section className="py-24 bg-gray-50/50 dark:bg-brand-darkBg px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-brand-darkCard border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-16 text-center shadow-sm relative overflow-hidden">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-brand-dark dark:text-white mb-6 leading-[1.2] max-w-3xl mx-auto">
                {t('matcher.title')}
              </h3>
              <p className="text-gray-400 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed text-lg font-medium">
                {t('matcher.desc')}
              </p>
              <button 
                onClick={() => setIsMatcherOpen(true)} 
                className="px-12 py-5 bg-brand-primary text-white rounded-full font-black text-sm uppercase tracking-wider shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                {t('matcher.btn')}
              </button>
            </div>
          </div>
      </section>

      {/* Modal Detalle Rol */}
      {selectedRoleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/80 backdrop-blur-md p-4 animate-fade-in overflow-hidden">
          <div className="bg-white dark:bg-brand-darkCard rounded-[2rem] shadow-2xl w-full max-w-full md:max-w-3xl relative animate-fade-in-up border border-gray-100 dark:border-gray-800 flex flex-col max-h-[92vh]">
            
            <button 
              onClick={() => setSelectedRoleDetail(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 hover:scale-110 transition-all z-20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-4">
                <div className={`w-14 h-14 shrink-0 rounded-full ${selectedRoleDetail.modalColor || 'bg-brand-primary'} flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-primary/20`}>
                  {selectedRoleDetail.level}
                </div>
                <div className="text-center md:text-left pt-1">
                  <h3 className="text-xl md:text-2xl font-black text-brand-dark dark:text-white uppercase tracking-tighter mb-1 leading-none">
                    {t(`${selectedRoleDetail.key}.title`)}
                  </h3>
                  {selectedRoleDetail.hasSub && (
                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest block mb-1">
                      {t(`${selectedRoleDetail.key}.sub`)}
                    </span>
                  )}
                  <p className="text-sm md:text-[15px] text-gray-600 dark:text-gray-300 font-medium leading-snug max-w-2xl mt-3">
                    {t(`${selectedRoleDetail.key}.subtitle`)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="bg-[#f8f9fb] dark:bg-brand-darkBg/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <h4 className="text-[9px] font-black text-brand-dark dark:text-gray-400 uppercase tracking-[0.2em] mb-2">
                    {t(`${selectedRoleDetail.key}.perfil_title`)}
                  </h4>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-tight font-medium">
                    {t(`${selectedRoleDetail.key}.perfil_desc`)}
                  </p>
                </div>
                
                <div className="bg-[#f8f9fb] dark:bg-brand-darkBg/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <h4 className="text-[9px] font-black text-brand-dark dark:text-gray-400 uppercase tracking-[0.2em] mb-2">
                    {t(`${selectedRoleDetail.key}.economico_title`)}
                  </h4>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-tight font-medium">
                    {t(`${selectedRoleDetail.key}.economico_desc`)}
                  </p>
                </div>
              </div>

              <div className="mb-5">
                <h4 className="text-[9px] font-black text-brand-dark dark:text-white uppercase tracking-[0.2em] mb-3">
                  {t(`${selectedRoleDetail.key}.funciones_title`)}
                </h4>
                <div className="flex flex-col gap-2.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-brand-success">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-[13px] text-gray-600 dark:text-gray-300 font-medium">
                        {t(`${selectedRoleDetail.key}.f${i}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#f8f9fb] dark:bg-brand-darkBg/20 p-4 rounded-xl border-l-[4px] border-brand-primary mb-6">
                <h4 className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1">
                  {t(`${selectedRoleDetail.key}.ejemplo_title`)}
                </h4>
                <p className="text-[12px] font-medium italic text-gray-500 dark:text-gray-400 leading-snug">
                  {t(`${selectedRoleDetail.key}.ejemplo_desc`)}
                </p>
              </div>

              <button 
                onClick={() => { setSelectedRoleDetail(null); navigate('/registro'); }}
                className="w-full py-4 bg-brand-primary text-white font-black rounded-xl shadow-xl uppercase tracking-[0.3em] text-[10px] hover:scale-[1.01] hover:brightness-110 active:scale-95 transition-all text-center flex items-center justify-center gap-2 group"
              >
                <span>{t('portal.btn.register_now')}</span>
                <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IA Matcher Modal */}
      {isMatcherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-brand-darkCard rounded-[2.5rem] shadow-2xl w-full max-lg overflow-hidden animate-fade-in-up border dark:border-gray-800">
            <div className="px-10 py-8 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-brand-primary text-2xl">✨</span>
                <h3 className="font-black text-brand-dark dark:text-white text-xl tracking-tighter">
                  {t('matcher.modal.title')}
                </h3>
              </div>
              <button onClick={() => setIsMatcherOpen(false)} className="text-gray-400 hover:text-red-500 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-10">
              {!matcherResult ? (
                <>
                  <p className="text-base font-bold text-brand-dark dark:text-gray-200 mb-5 leading-tight">
                    {t('matcher.modal.instruction')}
                  </p>
                  <textarea 
                    value={matcherInput} 
                    onChange={(e) => setMatcherInput(e.target.value)} 
                    placeholder={t('matcher.modal.placeholder')} 
                    className="w-full h-48 p-6 border border-gray-100 dark:bg-brand-darkBg dark:border-gray-700 text-gray-700 dark:text-white rounded-[2rem] focus:ring-1 focus:ring-brand-primary outline-none resize-none mb-8 text-[15px] leading-relaxed placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium shadow-inner" 
                  />
                  <button 
                    onClick={handleMatcherSubmit} 
                    disabled={loadingMatcher || !matcherInput.trim()} 
                    className="w-full py-5 bg-brand-primary text-white font-black rounded-full shadow-xl uppercase tracking-widest text-[13px] disabled:opacity-50 hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    {loadingMatcher ? t('matcher.modal.loading') : t('matcher.modal.btn')}
                  </button>
                </>
              ) : (
                <div className="text-center py-6">
                    <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl">🎉</div>
                    <h4 className="text-3xl font-black text-brand-primary mb-4 uppercase tracking-tighter">{matcherResult.roleName}</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-10 font-medium">{matcherResult.justification}</p>
                    <button 
                      onClick={() => setMatcherResult(null)} 
                      className="text-brand-primary font-black uppercase text-xs tracking-widest hover:underline"
                    >
                      {t('matcher.modal.retry')}
                    </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
