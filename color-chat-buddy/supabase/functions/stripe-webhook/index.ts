import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"
import Stripe from 'https://esm.sh/stripe@13.10.0'

// Initialize Stripe with API version
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

// Create crypto provider for webhook signature verification
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

// Get environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

if (!supabaseUrl || !supabaseKey || !endpointSecret) {
  throw new Error('Missing required environment variables')
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

// Track processed events to prevent duplicates
const processedEvents = new Set()

async function handleCheckoutSessionCompleted(session: any) {
  try {
    // Get customer email from session
    const customerEmail = session.customer_details?.email;
    if (!customerEmail) {
      throw new Error('No customer email found in session');
    }
    
    // Find user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === customerEmail);
    
    if (userError || !user) {
      throw new Error(`User not found or error: ${userError?.message}`);
    }

    // Get subscription details
    if (!session.subscription) {
      throw new Error('No subscription found in session');
    }

    const subscription = await stripe.subscriptions.retrieve(session.subscription);

    // Update user profile to pro
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: 'pro',
        is_pro: true,
        message_limit: 500,
        messages_used: 0
      })
      .eq('id', user.id);

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    // Save basic subscription info
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        id: subscription.id,
        user_id: user.id,
        status: 'active',
        stripe_subscription_id: subscription.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (subscriptionError) {
      throw new Error(`Failed to save subscription: ${subscriptionError.message}`);
    }

    console.log('✅ Subscription activated for user:', user.email);

  } catch (error) {
    console.error('❌ Error in handleCheckoutSessionCompleted:', error.message);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    console.log('✅ Subscription updated:', {
      subscription_id: subscription.id,
      status: subscription.status
    });
  } catch (error) {
    console.error('❌ Error in handleSubscriptionUpdated:', error.message);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    // Get subscription details to find user
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('id', subscription.id)
      .single();

    if (subError || !subData) {
      throw new Error(`Failed to find subscription: ${subError?.message}`);
    }

    // Update subscription status
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('id', subscription.id);

    if (deleteError) {
      throw new Error(`Failed to cancel subscription: ${deleteError.message}`);
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'free',
        is_pro: false,
        message_limit: 3,
        messages_used: 0
      })
      .eq('id', subData.user_id);

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    console.log('✅ Subscription canceled and profile updated:', subscription.id);
  } catch (error) {
    console.error('❌ Error in handleSubscriptionDeleted:', error.message);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'No signature found' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the event first to get basic information
    let event = JSON.parse(body);
    console.log('Received event type:', event.type);

    // Verify webhook signature
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        endpointSecret,
        undefined,
        cryptoProvider
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ received: true }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate events
    if (processedEvents.has(event.id)) {
      return new Response(
        JSON.stringify({ received: true, duplicate: true }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add event to processed set
    processedEvents.add(event.id);

    // Trim processed events set to prevent memory leaks
    if (processedEvents.size > 1000) {
      const values = Array.from(processedEvents);
      values.slice(0, 100).forEach(id => processedEvents.delete(id));
    }

    console.log('🔍 Processing event:', event.type, 'id:', event.id);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    // Always return success to Stripe
    return new Response(
      JSON.stringify({ received: true }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
