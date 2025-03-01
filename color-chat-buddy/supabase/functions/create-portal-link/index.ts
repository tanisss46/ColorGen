import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  })
  // CORS için OPTIONS isteğini işle
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Authorization header'ı kontrol et
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Valid Bearer token is required' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      }
    )
  }

  // Token'ı çıkar ve kontrol et
  const token = authHeader.replace('Bearer ', '')
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Invalid authorization token' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      }
    )
  }

  try {
    // Content-Type kontrolü
    const contentType = req.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Content-Type must be application/json')
    }

    // Request body'yi parse et
    const body = await req.json().catch(() => {
      throw new Error('Invalid JSON in request body')
    })

    // customerId kontrolü
    console.log('Request body:', body)

    const { customerId } = body
    if (!customerId || typeof customerId !== 'string') {
      console.log('Invalid customer ID:', { customerId })
      throw new Error('Invalid or missing customer ID')
    }

    // Stripe API key kontrolü
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key is not configured')
    }

    // Stripe client'ı oluştur
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient()
    })

    // Portal session'ı oluştur
    console.log('Creating Stripe portal session for customer:', customerId)

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://color-chat-buddy.vercel.app/dashboard'
    }).catch((stripeError) => {
      throw new Error(`Stripe error: ${stripeError.message}`)
    })

    // Başarılı yanıt
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    // Hata detaylarını logla
    console.error('Function error:', error)

    // Hata türüne göre uygun HTTP status kodu belirle
    let status = 500
    if (error.message.includes('Content-Type')) status = 400
    if (error.message.includes('Invalid JSON')) status = 400
    if (error.message.includes('customer ID')) status = 400
    if (error.message.includes('Stripe error')) status = 502

    // Hata yanıtı
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      }
    )
  }
})
