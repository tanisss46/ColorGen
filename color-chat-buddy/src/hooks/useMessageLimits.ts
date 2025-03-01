import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const DAILY_MESSAGE_LIMIT = 3; // Free user message limit

export const useMessageLimits = (isAuthenticated: boolean) => {
  const [messageCount, setMessageCount] = useState(0);
  const [messageLimit, setMessageLimit] = useState(DAILY_MESSAGE_LIMIT); // Default free limit
  const [canSendMessage, setCanSendMessage] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserLimits();
    } else {
      // Reset to default free limits for non-authenticated users
      setMessageLimit(DAILY_MESSAGE_LIMIT);
      setMessageCount(0);
      setCanSendMessage(true);
    }
  }, [isAuthenticated]);

  const fetchUserLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('message_limit, messages_used, subscription_status')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile) {
        // Pro kullanıcılar için 500 mesaj limiti
        const limit = profile.subscription_status === 'pro' ? 500 : 3;
        setMessageLimit(limit);
        setMessageCount(profile.messages_used || 0);
        setCanSendMessage(limit > (profile.messages_used || 0));
      }
    } catch (error) {
      console.error('Error fetching user limits:', error);
      toast.error('Failed to fetch message limits');
    }
  };

  const checkMessageLimit = async () => {
    if (!isAuthenticated) {
      return messageCount < messageLimit;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('message_limit, messages_used, subscription_status')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (!profile) return false;

      // Pro kullanıcılar için 500 mesaj limiti
      const limit = profile.subscription_status === 'pro' ? 500 : 3;
      const canSend = limit > (profile.messages_used || 0);
      setCanSendMessage(canSend);
      
      if (!canSend) {
        toast.error("You've reached your message limit. Please upgrade to Pro for unlimited messages!");
      }

      return canSend;
    } catch (error) {
      console.error('Error checking message limit:', error);
      toast.error('Failed to check message limit');
      return false;
    }
  };

  const updateMessageCount = async () => {
    if (!isAuthenticated) {
      setMessageCount(prev => prev + 1);
      setCanSendMessage(messageCount + 1 < messageLimit);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Önce mevcut kullanıcı bilgilerini al
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('messages_used, subscription_status')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Yeni mesaj sayısını hesapla
      const newMessageCount = (profile?.messages_used || 0) + 1;

      // Mesaj sayısını güncelle
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ messages_used: newMessageCount })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // State'i güncelle
      setMessageCount(newMessageCount);
      const limit = profile?.subscription_status === 'pro' ? 500 : 3;
      setCanSendMessage(newMessageCount < limit);
    } catch (error) {
      console.error('Error updating message count:', error);
      toast.error('Failed to update message count');
    }
  };

  return {
    messageCount,
    messageLimit,
    canSendMessage,
    checkMessageLimit,
    updateMessageCount,
    fetchUserLimits
  };
};
