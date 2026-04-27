
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { FunctionsFetchError } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { UserLevel } from '../types.ts';
import { jsPDF } from 'jspdf';
import { trackInterviewScheduled } from '../services/backendEvents';
import { OFFICIAL_MEET_LINK, initCalendarAPI, connectGoogle, hasAccessToken, createMeetingEvent } from '../services/calendarService';
import { GoogleGenAI } from "@google/genai";

// --- ICONOS ---
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Calendar: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>,
  Prescription: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Contract: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Chat: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Clock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  ArrowUp: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>,
  Search: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
};

const AdminDashboard = () => {
  const { user, loginAsGuest } = useUser();
  const { theme } = useSettings();
  const navigate = useNavigate();

  // --- DATOS DE MOCK COMPLETOS ---
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const fetchCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    console.log("AdminDashboard: Starting fetchCandidates...");
    try {
        const tables = ["Prescritor", "Colaborador", "Delegado_Sin_Redaccion", "Delegado_Oficina_Tecnica"];
        let allCandidates: any[] = [];
        
        for (const table of tables) {
            console.log(`AdminDashboard: Fetching from table: ${table}`);
            const { data, error } = await supabase.from(table).select('*');
            
            if (error) {
                console.error(`AdminDashboard: Error fetching from ${table}:`, error);
                continue;
            }
            
            console.log(`AdminDashboard: Fetched ${data?.length || 0} candidates from ${table}`);
            
            if (data && data.length > 0) {
                console.log(`AdminDashboard: Sample data from ${table}:`, data[0]);
                const mapped = data.map(dbUser => {
                    const level = table === "Prescritor" ? "PRESCRIPTOR" : 
                                  table === "Colaborador" ? "COLABORADOR" : 
                                  table === "Delegado_Sin_Redaccion" ? "DELEGADO COMERCIAL" : "FRANQUICIA MOCOTA";
                    
                    return {
                        id: dbUser.id,
                        nombre: dbUser.nombre_completo || dbUser.nombre || 'Sin nombre',
                        email: dbUser.correo || dbUser.email || '',
                        nivel: level,
                        m1_completed: dbUser.m1_completed,
                        m2_completed: dbUser.m2_completed,
                        m3_completed: dbUser.m3_completed,
                        m4_completed: dbUser.m4_completed,
                        m5_completed: dbUser.m5_completed,
                        test_passed: dbUser.test_passed,
                        contract_signed: !!(dbUser.contract_signed || dbUser.convenio_firmado),
                        estado: dbUser.application_status || 'PENDING',
                        cv_link: dbUser.cv_link,
                        linkedin_url: dbUser.linkedin_url,
                        cover_letter: dbUser.cover_letter,
                        vertical: dbUser.vertical
                    };
                });
                allCandidates = [...allCandidates, ...mapped];
            }
        }
        console.log(`AdminDashboard: Total candidates mapped: ${allCandidates.length}`);
        setCandidates(allCandidates);
    } catch (err) {
        console.error("AdminDashboard: Critical error in fetchCandidates:", err);
    } finally {
        setLoadingCandidates(false);
    }
  }, []);

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  const fetchPrescriptions = useCallback(async () => {
    setLoadingPrescriptions(true);
    try {
        const { data, error } = await supabase.from('Prescripciones').select('*').order('fecha_creacion', { ascending: false });
        if (error) throw error;
        if (data) {
            setPrescriptions(data.map(p => ({
                id: p.id,
                empresa: p.nombre_empresa,
                contacto: p.nombre_interesado,
                email: p.email_contacto,
                prescriptor: p.prescriptor_nombre,
                vertical: p.vertical,
                estado: p.estado
            })));
        }
    } catch (err) {
        console.error("Error fetching prescriptions:", err);
    } finally {
        setLoadingPrescriptions(false);
    }
  }, []);

  const [contracts, setContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  const fetchContracts = useCallback(async () => {
    setLoadingContracts(true);
    try {
        const { data, error } = await supabase
            .from('Firmas_Contratos')
            .select('*');
            
        if (error) throw error;
        
        if (data) {
            // Sort by id descending as a fallback if created_at is missing
            const sortedData = [...data].sort((a, b) => (b.id > a.id ? 1 : -1));

            setContracts(sortedData.map(sig => ({
                id: sig.id,
                firmante: sig.nombre_firmante || 'Sin nombre',
                nivel: sig.nivel_contrato,
                fecha: sig.created_at ? new Date(sig.created_at).toLocaleDateString() : 
                       (sig.fecha_firma ? new Date(sig.fecha_firma).toLocaleDateString() : 'N/A'),
                firma: sig.firma_manuscrita || sig.nombre_firmante || 'Firma Digital',
                email: sig.email_firmante,
                hash: sig.hash_confirmacion,
                ip: sig.ip_firma
            })));
        }
    } catch (err) {
        console.error("Error fetching contracts:", err);
    } finally {
        setLoadingContracts(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
    fetchPrescriptions();
    fetchContracts();
    initCalendarAPI().then(() => {
        setIsGoogleConnected(hasAccessToken());
    });

    // --- SUSCRIPCIONES EN TIEMPO REAL ---
    const tables = ["Prescritor", "Colaborador", "Delegado_Sin_Redaccion", "Delegado_Oficina_Tecnica", "Firmas_Contratos", "Prescripciones"];
    
    const channels = tables.map(table => {
      return supabase
        .channel(`realtime-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: table }, () => {
          console.log(`Realtime update on ${table}`);
          if (table === "Prescripciones") {
            fetchPrescriptions();
          } else if (table === "Firmas_Contratos") {
            fetchContracts();
          } else {
            fetchCandidates();
            fetchContracts();
          }
        })
        .subscribe();
    });

    const prescriptionsChannel = supabase
      .channel('realtime-prescriptions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Prescripciones' }, () => {
        console.log('Realtime update on Prescripciones');
        fetchPrescriptions();
      })
      .subscribe();

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
      supabase.removeChannel(prescriptionsChannel);
    };
  }, [fetchCandidates, fetchPrescriptions, fetchContracts]);

  const [appointments, setAppointments] = useState([
    { id: 'a1', date: '2026-02-03', time: '10:30 AM', title: 'Entrevista Beatriz Sánchez', level: 'Nivel 2 • Colaborador', meet_link: OFFICIAL_MEET_LINK },
    { id: 'a2', date: '2026-02-18', time: '12:00 PM', title: 'Reunión Silvia Sánchez', level: 'Nivel 1 • Prescriptor', meet_link: OFFICIAL_MEET_LINK }
  ]);

  // Se inicia el chat vacío como solicitaste
  const [supportChats, setSupportChats] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);

  // --- ESTADOS DE UI ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'candidates' | 'prescriptions' | 'interviews' | 'contracts' | 'settings' | 'chat'>('dashboard');
  const [activeFilter, setActiveFilter] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSimLevel, setSelectedSimLevel] = useState<number>(3);
  const [selectedDate, setSelectedDate] = useState('2026-02-18');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddApptModalOpen, setIsAddApptModalOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(hasAccessToken());
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const selectedChat = useMemo(() => supportChats.find(c => c.id === selectedChatId), [supportChats, selectedChatId]);
  const [adminReply, setAdminReply] = useState("");
  const [newAppt, setNewAppt] = useState({ candidateId: '', time: '10:00' });

  const fetchSupportChats = useCallback(async () => {
    setLoadingChats(true);
    try {
        console.log("Fetching support chats...");
        // Obtenemos todos los mensajes de soporte
        const { data, error } = await supabase
            .from('Soporte')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error("Supabase error fetching chats:", error);
            throw error;
        }

        console.log("Messages received:", data?.length);

        // Agrupamos por usuario para mostrar la lista de conversaciones
        const chatsByUser: { [key: string]: any } = {};
        data?.forEach(msg => {
            if (!msg.user_id) return;
            
            if (!chatsByUser[msg.user_id]) {
                chatsByUser[msg.user_id] = {
                    id: msg.user_id,
                    user: msg.user_name || msg.user_email || 'Usuario Desconocido',
                    email: msg.user_email,
                    lastMsg: msg.message,
                    time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    unread: false,
                    messages: []
                };
            }
            // Añadimos el mensaje a la lista (en orden cronológico para el detalle)
            chatsByUser[msg.user_id].messages.unshift({
                id: msg.id,
                role: msg.role,
                text: msg.message,
                time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        });

        const chatList = Object.values(chatsByUser);
        console.log("Grouped chats:", chatList.length);
        setSupportChats(chatList);
    } catch (err) {
        console.error("Error fetching support chats:", err);
    } finally {
        setLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
        fetchSupportChats();

        // Suscripción en tiempo real para nuevos mensajes de soporte
        const channel = supabase
            .channel('admin-support')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'Soporte'
            }, () => {
                fetchSupportChats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
  }, [activeTab, fetchSupportChats]);

  useEffect(() => {
    if (!user?.is_admin_session && user?.email !== 'admin@redescomerciales.ai' && user?.email !== 'ia@acceleralia.com') {
      navigate('/portal');
    }
  }, [user, navigate]);

  // --- FILTRADO ---
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesFilter = activeFilter === 'TODOS' || c.nivel === activeFilter;
      const matchesSearch = c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [candidates, activeFilter, searchQuery]);

  const counts = useMemo(() => ({
    TODOS: candidates.length,
    PRESCRIPTOR: candidates.filter(c => c.nivel === 'PRESCRIPTOR').length,
    COLABORADOR: candidates.filter(c => c.nivel === 'COLABORADOR').length,
    GESTION: candidates.filter(c => c.nivel === 'GESTIÓN').length,
    TECNICA: candidates.filter(c => c.nivel === 'OFICINA TÉCNICA').length,
  }), [candidates]);

  // --- ACCIONES ---
  const handleSimulate = () => {
    loginAsGuest(selectedSimLevel as any, true);
    navigate('/portal');
  };

  const handleSendAdminReply = async () => {
    if (!adminReply.trim() || !selectedChat) return;
    
    const messageText = adminReply;
    const userId = selectedChat.id;
    const userEmail = selectedChat.email;
    const userName = selectedChat.user;
    
    setAdminReply("");

    try {
        const { error } = await supabase.from('Soporte').insert({
            user_id: userId,
            user_email: userEmail,
            user_name: userName,
            message: messageText,
            role: 'support'
        });
        
        if (error) throw error;
        
        // El useEffect con la suscripción se encargará de refrescar la lista
    } catch (err) {
        console.error("Error sending admin reply:", err);
        alert("Error al enviar respuesta");
    }
  };

  const handleDeleteChat = async (userId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta conversación?")) return;
    
    try {
        const { error } = await supabase
            .from('Soporte')
            .delete()
            .eq('user_id', userId);
        
        if (error) throw error;
        
        if (selectedChatId === userId) {
            setSelectedChatId(null);
        }
        fetchSupportChats();
    } catch (err) {
        console.error("Error deleting chat:", err);
        alert("Error al eliminar la conversación");
    }
  };

  const handleDownloadPDF = (contract: any) => {
    const doc = new jsPDF();
    const userName = contract.firmante;
    const userEmail = contract.email || "N/A";
    const userLevel = contract.nivel;
    const userSig = contract.firma;
    const roleName = userLevel === 1 ? 'Prescriptor' : userLevel === 2 ? 'Colaborador' : 'Delegado';
    const date = contract.fecha;
    const hash = contract.hash || Math.random().toString(36).substr(2, 9).toUpperCase();
    const ip = contract.ip || '0.0.0.0';

    doc.setFillColor(45, 62, 80);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("REDESCOMERCIALES.AI ECOSYSTEM", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text("CERTIFICADO DE CONVENIO DIGITAL", 105, 30, { align: "center" });

    doc.setTextColor(45, 62, 80);
    doc.setFontSize(14);
    doc.text("CONDICIONES GENERALES DEL PROGRAMA DE COLABORADORES REDESCOMERCIALES.AI", 20, 55);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const content = `
El presente documento regula las condiciones aplicables a la participación en el Programa de Colaboradores de RedesComerciales.ai (en adelante, el “Programa”), ofrecido por ACCELERALIA S.L, con domicilio social en CAN BRUIXA, 16 y NIF B01998426 (en adelante, “Acceleralia”).

DATOS DEL FIRMANTE:
- Nombre: ${userName.toUpperCase()}
- Correo Electrónico: ${userEmail}
- Nivel: Nivel ${userLevel} (${roleName})
- Fecha de Firma: ${date}
- ID Certificado: RC-CERT-${hash}
- IP Registro: ${ip}

1. Objeto
El Colaborador colabora con RedesComerciales.ai recomendando potenciales clientes o contactos de su red profesional, sin asumir funciones comerciales, contractuales ni de representación.

2. Naturaleza de la relación
La presente relación tiene carácter mercantil y no exclusivo, no existiendo relación laboral, societaria ni de agencia entre las partes.

3. Obligaciones del Colaborador
El Colaborador se compromete a:
• Actuar de buena fe y conforme a la legalidad vigente.
• No asumir compromisos en nombre de RedesComerciales.ai.
• No utilizar la marca RedesComerciales.ai de forma indebida o no autorizada.
• Asegurarse de que las personas o entidades cuyos datos facilite a RedesComerciales.ai han sido informadas previamente de la referencia y han consentido, o al menos conocen, que podrán ser contactadas por el equipo comercial de RedesComerciales.ai, comprometiéndose asimismo a referir únicamente contactos que, a su leal saber y entender, tengan un interés razonable y encajen con el perfil de potencial cliente de los servicios ofrecidos por RedesComerciales.ai.

4. Compensación
En caso de que una referencia realizada por el Colaborador derive en la contratación efectiva de los servicios de RedesComerciales.ai, este podrá percibir la comisión correspondiente conforme a las condiciones publicadas en la plataforma en el momento del cierre.

5. Propiedad intelectual y confidencialidad
El Colaborador no adquiere ningún derecho sobre la tecnología, marca o contenidos de RedesComerciales.ai y se compromete a mantener la confidencialidad de la información no pública a la que pudiera tener acceso.

6. Protección de datos
Los datos personales serán tratados conforme a la Política de Privacidad disponible en la plataforma, en cumplimiento del Reglamento (UE) 2016/679 (RGPD).

7. Legislación aplicable y jurisdicción
El presente acuerdo se rige por la legislación española. Las partes se someten a los Juzgados y Tribunales de Barcelona, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.
    `;
    doc.text(doc.splitTextToSize(content, 170), 20, 65);

    // --- PÁGINA 2 ---
    doc.addPage();
    doc.setFillColor(45, 62, 80);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("REDESCOMERCIALES.AI ECOSYSTEM", 105, 20, { align: "center" });
    
    doc.setTextColor(45, 62, 80);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    const registrationText = `REGISTRO DE FIRMA: El usuario acepta electrónicamente el presente documento mediante acción afirmativa desde su cuenta registrada, quedando constancia de fecha, hora, IP (${ip}), Hash (${hash}) y versión del documento.`;
    const footerY = 60;
    doc.text(doc.splitTextToSize(registrationText, 170), 20, footerY);

    const signatureY = footerY + 35;
    doc.setDrawColor(184, 78, 157);
    doc.line(20, signatureY + 5, 100, signatureY + 5);
    doc.setFont("courier", "italic");
    doc.setFontSize(22);
    doc.setTextColor(184, 78, 157);
    doc.text(userSig, 25, signatureY);
    
    doc.save(`Convenio_RedesComerciales_${userName.replace(/\s+/g, '_')}.pdf`);
  };

  const handleInvite = async (candidate: any, type: string) => {
    setIsGeneratingDraft(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Actúa como un reclutador experto de RedesComerciales.ai. Redacta un email breve para ${candidate.nombre}. Invitación a entrevista de 15 min por Meet para el puesto de ${candidate.nivel}. Tono ejecutivo y fintech. No inventes fechas ni horas, di que le enviaremos un calendario. Máximo 3 párrafos. Firma: Equipo de Talento de RedesComerciales.ai.`,
      });
      
      const generatedText = response.text || "";
      setEmailDraft(generatedText);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Error generating invitation draft:", error);
      alert("Error al generar el borrador del email");
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedCandidate) return;
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-interview', { 
        body: { 
          to: selectedCandidate.email, 
          content: emailDraft, 
          subject: 'Invitación a entrevista - RedesComerciales.ai' 
        },
        headers: {
          'Content-Type': 'application/json',
          'X-Region': 'eu-central-1'
        }
      });

      if (error) {
        console.error("Full Supabase Function Error:", error);
        throw error;
      }

      alert(`Email enviado correctamente a ${selectedCandidate.email}`);
      setShowPreviewModal(false);
      handleUpdateStatus('RRHH');
    } catch (error: any) {
      console.error("Error sending email:", error);
      
      if (error instanceof FunctionsFetchError || error.name === 'FunctionsFetchError') {
        alert('Error de conexión (CORS): La función de Supabase no permite peticiones desde este dominio');
      } else {
        alert(`Error al enviar el email: ${error.message || 'Error desconocido'}. Revisa la consola para más detalles.`);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleForceComplete = async () => {
    if (!selectedCandidate) return;
    
    const confirm = window.confirm("¿Estás seguro de que quieres marcar a este candidato como finalizado? Se marcarán todos los módulos como completados y el contrato como firmado.");
    if (!confirm) return;

    const updates = {
      m1_completed: true,
      m2_completed: true,
      m3_completed: true,
      m4_completed: true,
      m5_completed: true,
      test_passed: true,
      contract_signed: true,
      convenio_firmado: true,
      application_status: 'SELECTED',
      estado_actual: 'producción activa'
    };

    try {
        let tableName = "";
        switch(selectedCandidate.nivel) {
            case "PRESCRIPTOR": tableName = "Prescritor"; break;
            case "COLABORADOR": tableName = "Colaborador"; break;
            case "GESTIÓN": tableName = "Delegado_Sin_Redaccion"; break;
            case "OFICINA TÉCNICA": tableName = "Delegado_Oficina_Tecnica"; break;
        }
        
        if (tableName) {
            const { error } = await supabase.from(tableName).update(updates).eq('id', selectedCandidate.id);
            if (error) throw error;
            
            // Actualizar estado local
            setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? { ...c, ...updates, contract_signed: true, estado: 'SELECTED' } : c));
            setIsManageModalOpen(false);
            alert("Candidato finalizado con éxito.");
        }
    } catch (err) {
        console.error("Error forcing completion:", err);
        alert("Error al forzar la finalización.");
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedCandidate) return;
    
    setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? { ...c, estado: newStatus } : c));
    setIsManageModalOpen(false);

    try {
        let tableName = "";
        switch(selectedCandidate.nivel) {
            case 'PRESCRIPTOR': tableName = "Prescritor"; break;
            case 'COLABORADOR': tableName = "Colaborador"; break;
            case 'GESTIÓN': tableName = "Delegado_Sin_Redaccion"; break;
            case 'OFICINA TÉCNICA': tableName = "Delegado_Oficina_Tecnica"; break;
        }
        
        if (tableName) {
            const { error } = await supabase.from(tableName).update({ application_status: newStatus }).eq('id', selectedCandidate.id);
            if (error) throw error;
        }
    } catch (err) {
        console.error("Error updating status in DB:", err);
    }
  };


  const handleConnectGoogle = async () => {
    setGoogleLoading(true);
    try {
        await connectGoogle();
        setIsGoogleConnected(true);
        alert("Google Calendar conectado correctamente para contact@redescomerciales.ai");
    } catch (err: any) {
        alert(err.message || "Error al conectar con Google");
    } finally {
        setGoogleLoading(false);
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
  if (!selectedCandidate || isDeleting) return;
    
    setIsDeleting(true);
        try {
       // Determinamos la tabla correcta según el nivel del candidato
        let tableName = "";
        const nivel = selectedCandidate.nivel;
        
        if (nivel === 'PRESCRIPTOR') tableName = "Prescritor";
        else if (nivel === 'COLABORADOR') tableName = "Colaborador";
        else if (nivel === 'GESTIÓN') tableName = "Delegado_Sin_Redaccion";
        else if (nivel === 'OFICINA TÉCNICA') tableName = "Delegado_Oficina_Tecnica";
        
        if (!tableName) throw new Error("No se pudo determinar la tabla del candidato");

        // 1. Eliminamos las prescripciones asociadas para evitar errores de clave foránea
        const { error: presError } = await supabase.from('Prescripciones').delete().eq('prescriptor_id', candidateId);
        if (presError) console.warn("Error deleting associated prescriptions:", presError);
        
        // 2. Eliminamos las firmas de contratos asociadas
        const { error: contractError } = await supabase.from('Firmas_Contratos').delete().eq('user_id', candidateId);
        if (contractError) console.warn("Error deleting associated contract signatures:", contractError);

        // 3. Eliminamos posibles registros en Soporte (si existen)
        const { error: supportError } = await supabase.from('Soporte').delete().eq('user_id', candidateId);
        if (supportError) console.warn("Error deleting associated support tickets:", supportError);

        // 4. Ejecutamos el borrado en la tabla física de Supabase
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', candidateId);

        if (error) throw error;
            
            // Solo actualizamos el estado local si la respuesta de Supabase fue exitosa
        setCandidates(prev => prev.filter(c => c.id !== candidateId));
            setIsConfirmingDelete(false);
            setIsManageModalOpen(false);
            setSelectedCandidate(null);
        } catch (err: any) {
            console.error("Error deleting candidate from Supabase:", err);
            alert(`Error crítico al eliminar en Supabase: ${err.message || 'No se pudo completar la operación'}. El candidato no ha sido borrado.`);
        } finally {
            setIsDeleting(false);
    }
  };

  const handleUpdatePrescriptionStatus = async (newStatus: string) => {
    if (!selectedPrescription) return;

    setPrescriptions(prev => prev.map(p => p.id === selectedPrescription.id ? { ...p, estado: newStatus } : p));
    setIsPrescriptionModalOpen(false);

    try {
        const { error } = await supabase.from('Prescripciones').update({ estado: newStatus }).eq('id', selectedPrescription.id);
        if (error) throw error;
    } catch (err) {
        console.error("Error updating prescription status in DB:", err);
    }
  };

  const handleSaveAppt = async () => {
    const cand = candidates.find(c => c.id === newAppt.candidateId);
    if (!cand) return;
    
    const meetLink = OFFICIAL_MEET_LINK;
    
    // Si está conectado a Google, creamos el evento real
    if (isGoogleConnected) {
        try {
            await createMeetingEvent(cand.nombre, cand.email, selectedDate, newAppt.time);
        } catch (err) {
            console.error("Error creating Google Calendar event:", err);
            // Continuamos aunque falle el calendario para no bloquear el flujo
        }
    }
    
    const newAppointment = {
      id: Math.random().toString(36).substr(2, 9),
      date: selectedDate, 
      time: newAppt.time,
      title: `Entrevista ${cand.nombre}`, 
      level: `Nivel 1 • ${cand.nivel}`,
      meet_link: meetLink
    };

    setAppointments([...appointments, newAppointment]);
    
    // Notificar al sistema (HubSpot / Email)
    try {
      // 1. Sincronizar con HubSpot
      await trackInterviewScheduled({
        email: cand.email,
        nombre: cand.nombre,
        fecha: selectedDate,
        hora: newAppt.time,
        meet_link: meetLink
      });

      // 2. Enviar Email Directo (para que funcione sin esperar a HubSpot)
      await supabase.functions.invoke('send-interview', {
        body: {
          email: cand.email,
          name: cand.nombre,
          date: selectedDate,
          time: newAppt.time,
          meet_link: meetLink
        }
      });
    } catch (err) {
      console.error("Error notifying interview:", err);
    }

    setIsAddApptModalOpen(false);
  };

  const dateAppointments = useMemo(() => appointments.filter(a => a.date === selectedDate), [appointments, selectedDate]);

  return (
    <div className={`flex h-screen font-sans ${theme === 'dark' ? 'bg-[#1a2333]' : 'bg-[#f8f9fb]'}`}>
        
        {/* SIDEBAR */}
        <aside className="w-64 bg-brand-dark text-white flex flex-col pt-8 shrink-0 shadow-2xl z-50">
            <div className="px-8 mb-12 flex justify-center">
                <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest">Panel de Control</p>
            </div>
            <nav className="flex flex-col gap-1">
                <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Icons.Dashboard />} label="Resumen" />
                <NavItem active={activeTab === 'candidates'} onClick={() => setActiveTab('candidates')} icon={<Icons.Users />} label="Candidatos" />
                <NavItem active={activeTab === 'prescriptions'} onClick={() => setActiveTab('prescriptions')} icon={<Icons.Prescription />} label="Prescripciones" />
                <NavItem active={activeTab === 'interviews'} onClick={() => setActiveTab('interviews')} icon={<Icons.Calendar />} label="Agenda" />
                <NavItem active={activeTab === 'contracts'} onClick={() => setActiveTab('contracts')} icon={<Icons.Contract />} label="Convenios Firmados" />
                <NavItem active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<Icons.Chat />} label="Chat Soporte" />
                <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Icons.Settings />} label="Ajustes" />
            </nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-20 flex items-center justify-between px-12 bg-white dark:bg-[#1a2333] border-b dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-4">
                   <div className="w-1.5 h-8 bg-brand-primary rounded-full"></div>
                   <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white leading-none">
                      {activeTab === 'dashboard' ? 'Resumen Ejecutivo' : activeTab === 'candidates' ? 'Gestión de Talento' : activeTab === 'contracts' ? 'Convenios Firmados' : activeTab === 'prescriptions' ? 'Oportunidades Referidas' : activeTab === 'interviews' ? 'Agenda de Entrevistas' : activeTab === 'chat' ? 'Conversaciones de Soporte' : 'Configuración de Sistema'}
                   </h2>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black text-brand-dark dark:text-white uppercase leading-none">Administrador General</p>
                        <p className="text-[9px] font-bold text-brand-secondary uppercase tracking-widest">En formación</p>
                    </div>
                    <button 
                        onClick={() => {
                            fetchCandidates();
                            fetchPrescriptions();
                            fetchContracts();
                            fetchSupportChats();
                        }} 
                        className={`p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-brand-primary transition-all ${(loadingCandidates || loadingPrescriptions || loadingContracts || loadingChats) ? 'animate-spin' : ''}`}
                    >
                        <Icons.Refresh />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-12 pb-12 custom-scrollbar bg-[#f8f9fb] dark:bg-[#1a2333]">
                
                {/* 1. RESUMEN */}
                {activeTab === 'dashboard' && (
                    <div className="pt-10 animate-fade-in space-y-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard label="Candidatos Totales" value="9" color="text-brand-dark" trend="+12%" icon={<Icons.Users />} />
                            <StatCard label="Citas Agendadas" value="4" color="text-brand-secondary" trend="+5%" icon={<Icons.Calendar />} />
                            <StatCard label="Pendientes Revisión" value="3" color="text-yellow-500" trend="-2%" icon={<Icons.Clock />} />
                            <StatCard label="Aprobados Finales" value="3" color="text-brand-success" trend="+8%" icon={<Icons.ArrowUp />} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white dark:bg-brand-darkCard p-12 rounded-[2.5rem] shadow-sm border dark:border-white/5">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10">Actividad de Registro (Últimos 7 días)</h3>
                                <div className="h-48 flex items-end gap-4 px-4 border-b border-gray-100 dark:border-gray-800">
                                    {[20, 35, 15, 50, 70, 45, 60].map((h, i) => (
                                        <div key={i} className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-t-xl relative group">
                                            <div className="absolute bottom-0 w-full bg-brand-primary/20 rounded-t-xl transition-all duration-700" style={{ height: `${h}%` }}></div>
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-400 opacity-0 group-hover:opacity-100">{(h/10).toFixed(0)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-brand-darkCard p-12 rounded-[2.5rem] shadow-sm border dark:border-white/5">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10">Distribución por Rol</h3>
                                <div className="space-y-8">
                                    <ProgressRow label="PRESCRIPTOR" count={7} total={9} color="#E31E24" />
                                    <ProgressRow label="COLABORADOR" count={1} total={9} color="#1D5A96" />
                                    <ProgressRow label="OFICINA TÉCNICA" count={1} total={9} color="#2D3E50" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. CANDIDATOS */}
                {activeTab === 'candidates' && (
                    <div className="pt-10 animate-fade-in space-y-10">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="relative group w-full md:w-96">
                                <span className="absolute inset-y-0 left-6 flex items-center text-gray-300 group-focus-within:text-brand-primary transition-colors"><Icons.Search /></span>
                                <input type="text" placeholder="Buscar candidato..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white dark:bg-brand-darkCard border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all font-medium text-sm" />
                            </div>
                            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-white/5">
                                <FilterPill label="TODOS" count={counts.TODOS} active={activeFilter === 'TODOS'} onClick={() => setActiveFilter('TODOS')} />
                                <FilterPill label="PRESCRIPTOR" count={counts.PRESCRIPTOR} active={activeFilter === 'PRESCRIPTOR'} onClick={() => setActiveFilter('PRESCRIPTOR')} />
                                <FilterPill label="COLABORADOR" count={counts.COLABORADOR} active={activeFilter === 'COLABORADOR'} onClick={() => setActiveFilter('COLABORADOR')} />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-brand-darkCard rounded-[2.5rem] shadow-sm overflow-hidden border dark:border-white/5">
                            <table className="w-full text-left">
                                <thead className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b dark:border-white/5 bg-gray-50/50">
                                    <tr>
                                        <th className="px-12 py-8">Candidato</th>
                                        <th className="px-6 py-8 text-center">Nivel</th>
                                        <th className="px-6 py-8 text-center">Plataforma</th>
                                        <th className="px-6 py-8 text-center w-[180px]">Progreso</th>
                                        <th className="px-6 py-8 text-center">Estado</th>
                                        <th className="px-12 py-8 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-white/5">
                                    {loadingCandidates ? (
                                        <tr>
                                            <td colSpan={6} className="px-12 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Cargando candidatos...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredCandidates.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-12 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-40">
                                                    <Icons.Users />
                                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No se encontraron candidatos</p>
                                                    <button 
                                                        onClick={fetchCandidates}
                                                        className="mt-2 px-6 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                                                    >
                                                        Reintentar búsqueda
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCandidates.map(c => (
                                            <tr key={`${c.id}-${c.nivel}`} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                                                <td className="px-12 py-8">
                                                    <div className="font-bold text-[15px] dark:text-white leading-tight mb-1">{c.nombre}</div>
                                                    <div className="text-[11px] text-gray-400 font-medium tracking-tight">{c.email}</div>
                                                </td>
                                                <td className="px-6 py-8 text-center"><span className="text-[10px] font-black uppercase text-brand-primary tracking-widest bg-brand-primary/5 px-3 py-1 rounded-lg">{c.nivel}</span></td>
                                                <td className="px-6 py-8 text-center">
                                                    <span className="text-[10px] font-black uppercase text-brand-secondary tracking-widest bg-brand-secondary/5 px-3 py-1 rounded-lg">
                                                        {c.vertical || 'RedesComerciales.ai'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-8 text-center w-[180px]">
                                                    <ProgressBadge candidate={c} />
                                                </td>
                                                <td className="px-6 py-8 text-center"><StatusBadge status={c.estado} /></td>
                                                <td className="px-12 py-8 text-right flex items-center justify-end gap-3">
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                await supabase.functions.invoke('send-interview', {
                                                                    body: {
                                                                        email: 'xaviucles@gmail.com',
                                                                        name: c.nombre,
                                                                        date: '2026-02-25',
                                                                        time: '10:00 AM',
                                                                        meet_link: OFFICIAL_MEET_LINK
                                                                    }
                                                                });
                                                                alert('Correo de prueba enviado a xaviucles@gmail.com');
                                                            } catch (err) {
                                                                alert('Error al enviar prueba');
                                                            }
                                                        }}
                                                        className="px-4 py-3 bg-brand-secondary/10 text-brand-secondary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-secondary hover:text-white transition-all shadow-sm"
                                                    >
                                                        Enviar Prueba Email
                                                    </button>
                                                    <button onClick={() => { setSelectedCandidate(c); setIsManageModalOpen(true); }} className="px-10 py-3 bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase hover:bg-brand-primary transition-all shadow-sm active:scale-95">Gestionar</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. PRESCRIPCIONES */}
                {activeTab === 'prescriptions' && (
                    <div className="pt-10 animate-fade-in space-y-8">
                        <div className="bg-white dark:bg-brand-darkCard rounded-[2.5rem] shadow-sm border dark:border-white/5 overflow-hidden">
                            <div className="p-10 border-b dark:border-white/5 flex items-center justify-between">
                                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Oportunidades Referidas</h3>
                                <input type="text" placeholder="Filtrar por empresa..." className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-primary" />
                            </div>
                            <table className="w-full text-left">
                                <thead className="text-[9px] font-black uppercase text-gray-400 tracking-widest bg-gray-50/50">
                                    <tr>
                                        <th className="px-10 py-6">Empresa Referida</th>
                                        <th className="px-6 py-6 text-center">Prescriptor</th>
                                        <th className="px-6 py-6 text-center">Plataforma</th>
                                        <th className="px-6 py-6 text-center">Estado</th>
                                        <th className="px-10 py-6 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-white/5">
                                    {prescriptions.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                                            <td className="px-10 py-6">
                                                <div className="font-bold text-sm dark:text-white leading-tight">{p.empresa}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">{p.contacto} • {p.email}</div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="font-bold text-sm text-brand-dark dark:text-gray-300">{p.prescriptor}</div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className="text-[10px] font-black uppercase text-brand-primary tracking-widest bg-brand-primary/5 px-3 py-1 rounded-lg">
                                                    {p.vertical || 'RedesComerciales.ai'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className={`px-4 py-1.5 text-[9px] rounded-full font-black tracking-widest border ${
                                                    p.estado === 'ACEPTADA' ? 'bg-green-50 border-green-200 text-brand-success' : 
                                                    p.estado === 'RECHAZADA' ? 'bg-red-50 border-red-200 text-red-600' :
                                                    'bg-yellow-50 border-yellow-200 text-yellow-600'
                                                }`}>{p.estado}</span>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <button 
                                                    onClick={() => { setSelectedPrescription(p); setIsPrescriptionModalOpen(true); }}
                                                    className="px-8 py-2.5 bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase hover:bg-brand-primary transition-all"
                                                >
                                                    Gestionar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 4. AGENDA */}
                {activeTab === 'interviews' && (
                    <div className="pt-10 animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-10 h-full pb-10">
                        <div className="lg:col-span-2 bg-white dark:bg-brand-darkCard p-12 rounded-[3.5rem] shadow-sm border dark:border-white/5">
                            <div className="flex items-center justify-between mb-12">
                                <h3 className="text-xl font-black text-brand-dark dark:text-white uppercase tracking-tighter">Calendario de Selección</h3>
                                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-dark dark:text-white">Febrero de 2026</span>
                            </div>
                            <div className="grid grid-cols-7 gap-4">
                                {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁ', 'DOM'].map(d => <div key={d} className="text-center text-[9px] font-black text-gray-400 mb-6">{d}</div>)}
                                {Array.from({length: 28}).map((_, i) => {
                                    const day = i + 1;
                                    const dateStr = `2026-02-${day.toString().padStart(2, '0')}`;
                                    const hasCitas = appointments.some(a => a.date === dateStr);
                                    const isSelected = selectedDate === dateStr;
                                    return (
                                        <button key={i} onClick={() => setSelectedDate(dateStr)} className={`h-24 rounded-[2.5rem] border transition-all flex flex-col items-center justify-center hover:scale-105 relative ${isSelected ? 'bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/20' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-white/5 text-brand-dark dark:text-gray-300'}`}>
                                            <span className="font-black text-sm">{day}</span>
                                            {hasCitas && <span className={`absolute bottom-4 text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-indigo-100 text-brand-primary'}`}>{appointments.filter(a => a.date === dateStr).length} cita</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-brand-darkCard p-12 rounded-[3.5rem] shadow-sm border dark:border-white/5 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-12 pb-8 border-b dark:border-white/5">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalle {selectedDate}</h3>
                                <button onClick={() => setIsAddApptModalOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-primary text-white hover:scale-110 shadow-lg shadow-brand-primary/30 transition-all"><Icons.Plus /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-6">
                                {dateAppointments.length > 0 ? dateAppointments.map(a => (
                                    <div key={a.id} className="p-8 bg-gray-50 dark:bg-[#1a2333] rounded-[2rem] border-l-4 border-brand-primary relative group">
                                        <button onClick={() => setAppointments(prev => prev.filter(x => x.id !== a.id))} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"><Icons.Trash /></button>
                                        <p className="text-[8px] font-black text-brand-primary uppercase mb-2">{a.time}</p>
                                        <p className="font-black text-sm text-brand-dark dark:text-white mb-1 leading-snug">{a.title}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight mb-4">{a.level}</p>
                                        
                                        <button 
                                            onClick={() => window.open(a.meet_link || 'https://meet.google.com/new', '_blank')}
                                            className="w-full py-3 bg-white dark:bg-gray-800 border border-brand-primary/20 text-brand-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15 8v8H5V8h10m1-2H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-2.5l4 4v-11l-4 4V8c0-1.1-.9-2-2-2z"/></svg>
                                            Unirse a Google Meet
                                        </button>
                                    </div>
                                )) : <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest mt-20 opacity-40">Sin citas para hoy</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. CONVENIOS */}
                {activeTab === 'contracts' && (
                    <div className="pt-10 animate-fade-in">
                        <div className="bg-white dark:bg-brand-darkCard rounded-[2.5rem] shadow-sm border dark:border-white/5 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                                    <tr>
                                        <th className="px-10 py-6">Firmante</th>
                                        <th className="px-6 py-6 text-center">Firma Digital</th>
                                        <th className="px-10 py-6 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-white/5">
                                    {contracts.map(c => (
                                        <tr key={`${c.id}-${c.nivel}`} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                                            <td className="px-10 py-6">
                                                <div className="font-bold text-sm dark:text-white leading-tight">{c.firmante}</div>
                                                <div className="text-[10px] text-gray-400 uppercase">NIVEL {c.nivel} • {c.fecha}</div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className="text-2xl text-brand-primary opacity-50" style={{ fontFamily: 'cursive' }}>{c.firma}</span>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <button onClick={() => handleDownloadPDF(c)} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-brand-dark dark:text-white rounded-xl text-[9px] font-black uppercase hover:bg-brand-primary hover:text-white transition-all">Descargar PDF</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* MODULO CHAT SOPORTE (Ahora vacío por defecto) */}
                {activeTab === 'chat' && (
                    <div className="pt-10 animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-160px)]">
                        <div className="lg:col-span-1 bg-white dark:bg-brand-darkCard rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden">
                            <div className="p-8 border-b dark:border-white/5 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conversaciones Activas</h3>
                                <button 
                                    onClick={fetchSupportChats}
                                    className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${loadingChats ? 'animate-spin' : ''}`}
                                    title="Refrescar chats"
                                >
                                    <Icons.Refresh />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {supportChats.length > 0 ? supportChats.map(chat => (
                                    <div key={chat.id} className="relative group">
                                        <button 
                                            onClick={() => setSelectedChatId(chat.id)}
                                            className={`w-full p-8 flex items-center gap-4 transition-all border-b dark:border-white/5 text-left relative ${selectedChatId === chat.id ? 'bg-brand-primary/5 border-l-4 border-l-brand-primary' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                        >
                                            <div className="w-12 h-12 bg-brand-dark rounded-full flex items-center justify-center text-white font-bold">{chat.user[0]}</div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="font-black text-sm text-brand-dark dark:text-white uppercase leading-none">{chat.user}</p>
                                                    <span className="text-[9px] font-bold text-gray-400">{chat.time}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 truncate">{chat.lastMsg}</p>
                                            </div>
                                            {chat.unread && <div className="w-2.5 h-2.5 bg-brand-primary rounded-full absolute right-6 top-1/2 -translate-y-1/2 shadow-lg"></div>}
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }}
                                            className="absolute right-4 bottom-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Eliminar conversación"
                                        >
                                            <Icons.Trash />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="p-10 text-center">
                                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 opacity-40">💬</div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aún no hay consultas registradas</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-white dark:bg-brand-darkCard rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden">
                            {selectedChat ? (
                                <>
                                    <div className="p-8 border-b dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold">{selectedChat.user[0]}</div>
                                            <div>
                                                <p className="font-black text-sm text-brand-dark dark:text-white uppercase leading-none">{selectedChat.user}</p>
                                                <p className="text-[9px] text-brand-secondary font-black mt-1 uppercase tracking-widest">En línea</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-gray-50/30 dark:bg-brand-darkBg/20 custom-scrollbar">
                                        {selectedChat.messages.map((m: any, idx: number) => (
                                            <div key={m.id || idx} className={`flex ${m.role === 'support' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] p-6 rounded-[1.5rem] text-sm font-medium shadow-sm leading-relaxed ${m.role === 'support' ? 'bg-brand-dark text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-bl-none'}`}>
                                                    {m.text}
                                                    <p className="text-[8px] mt-2 opacity-40 text-right">{m.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-8 bg-white dark:bg-brand-darkCard border-t dark:border-white/5 flex gap-4">
                                        <input 
                                            type="text" 
                                            value={adminReply}
                                            onChange={(e) => setAdminReply(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendAdminReply()}
                                            placeholder="Escribe una respuesta para el prescriptor..." 
                                            className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-primary font-medium dark:text-white" 
                                        />
                                        <button onClick={handleSendAdminReply} className="px-8 bg-brand-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-primary/20">Responder</button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-4xl mb-6">💬</div>
                                    <p className="text-sm font-black uppercase tracking-widest text-gray-400 text-center px-10">Selecciona una consulta de la izquierda para comenzar a responder</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 6. AJUSTES */}
                {activeTab === 'settings' && (
                    <div className="pt-10 animate-fade-in space-y-12">
                        {/* Conexión Google Calendar */}
                        <div className="bg-white dark:bg-brand-darkCard p-16 rounded-[3.5rem] shadow-sm border dark:border-white/5 relative overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="max-w-xl">
                                    <h3 className="text-2xl font-black text-brand-dark dark:text-white uppercase tracking-tighter mb-4">Google Calendar & Meet</h3>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                        Conecta la cuenta <span className="font-bold text-brand-primary">contact@redescomerciales.ai</span> para que el sistema pueda agendar entrevistas automáticamente y generar enlaces de Google Meet válidos.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleConnectGoogle}
                                    disabled={googleLoading}
                                    className={`px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center gap-3 shadow-xl ${isGoogleConnected ? 'bg-green-50 text-brand-success border-2 border-green-100 shadow-brand-success/10' : 'bg-brand-primary text-white shadow-brand-primary/20 hover:scale-105 active:scale-95'}`}
                                >
                                    {googleLoading ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : isGoogleConnected ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h4.74c-.2 1.06-.9 1.95-2.02 2.71l2.72 2.11c1.6-1.48 2.53-3.65 2.53-6.17 0-.44-.04-.88-.11-1.31H12.48zM5.12 12.24c0-.85.15-1.67.4-2.43l-2.82-2.18C2.1 8.87 1.8 10.51 1.8 12.24s.3 3.37.9 4.61l2.82-2.18c-.25-.76-.4-1.58-.4-2.43zM12.48 5.04c1.64 0 3.11.56 4.27 1.68l3.2-3.2C17.99 1.51 15.44.8 12.48.8c-4.12 0-7.66 2.36-9.38 5.81l2.82 2.18c.66-1.94 2.48-3.35 4.56-3.35zM12.48 23.68c3.12 0 5.73-1.03 7.64-2.79l-2.72-2.11c-.75.5-1.71.8-2.79.8-2.08 0-3.9-1.41-4.56-3.35l-2.82 2.18c1.72 3.45 5.26 5.81 9.38 5.81z"/></svg>
                                    )}
                                    {isGoogleConnected ? 'CUENTA CONECTADA' : 'CONECTAR CON GOOGLE'}
                                </button>
                            </div>
                            
                            {isGoogleConnected && (
                                <div className="mt-10 p-6 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/20 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-brand-success text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-success/20">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-brand-success uppercase tracking-widest">Sincronización Activa</p>
                                        <p className="text-xs text-brand-success dark:text-brand-success font-medium mt-0.5">Las entrevistas se agendarán en el calendario de contact@fundswin.ai</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-brand-dark text-white p-16 rounded-[3.5rem] shadow-2xl relative overflow-hidden border border-white/5">
                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-12">Entorno de Simulación</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                <RoleSimCard active={selectedSimLevel === 1} level="1" label="PRESCRIPTOR" onClick={() => setSelectedSimLevel(1)} />
                                <RoleSimCard active={selectedSimLevel === 2} level="2" label="COLABORADOR" onClick={() => setSelectedSimLevel(2)} />
                                <RoleSimCard active={selectedSimLevel === 3} level="3" label="DELEGADO GESTIÓN" onClick={() => setSelectedSimLevel(3)} />
                                <RoleSimCard active={selectedSimLevel === 4} level="4" label="OFICINA TÉCNICA" onClick={() => setSelectedSimLevel(4)} />
                            </div>
                            <div className="flex justify-end mt-16">
                                <button onClick={handleSimulate} className="px-16 py-6 bg-brand-secondary text-white font-black rounded-2xl uppercase tracking-widest text-[12px] shadow-xl hover:scale-105 active:scale-95 transition-all shadow-brand-secondary/20">Ir al Portal Simulado</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>

        {/* MODAL GESTIONAR PRESCRIPCIÓN - DISEÑO GRANTSWIN PREMIUM */}
        {isPrescriptionModalOpen && selectedPrescription && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/60 backdrop-blur-md p-4">
                <div className="bg-white dark:bg-brand-darkCard w-full max-w-md rounded-[3rem] shadow-2xl animate-fade-in-up border dark:border-white/10 overflow-hidden">
                    <div className="p-10">
                        {/* Cabecera */}
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-black text-brand-dark dark:text-white uppercase tracking-tighter">Gestión de Prescripción</h3>
                            <button onClick={() => setIsPrescriptionModalOpen(false)} className="text-gray-300 hover:text-brand-primary transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Info Empresa */}
                        <div className="flex items-center gap-4 mb-10 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="w-12 h-12 bg-brand-secondary text-white rounded-full flex items-center justify-center font-black text-lg shadow-lg shadow-brand-secondary/20">
                                {selectedPrescription.empresa[0]}
                            </div>
                            <div>
                                <p className="font-black text-brand-dark dark:text-white text-sm uppercase leading-none">{selectedPrescription.empresa}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-1">{selectedPrescription.contacto} • {selectedPrescription.email}</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* ESTADO DE LA OPORTUNIDAD */}
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Cambiar Estado</p>
                                <div className="grid grid-cols-1 gap-4">
                                    <button 
                                        onClick={() => handleUpdatePrescriptionStatus('ACEPTADA')} 
                                        className="w-full py-5 bg-brand-success text-[#2a364e] font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-brand-success/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                        Aceptar Oportunidad
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleUpdatePrescriptionStatus('EN PROCESO')} 
                                        className="w-full py-5 bg-white dark:bg-gray-800 border-2 border-brand-dark/20 text-brand-dark dark:text-gray-300 rounded-2xl hover:bg-brand-dark hover:text-white transition-all font-black uppercase tracking-widest text-xs"
                                    >
                                        Marcar En Proceso
                                    </button>

                                    <button 
                                        onClick={() => handleUpdatePrescriptionStatus('RECHAZADA')} 
                                        className="w-full py-5 border-2 border-gray-100 dark:border-white/5 text-gray-400 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-500 transition-all"
                                    >
                                        Rechazar Oportunidad
                                    </button>
                                </div>
                            </div>

                            {/* INFO PRESCRIPTOR */}
                            <div className="pt-4 border-t dark:border-white/5">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Referido por</p>
                                <p className="text-sm font-bold text-brand-dark dark:text-white uppercase">{selectedPrescription.prescriptor}</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsPrescriptionModalOpen(false)} 
                            className="w-full mt-12 text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] hover:text-brand-primary transition-colors"
                        >
                            Cerrar Gestión
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL PREVISUALIZACIÓN EMAIL */}
        {showPreviewModal && selectedCandidate && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-dark/80 backdrop-blur-xl p-4">
                <div className="bg-white dark:bg-[#1a2333] w-full max-w-2xl rounded-[3rem] shadow-2xl animate-fade-in-up border dark:border-white/10 overflow-hidden">
                    <div className="p-12">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-xl font-black text-brand-dark dark:text-white uppercase tracking-tighter">Previsualizar Invitación</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Para: {selectedCandidate.email}</p>
                            </div>
                            <button onClick={() => setShowPreviewModal(false)} className="text-gray-300 hover:text-brand-primary transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="mb-10">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Cuerpo del Mensaje</p>
                            <textarea 
                                value={emailDraft}
                                onChange={(e) => setEmailDraft(e.target.value)}
                                className="w-full h-64 p-8 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-[2rem] outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium text-sm text-gray-600 dark:text-gray-300 leading-relaxed resize-none custom-scrollbar"
                                placeholder="Escribe el contenido del email..."
                            />
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowPreviewModal(false)}
                                className="flex-1 py-5 border-2 border-gray-100 dark:border-white/5 text-gray-400 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSendEmail}
                                disabled={isSending}
                                className={`flex-[2] py-5 bg-brand-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 ${isSending ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {isSending ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                )}
                                {isSending ? 'Enviando...' : 'Confirmar y Enviar Email'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL AÑADIR CITA */}
        {isAddApptModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/60 backdrop-blur-md p-4">
                <div className="bg-white dark:bg-brand-darkCard w-full max-w-md rounded-[3rem] shadow-2xl animate-fade-in-up border dark:border-white/10 overflow-hidden">
                    <div className="p-10">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-black text-brand-dark dark:text-white uppercase tracking-tighter">Programar Entrevista</h3>
                            <button onClick={() => setIsAddApptModalOpen(false)} className="text-gray-300 hover:text-brand-primary transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block ml-1">Seleccionar Candidato</label>
                                <select 
                                    value={newAppt.candidateId}
                                    onChange={(e) => setNewAppt({...newAppt, candidateId: e.target.value})}
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 font-bold text-sm dark:text-white"
                                >
                                    <option value="">Selecciona un candidato...</option>
                                    {candidates.map(c => (
                                        <option key={`${c.id}-${c.nivel}`} value={c.id}>{c.nombre} ({c.nivel})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block ml-1">Hora de la Cita</label>
                                <input 
                                    type="time" 
                                    value={newAppt.time}
                                    onChange={(e) => setNewAppt({...newAppt, time: e.target.value})}
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 font-bold text-sm dark:text-white"
                                />
                            </div>

                            <div className="pt-6">
                                <button 
                                    onClick={handleSaveAppt}
                                    disabled={!newAppt.candidateId}
                                    className="w-full py-5 bg-brand-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    Guardar Cita en Agenda
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL GESTIONAR CANDIDATO - DISEÑO GRANTSWIN PREMIUM */}
        {isManageModalOpen && selectedCandidate && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/60 backdrop-blur-md p-4">
                <div className="bg-white dark:bg-brand-darkCard w-full max-w-md rounded-[3rem] shadow-2xl animate-fade-in-up border dark:border-white/10 overflow-hidden">
                    <div className="p-10">
                        {/* Cabecera */}
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-black text-brand-dark dark:text-white uppercase tracking-tighter">Gestión de Talento</h3>
                            <button onClick={() => setIsManageModalOpen(false)} className="text-gray-300 hover:text-brand-primary transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Perfil Mini */}
                        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="w-12 h-12 bg-brand-primary text-white rounded-full flex items-center justify-center font-black text-lg shadow-lg shadow-brand-primary/20">
                                {selectedCandidate.nombre[0]}
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-brand-dark dark:text-white text-sm uppercase leading-none">{selectedCandidate.nombre}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-1">{selectedCandidate.email}</p>
                            </div>
                            {selectedCandidate.linkedin_url && (
                                <a href={selectedCandidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                                </a>
                            )}
                        </div>

                        {/* Documentación */}
                        {(selectedCandidate.cv_link || selectedCandidate.cover_letter) && (
                            <div className="mb-8 space-y-4">
                                {selectedCandidate.cv_link && (
                                    <button 
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = selectedCandidate.cv_link;
                                            link.download = `CV_${selectedCandidate.nombre.replace(/\s+/g, '_')}.pdf`;
                                            link.click();
                                        }}
                                        className="w-full p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl flex items-center justify-between group hover:bg-brand-primary hover:text-white transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">📄</span>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Currículum Vitae</p>
                                                <p className="text-[9px] font-bold opacity-60 mt-1">Descargar archivo PDF</p>
                                            </div>
                                        </div>
                                        <svg className="w-4 h-4 opacity-40 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </button>
                                )}
                                
                                {selectedCandidate.cover_letter && (
                                    <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Carta de Presentación</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed italic">
                                            "{selectedCandidate.cover_letter}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-8">
                            {/* ACCIÓN PRINCIPAL */}
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Decisión Final</p>
                                <div className="grid grid-cols-1 gap-3">
                                    <button 
                                        onClick={() => handleUpdateStatus('SELECTED')} 
                                        className="w-full py-5 bg-brand-success text-[#2a364e] font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-brand-success/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                        Aprobar e Incorporar
                                    </button>
                                    <button 
                                        onClick={handleForceComplete}
                                        className="w-full py-4 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        Forzar Finalización ✅
                                    </button>
                                </div>
                            </div>

                            {/* ACCIONES DE AGENDA */}
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Programar Entrevistas</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => handleInvite(selectedCandidate, 'RRHH')} 
                                        disabled={isGeneratingDraft}
                                        className={`flex flex-col items-center gap-3 p-6 bg-white dark:bg-gray-800 border-2 border-brand-primary/20 text-brand-primary rounded-[2rem] hover:bg-brand-primary hover:text-white transition-all group ${isGeneratingDraft ? 'opacity-50 cursor-wait' : ''}`}
                                    >
                                        {isGeneratingDraft ? (
                                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Icons.Calendar />
                                        )}
                                        <span className="text-[9px] font-black uppercase tracking-widest">
                                            {isGeneratingDraft ? 'Generando...' : 'Citar RRHH'}
                                        </span>
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus('COMERCIAL')} 
                                        className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-gray-800 border-2 border-brand-dark/20 text-brand-dark dark:text-gray-300 rounded-[2rem] hover:bg-brand-dark hover:text-white transition-all group"
                                    >
                                        <Icons.Users />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Citar Comercial</span>
                                    </button>
                                </div>
                            </div>

                            {/* ACCIONES SECUNDARIAS */}
                            <div className="pt-4">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Otras Acciones</p>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleUpdateStatus('PENDING')} 
                                        className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-black rounded-xl uppercase tracking-widest text-[9px] hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                                    >
                                        En Espera
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus('REJECTED')} 
                                        className="flex-1 py-4 border-2 border-gray-100 dark:border-white/5 text-gray-400 font-black rounded-xl uppercase tracking-widest text-[9px] hover:bg-red-50 hover:text-white hover:border-red-500 transition-all"
                                    >
                                        Descartar
                                    </button>
                                </div>
                            </div>

                            {/* ZONA DE PELIGRO */}
                            <div className="pt-8 mt-4 border-t border-red-100 dark:border-red-900/20">
                                <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em] mb-4 ml-1">Zona de Peligro</p>
                                <button 
                                    onClick={() => setIsConfirmingDelete(true)}
                                    className="w-full py-4 bg-red-50 dark:bg-red-900/10 text-red-500 font-black rounded-xl uppercase tracking-widest text-[9px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-100 dark:border-red-900/20"
                                >
                                    <Icons.Trash />
                                    Eliminar Candidato
                                </button>
                            </div>

                        </div>

                        <button 
                            onClick={() => setIsManageModalOpen(false)} 
                            className="w-full mt-12 text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] hover:text-brand-primary transition-colors"
                        >
                            Cerrar Gestión
                        </button>
                    </div>
                </div>
            </div>
        )}

    {/* SUB-MODAL CONFIRMACIÓN ELIMINAR */}
        {isConfirmingDelete && selectedCandidate && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-dark/80 backdrop-blur-[20px] p-4">
                <div className="bg-white dark:bg-[#1a2333] w-full max-w-sm rounded-[3rem] shadow-2xl animate-fade-in-up border dark:border-white/10 overflow-hidden p-10 text-center">
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
                        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h3 className="text-lg font-black text-brand-dark dark:text-white uppercase tracking-tighter mb-4">¿ELIMINAR PERMANENTEMENTE?</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-10">
                        Esta acción no se puede deshacer. Los datos de <span className="font-bold text-red-500">{selectedCandidate.nombre}</span> se borrarán del sistema.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => setIsConfirmingDelete(false)}
                            className="w-full py-4 border-2 border-gray-100 dark:border-white/5 text-gray-400 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                        >
                            CANCELAR
                        </button>
                        <button 
                            onClick={() => handleDeleteCandidate(selectedCandidate.id)}
                            disabled={isDeleting}
                            className={`w-full py-4 bg-red-500 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-red-500/30 transition-all flex items-center justify-center gap-2 ${isDeleting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                        >
                            {isDeleting ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ELIMINANDO...
                                </>
                            ) : (
                                'SÍ, ELIMINAR'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const FilterPill = ({ label, count, active, onClick }: any) => (
    <button onClick={onClick} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${active ? 'bg-brand-primary text-white shadow-lg' : 'bg-white dark:bg-gray-700 text-gray-400 hover:text-brand-primary shadow-sm'}`}>
        {label} <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${active ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>({count})</span>
    </button>
);

const StatusBadge = ({ status }: { status: string }) => {
    let classes = "px-4 py-1.5 text-[9px] rounded-full font-black tracking-widest border ";
    switch(status) {
        case 'SELECTED': classes += "bg-green-50 border-green-200 text-brand-success"; break;
        case 'RRHH': classes += "bg-blue-50 border-blue-200 text-blue-600"; break;
        case 'COMERCIAL': classes += "bg-indigo-50 border-indigo-200 text-indigo-600"; break;
        case 'PENDING': classes += "bg-yellow-50 border-yellow-200 text-yellow-600"; break;
        case 'REJECTED': classes += "bg-red-50 border-red-200 text-red-600"; break;
        default: classes += "bg-gray-50 border-gray-200 text-gray-600";
    }
    return <span className={classes}>{status}</span>;
};

const ProgressBadge = ({ candidate }: { candidate: any }) => {
    const badgeBase = "px-4 py-1.5 text-xs font-medium rounded-full whitespace-nowrap inline-flex items-center justify-center gap-1.5 min-w-[140px]";
    
    // Si ya ha firmado el contrato o el estado es SELECTED, ya tiene acceso total
    if (candidate.contract_signed || candidate.estado === 'SELECTED') {
        return (
            <span className={`${badgeBase} bg-brand-success/10 text-brand-success`}>
                Acceso Activo ✅
            </span>
        );
    }
    
    // Si ha completado el M5 o el test, está pendiente de firma
    if (candidate.m5_completed || candidate.test_passed) {
        return <span className={`${badgeBase} bg-indigo-100 text-indigo-700`}>Firma de Convenio</span>;
    }
    
    // Si ha completado el M4, está en el M5
    if (candidate.m4_completed) {
        return <span className={`${badgeBase} bg-rose-100 text-rose-700`}>{candidate.nivel === 'PRESCRIPTOR' ? 'M5: Ética y Cierre' : 'Evaluación Final'}</span>;
    }
    
    // Si ha completado el M3, está en el M4
    if (candidate.m3_completed) {
        return <span className={`${badgeBase} bg-purple-100 text-purple-700`}>M4: Proceso</span>;
    }
    
    // Si ha completado el M2, está en el M3
    if (candidate.m2_completed) {
        return <span className={`${badgeBase} bg-blue-100 text-blue-700`}>M3: Explicación</span>;
    }
    
    // Si ha completado el M1, está en el M2
    if (candidate.m1_completed) {
        return <span className={`${badgeBase} bg-amber-100 text-amber-700`}>M2: Cliente</span>;
    }
    
    // Por defecto está en el M1
    return <span className={`${badgeBase} bg-slate-100 text-slate-600`}>M1: Introducción</span>;
};

const NavItem = ({ active, onClick, icon, label }: any) => (
    <button onClick={onClick} className={`flex items-center gap-6 px-10 py-5 transition-all w-full relative group ${active ? 'bg-brand-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
        {icon} <span className="font-black text-[11px] uppercase tracking-widest">{label}</span>
        {active && <div className="absolute left-0 w-1.5 h-full bg-white/20"></div>}
    </button>
);

const StatCard = ({ label, value, color, trend, icon }: any) => (
    <div className="bg-white dark:bg-brand-darkCard px-10 py-12 rounded-[3rem] shadow-sm flex items-center justify-between border dark:border-white/5 group hover:scale-[1.02] transition-all">
        <div>
            <p className="text-[9px] font-black uppercase text-gray-400 mb-4 tracking-[0.2em]">{label}</p>
            <p className={`text-5xl font-black ${color} tracking-tighter mb-4`}>{value}</p>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${trend.startsWith('+') ? 'text-brand-success bg-green-50' : 'text-red-500 bg-red-50'}`}>{trend}</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase opacity-60">Vs Mes Ant.</span>
            </div>
        </div>
        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-300 group-hover:scale-110 transition-transform">{icon}</div>
    </div>
);

const ProgressRow = ({ label, count, total, color }: any) => (
    <div className="space-y-3">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-gray-400">{label}</span>
            <span className="text-brand-dark dark:text-white">{count} ({Math.round((count/total)*100)}%)</span>
        </div>
        <div className="w-full h-2 bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full transition-all duration-1000" style={{ backgroundColor: color, width: `${(count/total)*100}%` }}></div>
        </div>
    </div>
);

const RoleSimCard = ({ active, level, label, onClick }: any) => (
    <button onClick={onClick} className={`p-10 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center gap-6 relative group hover:scale-105 active:scale-95 ${active ? 'bg-brand-primary border-brand-primary shadow-2xl shadow-brand-primary/30' : 'bg-white/5 border-white/10 hover:border-brand-primary/40'}`}>
        <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${active ? 'text-white/50' : 'text-brand-primary'}`}>Nivel {level}</span>
        <span className="font-black text-[12px] uppercase leading-tight tracking-widest text-white">{label}</span>
    </button>
);

export default AdminDashboard;
