
import { invokeBackendEvent } from './supabaseClient';

/**
 * Evento A: Registro de un prescriptor
 */
export const trackRegistration = async (userData: { email: string, nombre: string, nivel: number }) => {
  console.log("Sync HubSpot: Registro", userData.email);
  return await invokeBackendEvent('prescriptor-registered', {
    email: userData.email,
    firstname: userData.nombre,
    tipo_usuario: 'prescriptor',
    nivel_elegido: userData.nivel,
    prescriptor_estado: 'registrado'
  });
};

/**
 * Evento B: Firma del convenio
 */
export const trackContractSignature = async (userData: { email: string, fecha: string }) => {
  console.log("Sync HubSpot: Firma", userData.email);
  return await invokeBackendEvent('convenio-firmado', {
    email: userData.email,
    prescriptor_estado: 'convenio_firmado',
    fecha_firma_convenio: userData.fecha
  });
};

/**
 * Evento C: Nueva Prescripción (Recomendación)
 */
export const trackPrescription = async (prescriptionData: { 
  prescriptor_email: string, 
  candidato_email: string, 
  candidato_nombre: string,
  empresa: string
}) => {
  console.log("Sync HubSpot: Nueva Prescripción", prescriptionData.candidato_email);
  return await invokeBackendEvent('prescripcion-creada', {
    prescriptor_email: prescriptionData.prescriptor_email,
    candidato_email: prescriptionData.candidato_email,
    candidato_nombre: prescriptionData.candidato_nombre,
    empresa: prescriptionData.empresa
  });
};

/**
 * Evento D: Cita de entrevista agendada
 */
export const trackInterviewScheduled = async (interviewData: {
  email: string,
  nombre: string,
  fecha: string,
  hora: string,
  meet_link: string
}) => {
  console.log("Sync HubSpot: Cita Agendada", interviewData.email);
  return await invokeBackendEvent('interview-scheduled', {
    email: interviewData.email,
    firstname: interviewData.nombre,
    fecha_entrevista: interviewData.fecha,
    hora_entrevista: interviewData.hora,
    google_meet_link: interviewData.meet_link,
    prescriptor_estado: 'entrevista_agendada'
  });
};
