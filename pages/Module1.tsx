
import React, { useState } from 'react';
import { useUser } from '../context/UserContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { useNavigate } from 'react-router-dom';
import { UserLevel } from '../types.ts';
import ChatAssistant from '../components/ChatAssistant.tsx';
import ModuleProgress from '../components/ModuleProgress.tsx';

const contentData: Record<number, { title: string, objective: string, content: string[] }> = {
  [UserLevel.PRESCRIPTOR]: {
    title: "Qué es RedesComerciales.ai y qué problema resuelve",
    objective: "Que el usuario comprenda que RedesComerciales.ai es un ecosistema de soluciones para la formación y ventas.",
    content: [
      "RedesComerciales.ai es un ecosistema de soluciones tecnológicas impulsadas por Inteligencia Artificial diseñado para ayudar a empresas a transformar sus colaboradores en una red de ventas activa.",
      "El ecosistema aborda uno de los principales problemas del mercado: la dificultad de escalar equipos comerciales de forma eficiente y estructurada.",
      "RedesComerciales.ai ofrece herramientas para: identificar oportunidades, formar equipos y gestionar procesos comerciales de alto rendimiento.",
      "En lugar de resolver solo una parte, RedesComerciales.ai integra soluciones especializadas que cubren distintas fases del proceso de ventas de forma estructurada, eficiente y segura."
    ]
  },
  [UserLevel.COLABORADOR]: {
    title: "Qué es RedesComerciales.ai y qué problema resuelve",
    objective: "Que el usuario comprenda que RedesComerciales.ai es un ecosistema de soluciones para la formación y ventas.",
    content: [
      "RedesComerciales.ai es un ecosistema de soluciones tecnológicas impulsadas por Inteligencia Artificial diseñado para ayudar a empresas a transformar sus colaboradores en una red de ventas activa.",
      "El ecosistema aborda uno de los principales problemas del mercado: la dificultad de escalar equipos comerciales de forma eficiente y estructurada.",
      "RedesComerciales.ai ofrece herramientas para: identificar oportunidades, formar equipos y gestionar procesos comerciales de alto rendimiento.",
      "En lugar de resolver solo una parte, RedesComerciales.ai integra soluciones especializadas que cubren distintas fases del proceso de ventas de forma estructurada, eficiente y segura."
    ]
  }
};

const quizData: Record<number, { title: string, questions: { question: string, options: { text: string, correct: boolean }[] }[] }> = {
  [UserLevel.PRESCRIPTOR]: {
    title: "Validación Módulo 1",
    questions: [
      {
        question: "¿Qué es RedesComerciales.ai?",
        options: [
          { text: "Un ecosistema de soluciones para formación y ventas", correct: true },
          { text: "Una consultora tradicional de ventas", correct: false },
          { text: "Un organismo que vende productos directamente", correct: false }
        ]
      },
      {
        question: "¿Qué problema busca resolver RedesComerciales.ai?",
        options: [
          { text: "Falta de productos para vender", correct: false },
          { text: "La dificultad de escalar equipos comerciales", correct: true },
          { text: "Falta de financiación privada", correct: false }
        ]
      },
      {
        question: "¿Cómo aborda RedesComerciales.ai el acceso a nuevas ventas?",
        options: [
          { text: "Mediante un ecosistema de soluciones especializadas", correct: true },
          { text: "Sustituyendo el criterio humano por IA", correct: false },
          { text: "Garantizando ventas sin esfuerzo", correct: false }
        ]
      }
    ]
  },
  [UserLevel.COLABORADOR]: {
    title: "Validación Módulo 1",
    questions: [
      {
        question: "¿Qué es RedesComerciales.ai?",
        options: [
          { text: "Un ecosistema de soluciones para formación y ventas", correct: true },
          { text: "Una consultora tradicional de ventas", correct: false },
          { text: "Un organismo que vende productos directamente", correct: false }
        ]
      },
      {
        question: "¿Qué problema busca resolver RedesComerciales.ai?",
        options: [
          { text: "Falta de productos para vender", correct: false },
          { text: "La dificultad de escalar equipos comerciales", correct: true },
          { text: "Falta de financiación privada", correct: false }
        ]
      },
      {
        question: "¿Cómo aborda RedesComerciales.ai el acceso a nuevas ventas?",
        options: [
          { text: "Mediante un ecosistema de soluciones especializadas", correct: true },
          { text: "Sustituyendo el criterio humano por IA", correct: false },
          { text: "Garantizando ventas sin esfuerzo", correct: false }
        ]
      }
    ]
  }
};

const Module1 = () => {
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
    updateUser({ m1_completed: true });
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

  const handleOptionClick = (idx: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(idx);
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
                updateUser({ m1_completed: true });
            }
        }
    }, 1500); // Un poco más de tiempo para asimilar el feedback visual
  };

  const AdminHeader = () => (
    <div className="flex justify-between items-center mb-8">
      <button onClick={() => navigate('/portal')} className="flex items-center gap-2 text-gray-400 hover:text-brand-primary font-bold text-[10px] uppercase tracking-widest transition-colors group">
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        {step === 'quiz' ? 'Salir del Test' : 'Volver al panel'}
      </button>
      {isAdmin && (
        <div className="flex gap-2">
            <button onClick={handleBypass} className="px-4 py-2 bg-brand-secondary text-brand-dark rounded-lg font-black uppercase text-[9px] tracking-widest hover:brightness-110 shadow-lg transition-all animate-pulse">
                🚀 Saltar Módulo (Admin)
            </button>
        </div>
      )}
    </div>
  );

  if (step === 'content') {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
            <AdminHeader />
            <ModuleProgress currentModule={1} userLevel={user.nivel_elegido} />
            <div className="bg-white dark:bg-brand-darkCard p-10 md:p-12 rounded-[3rem] shadow-card border border-gray-100 dark:border-white/5">
                <h1 className="text-3xl font-black text-brand-dark dark:text-white uppercase tracking-tighter mb-4">{moduleInfo.title}</h1>
                <div className="bg-brand-primary/5 p-6 rounded-2xl border-l-4 border-brand-primary mb-8">
                    <p className="text-xs font-black text-brand-primary uppercase tracking-widest mb-1">Objetivo del módulo</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{moduleInfo.objective}</p>
                </div>
                <div className="space-y-6 mb-10">
                    {moduleInfo.content.map((p, i) => <p key={i} className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{p}</p>)}
                </div>
                <button onClick={() => setStep('quiz')} className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Realizar Test de Validación</button>
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
                  <div className="text-6xl mb-6">{passed ? '🏆' : '📚'}</div>
                  <h2 className="text-3xl font-black text-brand-dark mb-4 uppercase tracking-tighter">{passed ? '¡Módulo Superado!' : 'Necesitas Repasar'}</h2>
                  <p className="text-gray-600 mb-10 font-bold leading-relaxed">
                      {passed 
                        ? `Excelente trabajo. Has acertado todas las preguntas (${score}/${data.questions.length}).`
                        : `No has superado el test de validación. Has acertado ${score} de ${data.questions.length} preguntas. Para avanzar, es necesario obtener el 100%.`}
                  </p>
                  <div className="flex flex-col gap-4 justify-center items-center">
                    {passed ? (
                        <button onClick={() => navigate('/portal')} className="w-full md:w-auto px-16 py-5 bg-brand-primary text-white font-black rounded-2xl uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Volver al Panel Principal</button>
                    ) : (
                        <button onClick={handleResetTest} className="w-full md:w-auto px-16 py-5 bg-brand-dark text-white font-black rounded-2xl uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
                            Recomenzar Módulo
                        </button>
                    )}
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <AdminHeader />
      <ModuleProgress currentModule={1} userLevel={user.nivel_elegido} />
      <div className="bg-white dark:bg-brand-darkCard p-8 md:p-12 rounded-[2.5rem] shadow-card border border-gray-100 dark:border-white/5">
        <div className="mb-10">
            <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Cuestionario de Validación</span>
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
            {question.options.map((opt, idx) => {
                let btnClass = "w-full text-left p-5 rounded-2xl border-2 transition-all font-bold text-sm ";
                if (isAnswerChecked) {
                    if (opt.correct) btnClass += "bg-green-50 border-brand-success text-brand-success";
                    else if (selectedOption === idx) btnClass += "bg-red-50 border-red-500 text-red-800";
                    else btnClass += "bg-gray-50 border-gray-100 text-gray-300 opacity-50";
                } else {
                    if (selectedOption === idx) btnClass += "bg-brand-light border-brand-primary text-brand-primary";
                    else btnClass += "bg-white dark:bg-brand-darkBg border-gray-100 dark:border-gray-800 dark:text-gray-300";
                }
                return (
                    <button key={idx} onClick={() => handleOptionClick(idx)} disabled={isAnswerChecked} className={btnClass}>
                        <div className="flex items-center gap-4">
                            <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs border ${isAnswerChecked && opt.correct ? 'bg-brand-success text-white border-brand-success' : (selectedOption === idx ? 'bg-brand-primary text-white border-brand-primary' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700')}`}>
                                {String.fromCharCode(65 + idx)}
                            </span>
                            {opt.text}
                        </div>
                    </button>
                )
            })}
        </div>
        <div className="mt-12 flex justify-end">
            {!isAnswerChecked && <button onClick={handleCheckAnswer} disabled={selectedOption === null} className="px-10 py-4 bg-brand-primary text-white rounded-full font-bold shadow-lg uppercase text-[10px] tracking-widest">Confirmar Respuesta</button>}
        </div>
      </div>
      <ChatAssistant context={`Módulo 1: ${moduleInfo.title}`} />
    </div>
  );
};

export default Module1;
