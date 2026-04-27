import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend"

// Fix: Use globalThis to safely access Deno in Supabase Edge Functions environment
const resend = new Resend((globalThis as any).Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar preflight de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, signature, level, date } = await req.json()

    const roleName = level === 1 ? 'Colaborador' : 'Colaborador'; // Both are Colaborador now

    const { data, error } = await resend.emails.send({
      from: 'RedesComerciales.ai Ecosystem <onboarding@redescomerciales.ai>',
      to: [email],
      subject: `📄 Tu Convenio RedesComerciales.ai - ${name}`,
      html: `
        <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; padding: 50px; border-radius: 30px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 24px; font-weight: 900; color: #2D3E50; letter-spacing: -1px;">
              Redes<span style="color: #E31E24;">Comerciales.ai</span>
            </span>
          </div>
          <h2 style="color: #2D3E50; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px; text-align: center;">¡Convenio Firmado!</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; text-align: center;">Hola <strong>${name}</strong>, has completado con éxito la firma de tu convenio como <strong>${roleName}</strong> en el ecosistema RedesComerciales.ai.</p>
          
          <div style="background-color: #f7fafc; padding: 30px; border-radius: 20px; margin: 30px 0; border: 1px solid #edf2f7;">
            <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; color: #E31E24; text-transform: uppercase; letter-spacing: 1px;">Detalles de la operación</p>
            <p style="margin: 5px 0; color: #2D3E50; font-size: 14px;"><strong>Fecha de firma:</strong> ${new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p style="margin: 5px 0; color: #2D3E50; font-size: 14px;"><strong>ID de Seguridad:</strong> RC-${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            <p style="margin: 15px 0 0 0; color: #2D3E50; font-size: 18px; font-style: italic; border-top: 1px dashed #cbd5e0; padding-top: 15px;">Firma: <span style="font-family: cursive;">${signature}</span></p>
          </div>
          
          <p style="color: #718096; font-size: 13px; text-align: center;">Ya puedes acceder a tu panel de gestión para registrar tus primeras oportunidades y monitorizar tu pipeline.</p>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
             <p style="font-weight: 800; color: #2D3E50; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">RedesComerciales.ai Ecosystem</p>
             <p style="color: #a0aec0; font-size: 10px;">Líderes en Redes de Venta impulsadas por IA</p>
          </div>
        </div>
      `,
    })

    if (error) throw error

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})