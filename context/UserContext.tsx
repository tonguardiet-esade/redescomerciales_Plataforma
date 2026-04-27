
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { User, UserLevel } from '../types';
import { supabase } from '../services/supabaseClient';

const OFFICIAL_MEET_LINK = "https://meet.google.com/tup-sjza-gwz";

const isUuid = (id: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(id);
};

interface UserContextType {
  user: User | null;
  registerUser: (data: Partial<User> & { password?: string }) => void;
  loginAsGuest: (level?: UserLevel, asAdmin?: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  manualLogin: (user: User) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const findUserInTables = async (userId: string): Promise<{ data: any, tableName: string } | null> => {
  if (!isUuid(userId)) return null;
  
  // Demo IDs bypass
  const demoProfiles: Record<string, any> = {
    '00000000-0000-4000-a000-000000000001': { table: 'Prescritor', data: { id: userId, email: 'prescriptor@redes.ai', nombre_completo: 'Test Prescriptor', nivel_elegido: 1, estado_actual: 'producción activa' } },
    '00000000-0000-4000-a000-000000000002': { table: 'Colaborador', data: { id: userId, email: 'colaborador@redes.ai', nombre_completo: 'Test Colaborador', nivel_elegido: 2, estado_actual: 'producción activa' } },
    '00000000-0000-4000-a000-000000000003': { table: 'Delegado_Sin_Redaccion', data: { id: userId, email: 'delegado@redes.ai', nombre_completo: 'Test Delegado', nivel_elegido: 3, estado_actual: 'producción activa' } },
    '00000000-0000-4000-a000-000000000004': { table: 'Delegado_Oficina_Tecnica', data: { id: userId, email: 'franquicia@redes.ai', nombre_completo: 'Test Franquicia', nivel_elegido: 4, estado_actual: 'producción activa' } }
  };

  if (demoProfiles[userId]) {
    return { data: demoProfiles[userId].data, tableName: demoProfiles[userId].table };
  }

  const tables = ["Prescritor", "Colaborador", "Delegado_Sin_Redaccion", "Delegado_Oficina_Tecnica"];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').eq('id', userId).single();
    if (data && !error) return { data, tableName: table };
  }
  return null;
};

export const mapDbUserToAppUser = (dbUser: any): User => {
  console.log("Mapping DB User to App User:", dbUser);
  const isAdmin = dbUser.correo === 'admin@redescomerciales.ai' || dbUser.email === 'admin@redescomerciales.ai' || dbUser.correo === 'ia@acceleralia.com' || dbUser.email === 'ia@acceleralia.com' || dbUser.id === '00000000-0000-0000-0000-000000000000';
  
  const cv = dbUser.cv_link || '';
  const linkedin = dbUser.linkedin_url || '';
  const status = (dbUser.application_status || (dbUser.nivel_elegido === 2 ? 'not_started' : 'approved')).toLowerCase();
  const estado = dbUser.estado_actual || 'en formación';

  // Inferencia de progreso: Si el estado es 'producción activa', consideramos todo completado
  // Esto es un fallback por si faltan columnas en algunas tablas de Supabase (como Prescritor)
  const isProduccionActiva = estado === 'producción activa';

  return {
    id: dbUser.id,
    nombre: dbDbUserToAppUser_nombre(dbUser),
    email: dbUser.correo || dbUser.email || '',
    telefono: dbUser.telefono || '',
    nivel_elegido: dbUser.nivel_elegido || 1,
    fecha_registro: dbUser.fecha_registro || new Date().toISOString(),
    is_admin_session: isAdmin,
    application_status: status as any,
    cv_link: cv,
    linkedin_url: linkedin,
    cover_letter: dbUser.cover_letter || '',
    contract_signed: isProduccionActiva || dbUser.contract_signed || dbUser.convenio_firmado || false,
    m1_completed: isProduccionActiva || dbUser.m1_completed || false,
    m2_completed: isProduccionActiva || dbUser.m2_completed || false,
    m3_completed: isProduccionActiva || dbUser.m3_completed || false,
    m4_completed: isProduccionActiva || dbUser.m4_completed || false,
    m5_completed: isProduccionActiva || dbUser.m5_completed || false,
    test_score: dbUser.test_score,
    test_passed: isProduccionActiva || dbUser.test_passed || false,
    task_score: dbUser.task_score || null,
    task_status: dbUser.task_status || 'pending',
    interview_date: dbUser.interview_date,
    interview_time: dbUser.interview_time,
    meet_link: OFFICIAL_MEET_LINK,
    estado_actual: estado,
    vertical: dbUser.vertical
  };
};

function dbDbUserToAppUser_nombre(dbUser: any) {
    return dbUser.nombre_completo || dbUser.nombre || '';
}

export const UserProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userTableName, setUserTableName] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const storedUserId = localStorage.getItem('fundswin_user_id');
      if (!storedUserId) return;

      if (storedUserId === 'demo' || storedUserId === 'admin-dev-bypass' || !isUuid(storedUserId)) {
        const storedDemoUser = localStorage.getItem('fundswin_demo_user');
        if (storedDemoUser) setUser(JSON.parse(storedDemoUser));
      } else {
        try {
          const result = await findUserInTables(storedUserId);
          if (result) {
            setUser(mapDbUserToAppUser(result.data));
            setUserTableName(result.tableName);
          }
        } catch (err) {
          console.error("Error inicializando sesión:", err);
        }
      }
    };
    initialize();
  }, []);

  const manualLogin = useCallback((userData: User) => {
    const isAdmin = userData.email === 'admin@redescomerciales.ai' || userData.email === 'ia@acceleralia.com' || userData.id === '00000000-0000-0000-0000-000000000000';
    setUser({ ...userData, meet_link: OFFICIAL_MEET_LINK, is_admin_session: isAdmin });
    localStorage.setItem('fundswin_user_id', userData.id);
    
    if (!isUuid(userData.id)) {
        localStorage.setItem('fundswin_demo_user', JSON.stringify(userData));
        setUserTableName(null);
        return;
    }

    let table = "";
    switch(userData.nivel_elegido) {
        case 1: table = "Prescritor"; break;
        case 2: table = "Colaborador"; break;
        case 3: table = "Delegado_Sin_Redaccion"; break;
        case 4: table = "Delegado_Oficina_Tecnica"; break;
        default: table = "Prescritor";
    }
    setUserTableName(table);
  }, []);

  const loginAsGuest = useCallback((level: UserLevel = UserLevel.PRESCRIPTOR, asAdmin: boolean = false) => {
    const demoId = asAdmin ? "00000000-0000-0000-0000-000000000000" : "11111111-1111-1111-1111-111111111111";
    const demoUser: User = {
      id: demoId, nombre: asAdmin ? "Admin (Simulando)" : "Usuario Invitado", 
      email: asAdmin ? "admin@redescomerciales.ai" : "invitado@demo.com", 
      telefono: "000000000",
      is_admin_session: asAdmin,
      nivel_elegido: level, fecha_registro: new Date().toISOString(),
      application_status: level === UserLevel.COLABORADOR ? 'pending' : 'approved', 
      contract_signed: false, 
      m1_completed: false, m2_completed: false, m3_completed: false, m4_completed: false, m5_completed: false,
      test_score: null, test_passed: false, task_score: null, task_status: 'pending', 
      meet_link: OFFICIAL_MEET_LINK,
      estado_actual: 'demo'
    };
    setUser(demoUser);
    localStorage.setItem('fundswin_user_id', demoId);
    localStorage.setItem('fundswin_demo_user', JSON.stringify(demoUser));
    setUserTableName(null);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);

    if (!isUuid(user.id)) {
        localStorage.setItem('fundswin_demo_user', JSON.stringify(updatedUser));
        return;
    }

    // Determinamos la tabla si no la tenemos (pasa en recargas rápidas)
    let tableName = userTableName;
    if (!tableName) {
        switch(user.nivel_elegido) {
            case 1: tableName = "Prescritor"; break;
            case 2: tableName = "Colaborador"; break;
            case 3: tableName = "Delegado_Sin_Redaccion"; break;
            case 4: tableName = "Delegado_Oficina_Tecnica"; break;
            default: tableName = "Prescritor";
        }
    }

    if (tableName) {
        const payload: any = {};
        if (updates.nombre !== undefined) payload.nombre_completo = updates.nombre;
        if (updates.m1_completed !== undefined) payload.m1_completed = updates.m1_completed;
        if (updates.m2_completed !== undefined) payload.m2_completed = updates.m2_completed;
        if (updates.m3_completed !== undefined) payload.m3_completed = updates.m3_completed;
        if (updates.m4_completed !== undefined) payload.m4_completed = updates.m4_completed;
        if (updates.m5_completed !== undefined) payload.m5_completed = updates.m5_completed;
        if (updates.test_passed !== undefined) payload.test_passed = updates.test_passed;
        if (updates.test_score !== undefined) payload.test_score = updates.test_score;
        if (updates.contract_signed !== undefined) {
            payload.contract_signed = updates.contract_signed;
            // Intentamos ambos nombres de columna por compatibilidad
            payload.convenio_firmado = updates.contract_signed;
        }
        if (updates.estado_actual !== undefined) payload.estado_actual = updates.estado_actual;
        if (updates.application_status !== undefined) payload.application_status = updates.application_status;
        if (updates.cv_link !== undefined) payload.cv_link = updates.cv_link;
        if (updates.linkedin_url !== undefined) payload.linkedin_url = updates.linkedin_url;
        if (updates.cover_letter !== undefined) payload.cover_letter = updates.cover_letter;
        if (updates.vertical !== undefined) payload.vertical = updates.vertical;

        if (Object.keys(payload).length > 0) {
            console.log(`Guardando en ${tableName} para ID ${user.id}:`, payload);
            try {
                const { error } = await supabase.from(tableName).update(payload).eq('id', user.id);
                if (error) {
                    // Si falla por columna inexistente, intentamos actualizar campo por campo silenciosamente
                    const isMissingColumnError = error.message.includes('column') && 
                        (error.message.includes('does not exist') || error.message.includes('schema cache') || error.message.includes('Could not find'));
                    
                    if (isMissingColumnError) {
                        console.log(`Detectada columna inexistente en ${tableName}. Intentando actualización campo por campo...`);
                        for (const key of Object.keys(payload)) {
                            const singleFieldPayload = { [key]: payload[key] };
                            const { error: singleError } = await supabase
                                .from(tableName)
                                .update(singleFieldPayload)
                                .eq('id', user.id);
                            
                            if (singleError) {
                                const isSingleMissingColumnError = singleError.message.includes('column') && 
                                    (singleError.message.includes('does not exist') || singleError.message.includes('schema cache') || singleError.message.includes('Could not find'));
                                
                                if (!isSingleMissingColumnError) {
                                    console.error(`Error al actualizar campo ${key} en ${tableName}:`, singleError.message);
                                } else {
                                    // Silenciamos la advertencia para no saturar la consola si ya sabemos que falta
                                    // console.warn(`Campo ${key} no existe en la tabla ${tableName}, ignorando.`);
                                }
                            }
                        }
                    } else {
                        console.error("Error sincronización Supabase:", error.message);
                    }
                }
            } catch (err) {
                console.error("Excepción en updateUser:", err);
            }
        }
    }
  }, [user, userTableName]);

  const logout = useCallback(() => {
    setUser(null);
    setUserTableName(null);
    localStorage.removeItem('fundswin_user_id');
    localStorage.removeItem('fundswin_demo_user');
    supabase.auth.signOut();
  }, []);

  const value = useMemo(() => ({
    user, registerUser: () => {}, loginAsGuest, updateUser, logout, manualLogin
  }), [user, loginAsGuest, updateUser, logout, manualLogin]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
