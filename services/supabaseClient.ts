
import { createClient } from '@supabase/supabase-js';

// NOTA: Aquí debes pegar la URL y la ANON KEY de tu NUEVO proyecto de Supabase
// Las encuentras en Settings > API
const supabaseUrl = 'https://zukgpdveyexggaibhfxs.supabase.co'; // Asegúrate de que esta sea la nueva
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1a2dwZHZleWV4Z2dhaWJoZnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjI3NTUsImV4cCI6MjA3OTgzODc1NX0.J8OCjDqwSsL7rdKmfe6JJtVV0Kh_iBLLsN5_qMqCWl0'; // Asegúrate de que esta sea la nueva

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Invoca la Edge Function de HubSpot
 */
export const invokeBackendEvent = async (eventName: string, payload: any) => {
  try {
    const { data, error } = await supabase.functions.invoke('hubspot-integration', {
      body: { event: eventName, ...payload }
    });
    if (error) {
      console.warn("Error en evento HubSpot:", error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.error("Fallo crítico al contactar con HubSpot Edge Function:", e);
    return null;
  }
};
