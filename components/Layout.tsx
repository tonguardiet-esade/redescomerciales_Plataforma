
import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const logoUrl = "https://grantswin.fra1.digitaloceanspaces.com/PUBLIC/logos-FundsWin/PNG/FundsWin-horizontal.png"; // TODO: Replace with RedesComerciales.ai logo


interface LayoutProps {
  children?: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useUser();
  const { lang, setLang, theme, toggleTheme, t } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  
  const isAdmin = user && (user.email === 'admin@redescomerciales.ai' || user.id === 'admin-dev-bypass');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    navigate('/');
    setTimeout(() => { logout(); }, 100);
  };

  const languages = [
    { code: 'es', label: 'Español' },
    { code: 'ca', label: 'Català' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' }
  ];

  const currentLangLabel = languages.find(l => l.code === lang)?.code.toUpperCase() || 'ES';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-brand-darkBg text-white' : 'bg-brand-light text-brand-dark'}`}>
      <header className={`sticky top-0 z-40 border-b transition-all duration-300 ${theme === 'dark' ? 'bg-brand-darkBg/90 border-gray-800' : 'bg-white/90 border-gray-100'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center group cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-white shadow-sm overflow-hidden">
                  <svg viewBox="0 0 100 100" className="w-8 h-8">
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
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tighter text-brand-dark dark:text-white leading-none">
                    Redes<span className="text-brand-primary">comerciales.ai</span>
                  </span>
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-[0.15em] mt-1">
                    TRANSFORMA COLABORADORES EN UNA RED DE VENTAS ACTIVA
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
                onClick={toggleTheme}
                className="p-2 rounded-xl text-gray-400 dark:text-yellow-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
                {theme === 'dark' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 16.243l.707.707M7.757 7.757l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
            </button>

            <div className="relative" ref={langMenuRef}>
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{currentLangLabel}</span>
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-brand-darkCard rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-fade-in-up">
                  {languages.map((l) => (
                    <button 
                      key={l.code}
                      onClick={() => { setLang(l.code as any); setIsLangMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-5 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${lang === l.code ? 'text-brand-dark dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      <span>{l.label}</span>
                      {lang === l.code && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <nav className="flex items-center gap-4 border-l border-gray-200 dark:border-gray-700 pl-4 ml-1">
              {user ? (
                <>
                  {isAdmin && location.pathname !== '/admin' && (
                    <Link to="/admin" className={`px-4 py-1.5 rounded-lg text-xs font-extrabold uppercase bg-brand-primary/10 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary hover:text-white transition-all`}>
                      {t('nav.admin')}
                    </Link>
                  )}
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-sm font-bold dark:text-white leading-tight">{user.nombre}</span>
                    <span className="text-[9px] text-brand-secondary uppercase font-black tracking-widest">{user.estado_actual.toUpperCase()}</span>
                  </div>
                  <button onClick={handleLogout} className="text-sm font-bold text-gray-400 hover:text-brand-primary transition-colors">{t('nav.logout')}</button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                    <Link to="/login" className="hidden md:block text-sm font-bold text-brand-dark dark:text-gray-300 hover:text-brand-primary transition-colors">{t('nav.login')}</Link>
                    <Link to="/registro" className="px-6 py-2 bg-brand-primary text-white text-sm font-bold rounded-full shadow-lg hover:scale-105 transition-all">{t('nav.register')}</Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className={`py-12 mt-auto border-t transition-colors duration-300 ${theme === 'dark' ? 'bg-brand-darkBg border-gray-800 text-gray-400' : 'bg-brand-dark text-white border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center mb-6">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-white/10">
                  <svg viewBox="0 0 100 100" className="w-6 h-6">
                    <line x1="50" y1="25" x2="30" y2="45" stroke="white" strokeWidth="2.5" />
                    <line x1="50" y1="25" x2="70" y2="45" stroke="white" strokeWidth="2.5" />
                    <line x1="30" y1="45" x2="50" y2="75" stroke="white" strokeWidth="2.5" />
                    <line x1="70" y1="45" x2="50" y2="75" stroke="white" strokeWidth="2.5" />
                    
                    <circle cx="30" cy="45" r="8" fill="#E31E24" />
                    <circle cx="70" cy="45" r="8" fill="#E31E24" />
                    <circle cx="50" cy="75" r="10" fill="#E31E24" />
                    
                    <circle cx="50" cy="25" r="4" fill="white" />
                    <circle cx="30" cy="45" r="3" fill="white" />
                    <circle cx="70" cy="45" r="3" fill="white" />
                    <circle cx="50" cy="75" r="3" fill="white" />
                    <circle cx="82" cy="60" r="4" fill="white" />
                  </svg>
                </div>
                <span className="text-xl font-black tracking-tighter text-white">
                  Redes<span className="text-brand-primary">comerciales.ai</span>
                </span>
              </div>
              <span className="text-[6px] font-black text-white/40 uppercase tracking-[0.2em]">
                TRANSFORMA COLABORADORES EN UNA RED DE VENTAS ACTIVA
              </span>
            </div>
          </div>
          <p className="text-xs opacity-70">&copy; {new Date().getFullYear()} Redescomerciales.ai. {t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
