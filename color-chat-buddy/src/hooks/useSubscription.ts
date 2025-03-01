import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Subscription {
  id: string;
  status: string;
  plan_type: string;
  message_limit: number;
  messages_used: number;
  current_period_end: string;
}

export interface Profile {
  is_pro: boolean;
  subscription_status: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const userId = user?.id;
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingMessages, setRemainingMessages] = useState(0);
  const [usagePercentage, setUsagePercentage] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let channel: any;

    async function getSubscription() {
      if (!userId || !isMounted) return;

      try {
        // First, get the user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_pro,subscription_status')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw new Error(`Failed to fetch profile: ${profileError.message}`);
        }

        if (!profile?.is_pro || profile.subscription_status !== 'pro') {
          if (isMounted) {
            setSubscription(null);
            setIsLoading(false);
            setError(null);
            setRemainingMessages(0);
            setUsagePercentage(0);
          }
          return;
        }

        // Then, get the active subscription
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (subError) {
          console.error('Error fetching subscription:', subError);
          throw new Error(`Failed to fetch subscription: ${subError.message}`);
        }

        if (isMounted) {
          setSubscription(subData);
          setIsLoading(false);
          setError(null);
          setRemainingMessages(subData.message_limit - subData.messages_used);
          setUsagePercentage((subData.messages_used / subData.message_limit) * 100);
        }
      } catch (error) {
        console.error('Subscription error:', error);
        if (isMounted) {
          setSubscription(null);
          setIsLoading(false);
          setError(error instanceof Error ? error.message : 'An unknown error occurred');
          setRemainingMessages(0);
          setUsagePercentage(0);
        }
      }
    }

    getSubscription();

    if (userId) {
      channel = supabase
        .channel(`subscription_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subscriptions',
            filter: `user_id=eq.${userId}`,
          },
          () => getSubscription()
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  const refreshSubscription = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        setSubscription(null);
        setError(`Failed to fetch subscription: ${error.message}`);
        setRemainingMessages(0);
        setUsagePercentage(0);
      } else {
        console.log('Fetched subscription:', data);
        setSubscription(data);
        setError(null);
        setRemainingMessages(data.message_limit - data.messages_used);
        setUsagePercentage((data.messages_used / data.message_limit) * 100);
      }
    } catch (error) {
      console.error('Error:', error);
      setSubscription(null);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setRemainingMessages(0);
      setUsagePercentage(0);
    } finally {
      setIsLoading(false);
    }
  };

  return { subscription, isLoading, error, remainingMessages, usagePercentage, refreshSubscription };
}
