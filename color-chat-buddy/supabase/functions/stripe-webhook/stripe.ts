
import Stripe from 'https://esm.sh/stripe@14.13.0?target=denonext'

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

export const cryptoProvider = Stripe.createSubtleCryptoProvider()
