
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// El token se obtiene de los Secrets de Supabase
const HUBSPOT_ACCESS_TOKEN = (globalThis as any).Deno.env.get('HUBSPOT_ACCESS_TOKEN')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const { event, email, ...properties } = payload

    if (!HUBSPOT_ACCESS_TOKEN) {
      throw new Error("HUBSPOT_ACCESS_TOKEN no configurado en los Secrets de Supabase.")
    }

    // 1. Construir el objeto de propiedades para HubSpot
    let hubspotProperties: any = {
      email: email
    }

    // Mapeo dinámico según el evento del funnel
    if (event === 'prescriptor-registered') {
      hubspotProperties = {
        ...hubspotProperties,
        firstname: properties.firstname,
        prescriptor_estado: 'registrado',
        nivel_elegido: properties.nivel_elegido?.toString(),
        // Usamos lifecyclestage estándar de HubSpot
        lifecyclestage: 'lead' 
      }
    } else if (event === 'convenio-firmado') {
      hubspotProperties = {
        ...hubspotProperties,
        prescriptor_estado: 'convenio_firmado',
        fecha_firma_convenio: properties.fecha_firma_convenio,
        lifecyclestage: 'opportunity'
      }
    } else if (event === 'prescripcion-creada') {
      hubspotProperties = {
        ...hubspotProperties,
        firstname: properties.candidato_nombre,
        empresa_referida: properties.empresa,
        referido_por: properties.prescriptor_email,
        prescriptor_estado: 'lead_referido',
        lifecyclestage: 'marketingqualifiedlead'
      }
    } else if (event === 'interview-scheduled') {
      hubspotProperties = {
        ...hubspotProperties,
        firstname: properties.firstname,
        fecha_entrevista: properties.fecha_entrevista,
        hora_entrevista: properties.hora_entrevista,
        google_meet_link: properties.google_meet_link,
        prescriptor_estado: 'entrevista_agendada',
        lifecyclestage: 'salesqualifiedlead'
      }
    }

    // 2. Lógica de "Busca y Actualiza o Crea" (Upsert)
    // Buscamos si el email ya existe en tu HubSpot (de esos 20k registros)
    const searchUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${email}?idProperty=email`;
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    let finalResponse;
    if (searchResponse.ok) {
      // EL CONTACTO YA EXISTE: Actualizamos solo las propiedades del funnel
      const existingContact = await searchResponse.json();
      console.log(`Actualizando contacto existente ID: ${existingContact.id}`);
      
      finalResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${existingContact.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ properties: hubspotProperties })
      });
    } else {
      // EL CONTACTO NO EXISTE: Lo creamos nuevo
      console.log(`Creando nuevo contacto para: ${email}`);
      finalResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ properties: hubspotProperties })
      });
    }

    const result = await finalResponse.json();

    return new Response(JSON.stringify({ 
      success: true, 
      action: searchResponse.ok ? 'updated' : 'created',
      hubspot_id: result.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("HubSpot Integration Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
