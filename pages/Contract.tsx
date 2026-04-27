
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { jsPDF } from 'jspdf';
import { trackContractSignature } from '../services/backendEvents';

const isUuid = (id: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(id);
};

const generateHash = async (email: string, timestamp: string, ip: string) => {
    const msgUint8 = new TextEncoder().encode(email + timestamp + ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};

const Contract = () => {
  const { user, updateUser } = useUser();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [signing, setSigning] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ipAddress, setIpAddress] = useState<string>("Detectando...");
  const [finalHash, setFinalHash] = useState<string>("");


  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setIpAddress(data.ip);
      } catch (err) {
        console.error("Error al obtener IP:", err);
        setIpAddress("No detectada");
      }
    };
    fetchIp();
  }, []);


  if (!user) return null;

  const generatePDF = (userName: string, userEmail: string, userLevel: number, userSig: string, userIp: string, userHash: string) => {
    const doc = new jsPDF();
    const roleName = userLevel === 1 ? 'Prescriptor' : userLevel === 2 ? 'Colaborador' : 'Delegado';
    const date = new Date().toLocaleString('es-ES', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const displayHash = userHash.substring(0, 24).toUpperCase();

    // --- PÁGINA 1 ---
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
    doc.text("CONVENIO DE COLABORACIÓN – REDESCOMERCIALES.AI", 20, 55);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const contentPage1 = `
DATOS DEL FIRMANTE:
- Nombre: ${userName.toUpperCase()}
- Correo Electrónico: ${userEmail}
- Nivel: Nivel ${userLevel} (${roleName})
- Fecha de Firma: ${date}
- IP de Registro: ${userIp}
- ID Certificado: RC-HASH-${displayHash}

1. Objeto
El Colaborador colabora con RedesComerciales.ai recomendando potenciales clientes o contactos de su red profesional que puedan estar interesados en las soluciones del ecosistema RedesComerciales.ai. La función del Colaborador se limita a identificar y referir posibles clientes, sin asumir funciones comerciales, contractuales ni de representación en nombre de Acceleralia o de las soluciones del ecosistema RedesComerciales.ai.

2. Naturaleza de la relación
La presente relación tiene carácter estrictamente civil o mercantil, según corresponda en función de la situación del Colaborador, y en ningún caso implica la existencia de relación laboral, societaria, de agencia, distribución o representación entre las partes. El Colaborador actúa de forma independiente y bajo su propia responsabilidad, organizando libremente su actividad. En el supuesto de que el Colaborador actúe como persona física que no desarrolla esta actividad de forma habitual, la colaboración se considerará de carácter puntual u ocasional, limitada a la mera recomendación o referencia de contactos, sin que ello suponga el ejercicio de una actividad económica continuada.

3. Obligaciones del Colaborador
El Colaborador se compromete a:
• Actuar de buena fe y conforme a la legalidad vigente.
• No asumir compromisos ni realizar manifestaciones en nombre de RedesComerciales.ai o Acceleralia.
• No negociar precios, condiciones comerciales ni contratos con potenciales clientes.
• No utilizar la marca, materiales o información de RedesComerciales.ai de forma indebida o no autorizada.
• Asegurarse de que las personas o entidades cuyos datos facilite a RedesComerciales.ai han sido informadas previamente de la referencia y conocen que podrán ser contactadas por el equipo de RedesComerciales.ai.
• Referir únicamente contactos que, a su leal saber y entender, tengan un interés razonable y encajen con el perfil de potencial cliente de las soluciones ofrecidas dentro del ecosistema RedesComerciales.ai.

4. Compensación
En caso de que una referencia realizada por el Colaborador derive en la contratación efectiva de una de las soluciones del ecosistema RedesComerciales.ai, el Colaborador tendrá derecho a percibir una comisión equivalente al 50% del importe correspondiente a la primera mensualidad de la suscripción contratada por el cliente referido. La comisión se devengará únicamente cuando el cliente haya formalizado la contratación del servicio, y el primer pago de la suscripción haya sido efectivamente realizado. La comisión tendrá la consideración de rendimiento dinerario sujeto a la normativa fiscal vigente, siendo de aplicación las retenciones que correspondan en cada caso según la naturaleza del Colaborador.
    `;
    doc.text(doc.splitTextToSize(contentPage1, 170), 20, 65);

    // --- PÁGINA 2 ---
    doc.addPage();
    doc.setTextColor(45, 62, 80);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const contentPage2 = `
5. Facturación y requisitos fiscales
Para poder percibir la comisión correspondiente, el Colaborador deberá cumplir con las obligaciones fiscales que resulten de aplicación en función de su situación:
• En caso de actuar como empresario o profesional (autónomo o empresa), el Colaborador deberá emitir la correspondiente factura conforme a la normativa fiscal vigente.
• En caso de actuar como persona física sin actividad económica habitual, el Colaborador podrá percibir la comisión mediante la emisión de un recibo o documento justificativo, no estando obligado a repercutir IVA, pero quedando sujeto a la retención de IRPF que corresponda. En este caso, Acceleralia practicará la retención e ingresará su importe ante la Agencia Tributaria conforme a la normativa aplicable.
El Colaborador declara que cumplirá con sus obligaciones fiscales y tributarias en relación con las cantidades percibidas, exonerando a Acceleralia de cualquier responsabilidad derivada de su incumplimiento.

6. Propiedad intelectual y confidencialidad
El Colaborador reconoce que todos los derechos de propiedad intelectual e industrial relativos a RedesComerciales.ai y a las soluciones de su ecosistema pertenecen exclusivamente a Acceleralia o a sus legítimos titulares. La participación en la Red de Colaboradores RedesComerciales.ai no otorga al Colaborador ningún derecho sobre la tecnología, marca, contenidos o materiales asociados a RedesComerciales.ai. Asimismo, el Colaborador se compromete a mantener la confidencialidad de toda la información no pública a la que pudiera tener acceso.

7. Protección de datos
Los datos personales serán tratados conforme a la Política de Privacidad disponible en la plataforma, en cumplimiento de lo dispuesto en el Reglamento (UE) 2016/679 (RGPD) y demás normativa aplicable en materia de protección de datos.

8. Legislación aplicable y jurisdicción
El presente acuerdo se regirá por la legislación española. Para la resolución de cualquier controversia derivada de la interpretación o ejecución del presente acuerdo, las partes se someten expresamente a los Juzgados y Tribunales de Barcelona, con renuncia a cualquier otro fuero que pudiera corresponderles.

9. Modificación de la Red de Colaboradores RedesComerciales.ai
Acceleralia se reserva el derecho de modificar las condiciones de la Red de Colaboradores RedesComerciales.ai cuando resulte necesario. Cualquier modificación será comunicada a los Colaboradores a través de la plataforma o por los medios habituales de comunicación de la Red de Colaboradores RedesComerciales.ai.
    `;
    doc.text(doc.splitTextToSize(contentPage2, 170), 20, 20);

    // --- PIE DE FIRMA (Fijo al final de la página 2) ---
    const footerY = 240;
    doc.setFontSize(9);
    doc.setTextColor(45, 62, 80);
    const registrationText = `REGISTRO DE FIRMA: El usuario acepta electrónicamente el presente documento mediante acción afirmativa desde su cuenta registrada, quedando constancia de fecha, hora, IP (${userIp}), Hash (${displayHash}) y versión del documento.`;
    doc.text(doc.splitTextToSize(registrationText, 170), 20, footerY);

    // Firma manuscrita
    const signatureY = footerY + 25;
    doc.setDrawColor(227, 30, 36);
    doc.line(20, signatureY + 5, 100, signatureY + 5);
    doc.setFont("courier", "italic");
    doc.setFontSize(22);
    doc.setTextColor(227, 30, 36);
    doc.text(userSig, 25, signatureY);
    
    doc.save(`Convenio_RedesComerciales_${userName.replace(/\s+/g, '_')}.pdf`);
  };

  const handleSign = async () => {
    if (!agreed || !signature.trim()) return;
    setSigning(true);
    setError(null);
    
    try {
        const isRealUser = isUuid(user.id);
        const fechaActual = new Date().toISOString();
        const generatedHash = await generateHash(user.email, fechaActual, ipAddress);
        setFinalHash(generatedHash);
        
        const { error: dbError } = await supabase.from('Firmas_Contratos').insert({
            user_id: isRealUser ? user.id : null,
            nombre_firmante: user.nombre + (isRealUser ? "" : " (ADMIN)"),
            email_firmante: user.email,
            firma_manuscrita: signature,
            nivel_contrato: user.nivel_elegido,
            ip_firma: ipAddress,
            hash_confirmacion: generatedHash,
            hash_seguridad: "SIG-" + Math.random().toString(36).substring(7).toUpperCase()
        });

        if (dbError) throw new Error(dbError.message);

        // --- EVENTO B: INTEGRACIÓN HUBSPOT ---
        // Notificamos que el convenio ha sido firmado (Evento B del manual)
        trackContractSignature({ email: user.email, fecha: fechaActual });

        await updateUser({ 
            contract_signed: true,
            application_status: 'selected',
            m1_completed: true,
            m2_completed: true,
            m3_completed: true,
            m4_completed: true,
            m5_completed: true,
            test_passed: true,
            estado_actual: 'producción activa'
        });

        setShowSuccessModal(true);
    } catch (err: any) {
        setError(err.message || "Error inesperado al procesar la firma.");
    } finally {
        setSigning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate('/portal')} className="text-gray-400 hover:text-brand-primary font-bold text-[10px] uppercase tracking-widest transition-colors">
          &larr; Volver al Portal
        </button>
      </div>

      <div className="bg-white dark:bg-brand-darkCard rounded-[2rem] shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="bg-brand-dark p-10 text-white text-center">
            <h1 className="text-2xl font-black uppercase tracking-tighter">CONVENIO DE COLABORACIÓN – REDESCOMERCIALES.AI</h1>
            <p className="text-brand-secondary text-xs font-black uppercase tracking-[0.3em] mt-2">Términos y Condiciones Legales</p>
        </div>

        <div className="p-10 md:p-16 h-96 overflow-y-auto bg-gray-50 dark:bg-brand-darkBg border-b border-gray-200 dark:border-white/5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed custom-scrollbar">
            <div className="space-y-6">
                <h2 className="font-black uppercase tracking-widest text-[11px] text-brand-primary">CONVENIO DE COLABORACIÓN – REDESCOMERCIALES.AI</h2>
                
                <div>
                    <h3 className="font-bold text-brand-dark dark:text-white mb-2">1. Objeto</h3>
                    <p>El Colaborador colabora con RedesComerciales.ai recomendando potenciales clientes o contactos de su red profesional que puedan estar interesados en las soluciones del ecosistema RedesComerciales.ai.</p>
                    <p className="mt-2">La función del Colaborador se limita a identificar y referir posibles clientes, sin asumir funciones comerciales, contractuales ni de representación en nombre de Acceleralia o de las soluciones del ecosistema RedesComerciales.ai.</p>
                </div>

                <div>
                    <h3 className="font-bold text-brand-dark dark:text-white mb-2">2. Naturaleza de la relación</h3>
                    <p>La presente relación tiene carácter estrictamente civil o mercantil, según corresponda en función de la situación del Colaborador, y en ningún caso implica la existencia de relación laboral, societaria, de agencia, distribución o representación entre las partes.</p>
                    <p className="mt-2">El Colaborador actúa de forma independiente y bajo su propia responsabilidad, organizando libremente su actividad.</p>
                    <p className="mt-2">En el supuesto de que el Colaborador actúe como persona física que no desarrolla esta actividad de forma habitual, la colaboración se considerará de carácter puntual u ocasional, limitada a la mera recomendación o referencia de contactos, sin que ello suponga el ejercicio de una actividad económica continuada.</p>
                </div>

                <div>
                    <h3 className="font-bold text-brand-dark dark:text-white mb-2">3. Obligaciones del Colaborador</h3>
                    <p>El Colaborador se compromete a:</p>
                    <ul className="list-disc ml-5 space-y-2 mt-2">
                        <li>Actuar de buena fe y conforme a la legalidad vigente.</li>
                        <li>No asumir compromisos ni realizar manifestaciones en nombre de RedesComerciales.ai o Acceleralia.</li>
                        <li>No negociar precios, condiciones comerciales ni contratos con potenciales clientes.</li>
                        <li>No utilizar la marca, materiales o información de RedesComerciales.ai de forma indebida o no autorizada.</li>
                        <li>Asegurarse de que las personas o entidades cuyos datos facilite a RedesComerciales.ai han sido informadas previamente de la referencia y conocen que podrán ser contactadas por el equipo de RedesComerciales.ai.</li>
                        <li>Referir únicamente contactos que, a su leal saber y entender, tengan un interés razonable y encajen con el perfil de potencial cliente de las soluciones ofrecidas dentro del ecosistema RedesComerciales.ai.</li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-bold text-brand-dark dark:text-white mb-2">4. Compensación</h3>
                    <p>En caso de que una referencia realizada por el Colaborador derive en la contratación efectiva de una de las soluciones del ecosistema RedesComerciales.ai, el Colaborador tendrá derecho a percibir una comisión equivalente al 50% del importe correspondiente a la primera mensualidad de la suscripción contratada por el cliente referido.</p>
                    <p className="mt-2">La comisión se devengará únicamente cuando el cliente haya formalizado la contratación del servicio, y el primer pago de la suscripción haya sido efectivamente realizado.</p>
                    <p className="mt-2">La comisión tendrá la consideración de rendimiento dinerario sujeto a la normativa fiscal vigente, siendo de aplicación las retenciones que correspondan en cada caso según la naturaleza del Colaborador.</p>
                </div>

                <div>
                    <h3 className="font-bold text-brand-dark dark:text-white mb-2">5. Facturación y requisitos fiscales</h3>
                    <p>Para poder percibir la comisión correspondiente, el Colaborador deberá cumplir con las obligaciones fiscales que resulten de aplicación en función de su situación:</p>
                    <ul className="list-disc ml-5 space-y-2 mt-2">
                        <li>En caso de actuar como empresario o profesional (autónomo o empresa), el Colaborador deberá emitir la correspondiente factura conforme a la normativa fiscal vigente.</li>
                        <li>En caso de actuar como persona física sin actividad económica habitual, el Colaborador podrá percibir la comisión mediante la emisión de un recibo o documento justificativo, no estando obligado a repercutir IVA, pero quedando sujeto a la retención de IRPF que corresponda. En este caso, Acceleralia practicará la retención e ingresará su importe ante la Agencia Tributaria conforme a la normativa aplicable.</li>
                    </ul>
                    <p className="mt-4">El Colaborador declara que cumplirá con sus obligaciones fiscales y tributarias en relación con las cantidades percibidas, exonerando a Acceleralia de cualquier responsabilidad derivada de su incumplimiento.</p>
                </div>

                <div>
                    <h3 className="font-bold text-brand-dark dark:text-white mb-2">6. Propiedad intelectual y confidencialidad</h3>
                    <p>El Colaborador reconoce que todos los derechos de propiedad intelectual e industrial relativos a RedesComerciales.ai y a las soluciones de su ecosistema pertenecen exclusivamente a Acceleralia o a sus legítimos titulares.</p>
                    <p className="mt-2">La participación en la Red de Colaboradores RedesComerciales.ai no otorga al Colaborador ningún derecho sobre la tecnología, marca, contenidos o materiales asociados a RedesComerciales.ai. Asimismo, el Colaborador se compromete a mantener la confidencialidad de toda la información no pública a la que pudiera tener acceso.</p>
                </div>

                <div>
                    <h3 className="font-bold text-brand-dark dark:text-white mb-2">7. Protección de datos</h3>
                    <p>Los datos personales serán tratados conforme a la Política de Privacidad disponible en la plataforma, en cumplimiento de lo dispuesto en el Reglamento (UE) 2016/679 (RGPD) y demás normativa aplicable en materia de protección de datos.</p>
                </div>

                <div>
                    <h3 className="font-bold text-brand-dark dark:text-white mb-2">8. Legislación aplicable y jurisdicción</h3>
                    <p>El presente acuerdo se regirá por la legislación española. Para la resolución de cualquier controversia derivada de la interpretación o ejecución del presente acuerdo, las partes se someten expresamente a los Juzgados y Tribunales de Barcelona, con renuncia a cualquier otro fuero que pudiera corresponderles.</p>
                </div>

                <div>
                    <h3 className="font-bold text-brand-dark dark:text-white mb-2">9. Modificación de la Red de Colaboradores RedesComerciales.ai</h3>
                    <p>Acceleralia se reserva el derecho de modificar las condiciones de la Red de Colaboradores RedesComerciales.ai cuando resulte necesario.</p>
                    <p className="mt-2">Cualquier modificación será comunicada a los Colaboradores a través de la plataforma o por los medios habituales de comunicación de la Red de Colaboradores RedesComerciales.ai.</p>
                </div>
            </div>
        </div>

        <div className="p-10 bg-white dark:bg-brand-darkCard">
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                    {error}
                </div>
            )}

            <label className="flex items-center gap-4 mb-10 p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-white/5 rounded-2xl cursor-pointer">
                <input type="checkbox" className="w-6 h-6 text-brand-primary border-gray-300 rounded" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span className="text-sm text-gray-600 dark:text-gray-400 font-bold leading-snug">
                    He leído y acepto íntegramente las Condiciones Generales del Programa de Colaboradores de RedesComerciales.ai.
                </span>
            </label>

            <div className="mb-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Firma Manuscrita Digital</label>
                <input type="text" placeholder="Escribe tu nombre para firmar..." className="w-full p-6 border-2 border-dashed border-gray-200 dark:border-white/10 dark:bg-brand-darkBg rounded-[1.5rem] text-3xl text-brand-primary dark:text-white focus:outline-none transition-all" value={signature} onChange={(e) => setSignature(e.target.value)} style={{ fontFamily: 'cursive' }} />
            </div>

            <p className="text-[10px] text-gray-400 italic mb-10 text-center px-4">
                “El usuario acepta electrónicamente el presente documento mediante acción afirmativa desde su cuenta registrada, quedando constancia de fecha, hora, IP y versión del documento.”
            </p>

            <div className="flex justify-end gap-4">
                <button onClick={handleSign} disabled={!agreed || !signature.trim() || signing} className="px-12 py-4 bg-brand-primary text-white font-black rounded-xl shadow-xl hover:scale-[1.02] disabled:opacity-50 transition-all uppercase text-[10px] tracking-widest">
                    {signing ? "Procesando firma..." : "Firmar Convenio"}
                </button>
            </div>
        </div>
      </div>

      {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/95 backdrop-blur-xl p-4 animate-fade-in">
              <div className="bg-white dark:bg-brand-darkCard max-w-md w-full p-12 rounded-[3rem] text-center shadow-2xl border border-gray-100 dark:border-white/5">
                  <div className="w-24 h-24 bg-brand-secondary/10 rounded-full flex items-center justify-center mx-auto mb-8 text-5xl">📄</div>
                  <h2 className="text-3xl font-black text-brand-dark dark:text-white uppercase tracking-tighter mb-4">¡Convenio Firmado!</h2>
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-10">Tu colaboración ha sido formalizada correctamente. Ya puedes acceder a todas las herramientas del portal.</p>
                  <div className="space-y-3">
                      <button onClick={() => generatePDF(user.nombre, user.email, user.nivel_elegido, signature, ipAddress, finalHash)} className="w-full py-4 bg-brand-success text-brand-dark font-black rounded-2xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                          Descargar Copia (PDF)
                      </button>
                      <button onClick={() => navigate('/portal')} className="w-full py-4 bg-brand-primary text-white font-black rounded-2xl uppercase tracking-widest text-[10px]">Ir a mi Panel</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Contract;
