import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BillingPortalButtonProps {
  sessionId: string;
}

export default function BillingPortalButton({ sessionId }: BillingPortalButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePortalRedirect = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-portal-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
          }),
        }
      );

      const { url, error } = await response.json();
      if (error) throw new Error(error);

      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to redirect to billing portal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePortalRedirect}
      disabled={loading}
      variant="outline"
      className="w-full"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        'Manage Billing'
      )}
    </Button>
  );
}
