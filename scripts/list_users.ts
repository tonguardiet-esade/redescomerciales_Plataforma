
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zukgpdveyexggaibhfxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1a2dwZHZleWV4Z2dhaWJoZnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjI3NTUsImV4cCI6MjA3OTgzODc1NX0.J8OCjDqwSsL7rdKmfe6JJtVV0Kh_iBLLsN5_qMqCWl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
  const tables = ["Prescritor", "Colaborador", "Delegado_Sin_Redaccion", "Delegado_Oficina_Tecnica"];
  for (const table of tables) {
    console.log(`Checking ${table}...`);
    const { data, error } = await supabase.from(table).select('correo, nombre_completo, contrasena');
    if (error) console.error(error);
    else console.log(data);
  }
}

listUsers();
