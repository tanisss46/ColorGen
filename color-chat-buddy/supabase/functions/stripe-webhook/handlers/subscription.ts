import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { stripe } from '../stripe.ts'
import { createErrorResponse } from '../utils.ts'
import { corsHeaders } from '../types.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(supabaseUrl!, supabaseKey!)

export async function handleCheckoutCompleted(session: any) {
  try {
    console.log('🔔 Processing checkout.session.completed')
    
    // Session'dan subscription ID'sini al
    const subscriptionId = session?.subscription
    if (!subscriptionId) {
      console.error('No subscription ID found in session')
      return createErrorResponse('No subscription ID found', 400)
    }

    // Stripe'dan subscription detaylarını al
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    // Subscription'ın customer ID'sini al
    const customerId = subscription.customer as string
    
    // Stripe customer'ı al
    const customer = await stripe.customers.retrieve(customerId)
    if (!customer || customer.deleted) {
      return createErrorResponse('Customer not found', 400)
    }

    // Customer email'ini al
    const customerEmail = typeof customer === 'object' ? customer.email : null
    if (!customerEmail) {
      return createErrorResponse('Customer email not found', 400)
    }

    // Supabase'de bu email'e sahip kullanıcıyı bul
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', customerEmail)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return createErrorResponse('User not found', 400)
    }

    // Subscription'ı kaydet
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        id: subscriptionId,
        user_id: userData.id,
        status: 'active',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })

    if (subscriptionError) {
      console.error('Error saving subscription:', subscriptionError)
      return createErrorResponse('Error saving subscription', 500)
    }

    return new Response(
      JSON.stringify({ success: true }), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error)
    return createErrorResponse('Server error', 500)
  }
}
