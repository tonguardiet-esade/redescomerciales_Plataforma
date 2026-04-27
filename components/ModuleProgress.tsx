
import React from 'react';
import { UserLevel } from '../types';

interface ModuleProgressProps {
  currentModule: number;
  userLevel: number;
}

const getRoleName = (level: number) => {
  switch (level) {
    case UserLevel.PRESCRIPTOR: return "Prescriptor";
    case UserLevel.COLABORADOR: return "Colaborador";
    // Fix: Updated invalid enum keys to match the definition in types.ts
    case UserLevel.MOCOTA_TIPO_1: return "Delegado (Gestión)";
    case UserLevel.MOCOTA_TIPO_2: return "Oficina Técnica";
    default: return "General";
  }
};

const ModuleProgress = ({ currentModule, userLevel }: ModuleProgressProps) => {
  const roleName = getRoleName(userLevel);
  // El nivel 1 tiene 5 módulos. Los demás tienen 4 módulos + 1 Test Final.
  const stepsCount = 5;
  const steps = [1, 2, 3, 4, 5];

  return (
    <div className="w-full max-w-2xl mx-auto mb-10 px-4">
      {/* Label & Role Info */}
      <div className="text-center mb-6 flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">
          ITINERARIO: <span className="text-brand-dark font-bold border-b-2 border-brand-secondary/30">{roleName.toUpperCase()}</span>
        </span>
        <span className="inline-block px-3 py-1 bg-brand-light border border-brand-primary/20 rounded-full text-xs font-bold text-brand-primary tracking-wide uppercase">
            Progreso Global: Paso {currentModule} de {stepsCount}
        </span>
      </div>

      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 z-0 rounded-full"></div>
        
        {/* Active Progress Line */}
        <div
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-brand-success z-0 rounded-full transition-all duration-500"
          style={{ width: `${((currentModule - 1) / (stepsCount - 1)) * 100}%` }}
        ></div>

        {steps.map((step) => {
          const isCompleted = step < currentModule;
          const isActive = step === currentModule;
          
          let label = `Módulo ${step}`;
          if (userLevel !== UserLevel.PRESCRIPTOR && step === 5) {
              label = "Test Final";
          }

          return (
            <div key={step} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-4 
                ${isActive 
                  ? 'bg-brand-primary text-white border-white shadow-lg scale-110 ring-4 ring-brand-primary/10' 
                  : isCompleted 
                    ? 'bg-brand-success text-white border-white shadow-sm' 
                    : 'bg-gray-100 text-gray-400 border-white'
                }`}
              >
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span className={`absolute top-12 text-[10px] font-bold whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-brand-primary' : (isCompleted ? 'text-brand-success' : 'text-gray-300')}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModuleProgress;
