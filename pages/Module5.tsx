
import React, { useState } from 'react';
import { useUser } from '../context/UserContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { useNavigate } from 'react-router-dom';
import { UserLevel } from '../types.ts';
import ChatAssistant from '../components/ChatAssistant.tsx';
import ModuleProgress from '../components/ModuleProgress.tsx';

const contentData: Record<number, { title: string, objective: string, content: string[] }> = {
  [UserLevel.PRESCRIPTOR]: {
    title: "Proceso dentro de RedesComerciales.ai",
    objective: "Comprender los pasos para conectar correctamente a una organización con el equipo especializado.",
    content: [
      "El proceso es sencillo: 1. Identificar la organización, 2. Explicar RedesComerciales.ai brevemente, 3. Solicitar permiso y 4. Conectar con nuestro equipo.",
      "Una vez realizada la conexión, el equipo de RedesComerciales.ai analiza la oportunidad e identifica la solución que mejor encaja.",
      "Nuestro equipo gestiona todo el proceso comercial y técnico posterior. El colaborador no participa en la negociación ni en la implementación.",
      "Tu valor reside en detectar oportunidades cualificadas y actuar como el puente inicial hacia el equipo adecuado."
    ]
  },
  [UserLevel.COLABORADOR]: {
    title: "Proceso dentro de RedesComerciales.ai",
    objective: "Comprender los pasos para conectar correctamente a una organización con el equipo especializado.",
    content: [
      "El proceso es sencillo: 1. Identificar la organización, 2. Explicar RedesComerciales.ai brevemente, 3. Solicitar permiso y 4. Conectar con nuestro equipo.",
      "Una vez realizada la conexión, el equipo de RedesComerciales.ai analiza la oportunidad e identifica la solución que mejor encaja.",
      "Nuestro equipo gestiona todo el proceso comercial y técnico posterior. El colaborador no participa en la negociación ni en la implementación.",
      "Tu valor reside en detectar oportunidades cualificadas y actuar como el puente inicial hacia el equipo adecuado."
    ]
  }
};

const quizData: Record<number, { title: string, questions: { question: string, options: { text: string, correct: boolean }[] }[] }> = {
  [UserLevel.PRESCRIPTOR]: {
    title: "Validación Módulo 5",
    questions: [
      {
        question: "¿Cuál es el primer paso del proceso?",
        options: [
          { text: "Negociar el precio final", correct: false },
          { text: "Identificar una organización interesada", correct: true },
          { text: "Firmar el contrato técnico", correct: false }
        ]
      },
      {
        question: "¿Quién gestiona el proceso comercial final?",
        options: [
          { text: "El colaborador", correct: false },
          { text: "El cliente de forma autónoma", correct: false },
          { text: "El equipo RedesComerciales.ai", correct: true }
        ]
      },
      {
        question: "¿Cuál es el valor principal del colaborador?",
        options: [
          { text: "Implementar la solución tecnológica", correct: false },
          { text: "Detectar oportunidades cualificadas", correct: true },
          { text: "Gestionar las ventas directamente", correct: false }
        ]
      }
    ]
  },
  [UserLevel.COLABORADOR]: {
    title: "Validación Módulo 5",
    questions: [
      {
        question: "¿Cuál es el primer paso del proceso?",
        options: [
          { text: "Negociar el precio final", correct: false },
          { text: "Identificar una organización interesada", correct: true },
          { text: "Firmar el contrato técnico", correct: false }
        ]
      },
      {
        question: "¿Quién gestiona el proceso comercial final?",
        options: [
          { text: "El colaborador", correct: false },
          { text: "El cliente de forma autónoma", correct: false },
          { text: "El equipo RedesComerciales.ai", correct: true }
        ]
      },
      {
        question: "¿Cuál es el valor principal del colaborador?",
        options: [
          { text: "Implementar la solución tecnológica", correct: false },
          { text: "Detectar oportunidades cualificadas", correct: true },
          { text: "Gestionar las ventas directamente", correct: false }
        ]
      }
    ]
  }
};

const Module5 = () => {
  const { user, updateUser } = useUser();
  const { t } = useSettings();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'content' | 'quiz'>('content');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  if (!user) return null;

  const isAdmin = user.is_admin_session || user.email === 'admin@redescomerciales.ai' || user.email === 'ia@acceleralia.com' || user.id === 'admin-dev-bypass';
  const moduleInfo = contentData[user.nivel_elegido] || contentData[UserLevel.PRESCRIPTOR];
  const data = quizData[user.nivel_elegido] || quizData[UserLevel.PRESCRIPTOR];
  const question = data.questions[currentQuestion];

  const handleBypass = () => {
    updateUser({ m5_completed: true });
    setScore(data.questions.length);
    setShowResult(true);
  };

  const handleResetTest = () => {
    setScore(0);
    setCurrentQuestion(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setShowResult(false);
    setStep('content');
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    const isCorrect = question.options[selectedOption].correct;
    if (isCorrect) setScore(score + 1);
    setIsAnswerChecked(true);

    setTimeout(() => {
        if (currentQuestion < data.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedOption(null);
            setIsAnswerChecked(false);
        } else {
            setShowResult(true);
            if (score + (isCorrect ? 1 : 0) === data.questions.length) {
                updateUser({ m5_completed: true });
            }
        }
    }, 1500);
  };

  const AdminHeader = () => (
    <div className="flex justify-between items-center mb-8">
      <button onClick={() => navigate('/portal')} className="flex items-center gap-2 text-gray-400 hover:text-brand-primary font-bold text-[10px] uppercase tracking-widest transition-colors group">
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        {step === 'quiz' ? 'Salir del Test' : 'Volver al panel'}
      </button>
      {isAdmin && (
        <div className="flex gap-2">
            <button onClick={handleBypass} className="px-4 py-2 bg-brand-secondary text-brand-dark rounded-lg font-black uppercase text-[9px] tracking-widest hover:brightness-110 shadow-lg transition-all">
                Saltar Test (Admin)
            </button>
            <button onClick={() => navigate('/admin')} className="px-4 py-2 bg-[#2a364e] text-white rounded-lg font-bold text-[9px] uppercase tracking-widest hover:brightness-125 transition-all shadow-lg border border-white/10">
                Volver a Gestión Admin
            </button>
        </div>
      )}
    </div>
  );

  if (step === 'content') {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
            <AdminHeader />
            <ModuleProgress currentModule={5} userLevel={user.nivel_elegido} />
            <div className="bg-white dark:bg-brand-darkCard p-10 md:p-12 rounded-[3rem] shadow-card border border-gray-100 dark:border-white/5">
                <h1 className="text-3xl font-black text-brand-dark dark:text-white uppercase tracking-tighter mb-4">{moduleInfo.title}</h1>
                <div className="bg-brand-primary/5 p-6 rounded-2xl border-l-4 border-brand-primary mb-8">
                    <p className="text-xs font-black text-brand-primary uppercase tracking-widest mb-1">Objetivo del módulo</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{moduleInfo.objective}</p>
                </div>
                <div className="space-y-6 mb-10">
                    {moduleInfo.content.map((p, i) => <p key={i} className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{p}</p>)}
                </div>
                <button onClick={() => setStep('quiz')} className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Validar Módulo Final</button>
            </div>
        </div>
    );
  }

  if (showResult) {
      const passed = score === data.questions.length;
      return (
          <div className="max-w-2xl mx-auto px-4 py-12 text-center animate-fade-in">
              <AdminHeader />
              <div className={`p-10 md:p-16 rounded-[3rem] shadow-xl border-2 ${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="text-6xl mb-6">{passed ? '🚀' : '📚'}</div>
                  <h2 className="text-3xl font-black text-brand-dark mb-4 uppercase tracking-tighter">{passed ? '¡Formación Completada!' : 'Repasa para Finalizar'}</h2>
                  <p className="text-gray-600 mb-10 font-bold leading-relaxed">
                      {passed 
                        ? `Enhorabuena. Has completado con éxito todo el itinerario formativo y dominas el proceso de prescripción.`
                        : `Parece que hay dudas sobre el proceso de prescripción. Es fundamental conocer los pasos para conectar correctamente a las organizaciones.`}
                  </p>
                  <div className="flex flex-col gap-4 justify-center items-center">
                    {passed ? (
                        <button onClick={() => navigate('/portal')} className="px-16 py-5 bg-brand-primary text-white font-black rounded-2xl uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Acceder a mi Panel Final</button>
                    ) : (
                        <button onClick={handleResetTest} className="px-16 py-5 bg-brand-dark text-white font-black rounded-2xl uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Recomenzar Módulo</button>
                    )}
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <AdminHeader />
      <ModuleProgress currentModule={5} userLevel={user.nivel_elegido} />
      <div className="bg-white dark:bg-brand-darkCard p-8 md:p-12 rounded-[2.5rem] shadow-card border border-gray-100 dark:border-white/5">
        <div className="mb-10">
            <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Cuestionario de Validación Final</span>
                <span className="text-xs font-bold text-gray-400">{currentQuestion + 1} de {data.questions.length}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-brand-primary transition-all duration-500" 
                    style={{ width: `${((currentQuestion + 1) / data.questions.length) * 100}%` }}
                ></div>
            </div>
        </div>
        <h2 className="text-xl font-bold text-brand-dark dark:text-white mb-10 leading-relaxed">{question.question}</h2>
        <div className="space-y-4">
            {question.options.map((opt, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedOption(idx)} 
                  disabled={isAnswerChecked} 
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-bold text-sm ${
                    isAnswerChecked 
                      ? (opt.correct ? 'bg-green-50 border-brand-success text-brand-success' : (selectedOption === idx ? 'bg-red-50 border-red-500 text-red-800' : 'opacity-50')) 
                      : (selectedOption === idx ? 'bg-brand-light border-brand-primary text-brand-primary' : 'bg-white dark:bg-brand-darkBg dark:text-gray-300')
                  }`}
                >
                    <div className="flex items-center gap-4">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs border ${isAnswerChecked && opt.correct ? 'bg-brand-success text-white border-brand-success' : (selectedOption === idx ? 'bg-brand-primary text-white border-brand-primary' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700')}`}>
                            {String.fromCharCode(65 + idx)}
                        </span>
                        {opt.text}
                    </div>
                </button>
            ))}
        </div>
        <div className="mt-12 flex justify-end">
            {!isAnswerChecked && <button onClick={handleCheckAnswer} disabled={selectedOption === null} className="px-10 py-4 bg-brand-primary text-white rounded-full font-bold shadow-lg uppercase text-[10px] tracking-widest">Confirmar Respuesta</button>}
        </div>
      </div>
    </div>
  );
};

export default Module5;
