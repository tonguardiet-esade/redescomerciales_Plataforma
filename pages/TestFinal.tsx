
import React, { useState } from 'react';
import { useUser } from '../context/UserContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { useNavigate } from 'react-router-dom';
import { evaluateTest } from '../services/geminiService.ts';

const TestFinal = () => {
  const { user, updateUser } = useUser();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{passed: boolean, score: number, feedback: string} | null>(null);

  if (!user) return null;
  const isAdmin = user.is_admin_session || user.email === 'admin@redescomerciales.ai' || user.email === 'ia@acceleralia.com' || user.id === 'admin-dev-bypass';

  const questions = [
    { id: 'q1', text: '¿Cuál es la principal barrera de las empresas para pedir ayudas?', type: 'text' },
    { id: 'q2', text: 'Define en una frase la propuesta de valor de RedesComerciales.ai.', type: 'text' },
    { id: 'q3', text: '¿Qué es un fondo perdido?', type: 'text' },
    { id: 'q4', text: '¿Por qué es importante el CNAE en nuestro buscador?', type: 'text' },
    { id: 'q5', text: 'Actitud: Un cliente te dice que no cree en las subvenciones. ¿Qué respondes?', type: 'text' }
  ];

  const handleAnswer = (id: string, val: string) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
  };

  const handleBypass = () => {
    const bypassResult = { passed: true, score: 100, feedback: "Aprobado por modo administrador para revisión de flujos." };
    setResult(bypassResult);
    updateUser({
      test_score: bypassResult.score,
      test_passed: bypassResult.passed,
      test_feedback: bypassResult.feedback
    });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Por favor responde todas las preguntas.");
      return;
    }

    setLoading(true);
    const evalResult = await evaluateTest(answers);
    setLoading(false);

    if (evalResult) {
      setResult(evalResult);
      updateUser({
        test_score: evalResult.score,
        test_passed: evalResult.passed,
        test_feedback: evalResult.feedback
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate('/portal')} className="text-gray-400 hover:text-brand-primary font-bold text-[10px] uppercase tracking-widest transition-colors">
          &larr; Volver al Portal
        </button>
        <div className="flex gap-2">
            {isAdmin && (
              <button onClick={handleBypass} className="bg-brand-secondary text-brand-dark px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
                Bypass Test (Admin)
              </button>
            )}
            {isAdmin && (
              <button onClick={() => navigate('/admin')} className="bg-[#2a364e] text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-125 transition-all shadow-lg">
                Regresar a Admin
              </button>
            )}
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-brand-dark dark:text-white mb-2">Test Final de Competencias</h1>
      <p className="text-gray-500 mb-8 font-medium">Demuestra lo aprendido. La IA evaluará tus respuestas abiertas.</p>

      {!result ? (
        <div className="space-y-8">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white dark:bg-brand-darkCard p-6 rounded-xl border border-gray-200 dark:border-gray-800">
              <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">{idx + 1}. {q.text}</label>
              <textarea
                className="w-full p-3 border border-gray-300 dark:bg-brand-darkBg dark:border-gray-700 dark:text-white rounded focus:ring-brand-primary focus:border-brand-primary text-sm min-h-[100px]"
                rows={3}
                placeholder="Escribe tu respuesta aquí..."
                onChange={(e) => handleAnswer(q.id, e.target.value)}
              ></textarea>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-brand-primary hover:bg-opacity-90 text-white font-black uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-50 transition-all text-sm"
          >
            {loading ? 'Evaluando Test...' : 'Enviar Respuestas para Evaluación IA'}
          </button>
        </div>
      ) : (
        <div className={`text-center p-12 rounded-xl border-2 animate-fade-in-up ${result.passed ? 'border-brand-success bg-green-50 dark:bg-green-900/10' : 'border-red-400 bg-red-50 dark:bg-red-900/10'}`}>
          <div className="text-6xl mb-4">{result.passed ? '🎉' : '❌'}</div>
          <h2 className="text-3xl font-bold mb-4 dark:text-white uppercase tracking-tighter">
            {result.passed ? '¡Has aprobado el Test!' : 'No has superado el Test'}
          </h2>
          <div className={`text-6xl font-black text-brand-dark ${result.passed ? 'dark:text-brand-success' : 'dark:text-red-500'} mb-6`}>{result.score}/100</div>
          <p className="text-base text-gray-700 dark:text-gray-300 mb-8 max-w-lg mx-auto font-medium leading-relaxed">{result.feedback}</p>
          
          <div className="flex flex-col gap-4 items-center">
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/portal')}
                className="px-10 py-4 bg-brand-dark text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all"
              >
                Ir a mi Panel de Carrera
              </button>
              {!result.passed && (
                <button
                  onClick={() => setResult(null)}
                  className="px-10 py-4 bg-brand-primary text-white rounded-xl font-black uppercase tracking-widest text-xs hover:brightness-110 shadow-md"
                >
                  Reintentar Evaluación
                </button>
              )}
            </div>
            {isAdmin && (
              <button onClick={() => navigate('/admin')} className="text-brand-primary font-black uppercase text-[10px] tracking-widest hover:underline mt-4">
                Volver a Gestión General de Candidatos
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestFinal;
