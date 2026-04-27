
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zukgpdveyexggaibhfxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1a2dwZHZleWV4Z2dhaWJoZnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjI3NTUsImV4cCI6MjA3OTgzODc1NX0.J8OCjDqwSsL7rdKmfe6JJtVV0Kh_iBLLsN5_qMqCWl0';

const supabase = createClient(supabaseUrl, supabaseKey);

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

async function createTestUsers() {
  const users = [
    { email: 'user.prescriptor@redescomerciales.ai', pass: 'Redes2024!', nivel: 1, table: 'Prescritor', role: 'Prescriptor' },
    { email: 'user.colaborador@redescomerciales.ai', pass: 'Redes2024!', nivel: 2, table: 'Colaborador', role: 'Colaborador' },
    { email: 'user.delegado@redescomerciales.ai', pass: 'Redes2024!', nivel: 3, table: 'Delegado_Sin_Redaccion', role: 'Delegado comercial' },
    { email: 'user.franquicia@redescomerciales.ai', pass: 'Redes2024!', nivel: 4, table: 'Delegado_Oficina_Tecnica', role: 'Franquicia MOCOTA' }
  ];

  for (const u of users) {
    console.log(`Intentando crear usuario: ${u.email}...`);
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.pass,
      options: {
        data: { nombre_completo: `Test ${u.role}`, telefono: '+34 600000000', nivel_seleccionado: u.role }
      }
    });

    if (error) {
      console.error(`Error al registrar ${u.email}:`, error.message);
      await wait(10000); // Wait longer on error
      continue;
    }

    if (data.user) {
      console.log(`Registrado Auth. Insertando en tabla ${u.table}...`);
      const { error: insError } = await supabase.from(u.table).insert({
        id: data.user.id,
        nombre_completo: `Test ${u.role}`,
        correo: u.email,
        telefono: '+34 600000000',
        contrasena: u.pass,
        nivel_elegido: u.nivel,
        estado_actual: 'en formación',
        application_status: 'approved',
        contract_signed: true
      });
      if (insError) console.error(`Error insertando en ${u.table}:`, insError.message);
      else console.log(`Usuario ${u.email} creado correctamente.`);
    }
    await wait(10000); // 10 seconds between users
  }
}

createTestUsers();
