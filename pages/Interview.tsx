import React from 'react';

const Interview = () => {
  return (
    <div className="min-h-screen bg-brand-900 flex flex-col items-center justify-center p-8 text-center text-white">
      <div className="max-w-2xl bg-white text-brand-900 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-4">¡Felicidades!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Has completado con éxito la formación y has sido validado por nuestra IA.
          <br />
          Ahora puedes reservar tu entrevista final con nuestro equipo de Talento.
        </p>
        
        {/* Placeholder for Calendly Embed */}
        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <p className="text-gray-400 font-medium">Embed de Calendly aquí</p>
        </div>
      </div>
    </div>
  );
};

export default Interview;