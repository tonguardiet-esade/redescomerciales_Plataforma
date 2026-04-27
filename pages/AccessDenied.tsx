import React from 'react';
import { Link } from 'react-router-dom';

const AccessDenied = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600 mb-8">No has completado los requisitos necesarios para acceder a esta sección.</p>
        <Link to="/portal" className="text-brand-accent hover:underline font-medium">
          Volver al Portal
        </Link>
      </div>
    </div>
  );
};

export default AccessDenied;