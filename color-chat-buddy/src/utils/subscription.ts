import { supabase } from '@/integrations/supabase/client';
import { Subscription } from '@/hooks/useSubscription';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  message_limit: number;
  features: string[];
}

export async function getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error) {
    console.error('Error fetching plan:', error);
    return null;
  }

  return data;
}

export async function checkMessageLimit(subscription: Subscription | null): Promise<boolean> {
  if (!subscription) {
    // Free tier default limit
    const freePlan = await getSubscriptionPlan('free');
    return freePlan ? freePlan.message_limit > 0 : false;
  }

  return subscription.messages_used < subscription.message_limit;
}

export async function incrementMessageCount(userId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_message_count', {
    user_id: userId
  });

  if (error) {
    console.error('Error incrementing message count:', error);
    throw error;
  }
}

export function getRemainingMessages(subscription: Subscription | null): number {
  if (!subscription) return 0;
  return Math.max(0, subscription.message_limit - subscription.messages_used);
}

export function isProUser(subscription: Subscription | null): boolean {
  return subscription?.plan_type === 'pro' && subscription?.status === 'active';
}

export function getSubscriptionFeatures(subscription: Subscription | null): string[] {
  if (!subscription || subscription.status !== 'active') {
    return [
      '100 messages per month',
      'Basic color generation',
      'Standard response time'
    ];
  }

  if (subscription.plan_type === 'pro') {
    return [
      '1000 messages per month',
      'Advanced color generation',
      'Priority response time',
      'Custom color palettes',
      'Export in multiple formats',
      'Color history tracking'
    ];
  }

  return [];
}
