import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  // This is needed to use the Fetch API rather than relying on the Node http client
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { session_id } = await req.json()

    // Retrieve the customer ID from subscription
    const subscription = await stripe.subscriptions.retrieve(session_id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Create a billing portal session with promotion codes enabled
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.customer as string,
      return_url: `${req.headers.get('origin')}/dashboard`,
      features: {
        subscription_update: {
          enabled: true,
          proration_behavior: 'create_prorations',
          default_allowed_updates: ['price']
        },
        customer_update: {
          enabled: true,
          allowed_updates: ['email', 'address', 'shipping']
        },
        invoice_history: {
          enabled: true
        },
        payment_method_update: {
          enabled: true
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: ['too_expensive', 'missing_features', 'switched_service', 'unused', 'other']
          }
        },
        subscription_pause: {
          enabled: false
        },
        billing_address_collection: {
          enabled: true
        },
        promotion_code: {
          enabled: true
        }
      }
    })

    // Return the session URL
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
