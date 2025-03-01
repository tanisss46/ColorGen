
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const DAILY_MESSAGE_LIMIT = 3;

export const useMessageLimits = (isAuthenticated: boolean) => {
  const [messageCount, setMessageCount] = useState(0);
  const [canSendMessage, setCanSendMessage] = useState(true);
  const [isProUser, setIsProUser] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessageCount();
      checkProStatus();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setMessageCount(0);
      setCanSendMessage(true);
      setIsProUser(false);
    }
  }, [isAuthenticated]);

  const checkProStatus = async () => {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .single();

      if (error) {
        console.error('Error checking pro status:', error);
        return;
      }

      const isPro = subscription?.status === 'active' && 
                   new Date(subscription.current_period_end) > new Date();
      
      setIsProUser(isPro);
      if (isPro) {
        setCanSendMessage(true);
      }
    } catch (error) {
      console.error('Error checking pro status:', error);
    }
  };

  const checkMessageLimit = async () => {
    if (!isAuthenticated) return true;
    if (isProUser) return true;

    try {
      const { data, error } = await supabase
        .rpc('check_daily_message_limit', {
          user_uid: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
      
      setCanSendMessage(!!data);
      return data;
    } catch (error) {
      console.error('Error checking message limit:', error);
      return false;
    }
  };

  const fetchMessageCount = async () => {
    if (isProUser) {
      setMessageCount(0);
      setCanSendMessage(true);
      return;
    }

    try {
      const { data: limitData, error: limitError } = await supabase
        .from('chat_limits')
        .select('*')
        .maybeSingle();

      if (limitError) throw limitError;

      if (limitData) {
        const lastReset = new Date(limitData.last_reset);
        const now = new Date();
        
        if (lastReset.getUTCDate() !== now.getUTCDate() || 
            lastReset.getUTCMonth() !== now.getUTCMonth() || 
            lastReset.getUTCFullYear() !== now.getUTCFullYear()) {
          await supabase
            .from('chat_limits')
            .upsert({
              user_id: (await supabase.auth.getUser()).data.user?.id,
              message_count: 0,
              last_reset: now.toISOString()
            });
          setMessageCount(0);
        } else {
          setMessageCount(limitData.message_count);
        }
      } else {
        await supabase
          .from('chat_limits')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            message_count: 0
          });
        setMessageCount(0);
      }
      
      await checkMessageLimit();
    } catch (error) {
      console.error('Error fetching message count:', error);
    }
  };

  const updateMessageCount = async () => {
    if (!isAuthenticated || isProUser) return;
    
    try {
      const { error } = await supabase
        .from('chat_limits')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          message_count: messageCount + 1,
          last_reset: new Date().toISOString()
        });

      if (error) throw error;
      
      const newCount = messageCount + 1;
      setMessageCount(newCount);
      
      if (newCount >= DAILY_MESSAGE_LIMIT) {
        setCanSendMessage(false);
      }
    } catch (error) {
      console.error('Error updating message count:', error);
    }
  };

  return {
    messageCount,
    canSendMessage,
    checkMessageLimit,
    updateMessageCount,
    isProUser
  };
};
