/**
 * Servicio para gestionar Google Calendar API y generar enlaces de Meet reales
 */

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// Cuenta corporativa objetivo
export const CORPORATE_EMAIL = "contact@fundswin.ai";
// URL Ofical de Google Meet solicitada
export const OFFICIAL_MEET_LINK = "https://meet.google.com/tup-sjza-gwz";

// El ID de cliente debe tener habilitadas las URLs de origen en Google Cloud Console
const CLIENT_ID = "377433633160-loemout8av7rpr747m2hid93c2tva79b.apps.googleusercontent.com"; 
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

let tokenClient: any;
let gapiInited = false;
let gisInited = false;
let accessToken: string | null = localStorage.getItem('google_access_token');

/**
 * Convierte errores de Google en texto legible para evitar el error [object Object]
 */
const stringifyError = (err: any): string => {
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
        if (err.result?.error?.message) return err.result.error.message;
        if (err.error_description) return err.error_description;
        if (err.error) return typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
        if (err.message) return err.message;
    }
    return "Error de conexión con Google. Verifique que el origen (URL) esté autorizado en su Google Cloud Console.";
};

/**
 * Inicializa los SDK de Google
 */
export const initCalendarAPI = () => {
  return new Promise((resolve) => {
    try {
      const scriptGapi = document.createElement('script');
      scriptGapi.src = "https://apis.google.com/js/api.js";
      scriptGapi.onload = () => {
          window.gapi.load('client', async () => {
            try {
                await window.gapi.client.init({
                  discoveryDocs: [DISCOVERY_DOC],
                });
                gapiInited = true;
                if (accessToken) {
                    window.gapi.client.setToken({ access_token: accessToken });
                }
                checkInit();
            } catch (e) {
                console.error("GAPI error", e);
                gapiInited = true; 
                checkInit();
            }
          });
      };
      document.body.appendChild(scriptGapi);

      const scriptGis = document.createElement('script');
      scriptGis.src = "https://accounts.google.com/gsi/client";
      scriptGis.onload = () => {
          gisInited = true;
          checkInit();
      };
      document.body.appendChild(scriptGis);
    } catch (e) {
      resolve(false);
    }

    function checkInit() {
      if (gapiInited && gisInited) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', 
        });
        resolve(true);
      }
    }
  });
};

/**
 * Solicita inicio de sesión específico para contact@fundswin.ai
 */
export const connectGoogle = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject(new Error("El sistema de Google no está listo. Recargue la página."));
    
    tokenClient.callback = (resp: any) => {
      if (resp.error) {
        reject(new Error(stringifyError(resp)));
        return;
      }
      accessToken = resp.access_token;
      if (accessToken) {
          localStorage.setItem('google_access_token', accessToken);
          window.gapi.client.setToken({ access_token: accessToken });
      }
      resolve(accessToken!);
    };

    try {
        tokenClient.requestAccessToken({ 
            prompt: 'select_account',
            login_hint: CORPORATE_EMAIL 
        });
    } catch (err: any) {
        reject(new Error(stringifyError(err)));
    }
  });
};

export const hasAccessToken = () => !!accessToken;

/**
 * Crea evento en el calendario vinculado
 */
export const createMeetingEvent = async (candidateName: string, candidateEmail: string, date: string, time: string) => {
  if (!accessToken) {
    throw new Error("No hay token de acceso. Por favor, conecte con Google en Ajustes.");
  }

  const startDateTime = `${date}T${time}:00`;
  const endDateTime = new Date(new Date(startDateTime).getTime() + 45 * 60000).toISOString();

  // El evento se crea en el calendario para bloqueo de agenda, 
  // pero forzamos que el enlace guardado sea el oficial de la empresa.
  const event = {
    'summary': `Entrevista RedesComerciales.ai: ${candidateName}`,
    'description': `Candidato: ${candidateName}\nEmail: ${candidateEmail}\nSala de reunión: ${OFFICIAL_MEET_LINK}\nGenerado por RedesComerciales.ai Portal.`,
    'start': { 'dateTime': new Date(startDateTime).toISOString(), 'timeZone': 'Europe/Madrid' },
    'end': { 'dateTime': endDateTime, 'timeZone': 'Europe/Madrid' },
    'attendees': [{ 'email': candidateEmail }],
    // No solicitamos conferenceData dinámica para usar el enlace fijo solicitado
  };

  try {
    const response = await window.gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': event,
      'sendUpdates': 'all' 
    });

    return {
      meetLink: OFFICIAL_MEET_LINK,
      eventId: response.result.id,
    };
  } catch (err: any) {
    if (err.status === 401) {
        accessToken = null;
        localStorage.removeItem('google_access_token');
        throw new Error("Sesión expirada. Por favor, vuelva a conectar en Ajustes.");
    }
    throw new Error(stringifyError(err));
  }
};