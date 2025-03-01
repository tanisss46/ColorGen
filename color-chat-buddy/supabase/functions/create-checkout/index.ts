import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import Stripe from 'https://esm.sh/stripe@13.10.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const origin = req.headers.get('origin') || 'http://localhost:8080'

    // Create Portal Session
    if (url.pathname === '/create-portal-session') {
      const { session_id } = await req.json()
      if (!session_id) {
        throw new Error('Session ID is required')
      }

      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id)
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: checkoutSession.customer as string,
        return_url: `${origin}/dashboard`,
      })

      return new Response(
        JSON.stringify({ url: portalSession.url }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get user data from Supabase
    const { data: { user: userData }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    console.log('User data:', userData)

    if (userError || !userData) {
      throw new Error(userError?.message || 'User not found')
    }

    // Get or create Stripe customer
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userData.id)
      .single()

    console.log('Profile data:', profile)

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          supabase_user_id: userData.id
        }
      })

      console.log('Created new Stripe customer:', customer)

      customerId = customer.id

      // Save Stripe customer ID to profile
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userData.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        throw updateError
      }
    }

    // Get price ID from request
    const { priceId } = await req.json()
    if (!priceId) {
      throw new Error('Price ID is required')
    }

    console.log('Creating checkout session with:', { priceId, customerId, userData })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,  // Lock email
      client_reference_id: userData.id, // Add Supabase user ID
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_email: userData.email,
          supabase_user_id: userData.id,
          plan_type: priceId === 'price_1QvHgmKrwythZBNmI3SjOClR' ? 'yearly' : 
                     priceId === 'price_1QvHg9KrwythZBNmc6mPbqOp' ? 'monthly' : 'weekly'
        }
      },
      success_url: `${origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=true`,
    })

    console.log('Created checkout session:', session)

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
});
