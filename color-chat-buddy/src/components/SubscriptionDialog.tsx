import { useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getRemainingMessages } from "@/utils/subscription";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

interface SubscriptionDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionDialog = ({
  open,
  setOpen,
  refreshSubscription,
}: SubscriptionDialogProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { subscription, isLoading, remainingMessages, usagePercentage } = useSubscription();
  const handleRedirect = async () => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(location.search);

    if (query.get('success')) {
      toast.success('Payment successful!');
      // Refresh subscription status
      await refreshSubscription();
      navigate('/');
    }

    if (query.get('canceled')) {
      toast.error('Payment cancelled -- please try again.');
    }
  };

  useEffect(() => {
    handleRedirect();
  }, [navigate, location.search]);

  // Handle customer portal session creation
  const handleCustomerPortal = async () => {
    try {
      if (!user?.email) {
        toast.error('Please sign in to manage your subscription');
        return;
      }

      const { data: { url }, error } = await supabase.functions.invoke('customer-portal', {
        body: { email: user.email },
      });

      if (error) {
        console.error('Error:', error);
        toast.error('Failed to access customer portal. Please try again.');
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred. Please try again later.');
    }
  };

  // Handle checkout session creation
  const handleCheckout = async (priceId: string) => {
    try {
      if (!user?.email) {
        toast.error('Please sign in to subscribe');
        return;
      }

      console.log('Starting checkout process with:', { priceId, email: user.email });

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, email: user.email },
      });

      console.log('Checkout response:', { data, error });

      if (error) {
        console.error('Checkout error:', error);
        toast.error('Failed to start checkout process. Please try again.');
        return;
      }

      if (!data?.url) {
        console.error('No checkout URL returned');
        toast.error('Failed to create checkout session. Please try again.');
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Unexpected error during checkout:', error);
      toast.error('An unexpected error occurred. Please try again later.');
    }
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-4">
              Subscription Status
            </DialogTitle>
          </DialogHeader>
          <div className="w-full p-4 text-center space-y-4">
            <p className="text-gray-500">Please sign in to view subscription options</p>
            <Button
              onClick={() => {
                setOpen(false);
                // Login dialog can be opened here
                window.dispatchEvent(new CustomEvent('open-login-dialog'));
              }}
              className="w-full"
            >
              Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] bg-white">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-center text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#E779B1] to-[#A17A97]">Pro Plans</DialogTitle>
          <DialogDescription className="text-center mt-2 text-gray-600">
            Choose a subscription plan to unlock more features and AI assistant usage.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 px-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Weekly Plan */}
              <div className="relative border rounded-xl p-6 flex flex-col h-full bg-gradient-to-br from-white to-[#F9FAFB]/30 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-[#D1D5DB]/70 shadow">
                <div className="text-xl font-bold mb-2 text-[#374151]">Weekly</div>
                <div className="text-3xl font-bold mb-4 text-[#374151]">$2.99</div>
                <div className="text-sm text-gray-500 mb-4">Billed weekly</div>
                <div className="flex-grow">
                  <ul className="text-left text-sm space-y-3 mb-6">
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center mr-2">
                        <span className="text-pink-500">✓</span>
                      </span>
                      <span className="text-gray-700">Create palettes without daily limits</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center mr-2">
                        <span className="text-pink-500">✓</span>
                      </span>
                      <span className="text-gray-700">200 palette generations with ColorGen Assistant</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center mr-2">
                        <span className="text-pink-500">✓</span>
                      </span>
                      <span className="text-gray-700">Save unlimited colors and palettes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center mr-2">
                        <span className="text-pink-500">✓</span>
                      </span>
                      <span className="text-gray-700">Advanced palette generation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center mr-2">
                        <span className="text-pink-500">✓</span>
                      </span>
                      <span className="text-gray-700">Priority support</span>
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={() => {
                    console.log('Weekly plan checkout clicked');
                    handleCheckout('price_1QvLcfKrwythZBNmKot5welR');
                  }}
                  variant="outline"
                  className="w-full mt-auto rounded-full py-6 font-medium bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700"
                >
                  Subscribe Weekly
                </Button>
              </div>

              {/* Monthly Plan */}
              <div className="relative border rounded-xl p-6 flex flex-col h-full bg-gradient-to-br from-white to-[#FDF2F8]/30 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-[#ff4d8d]/20 shadow bg-[#fff5f9]">
                <Badge className="absolute -top-2 -right-2 bg-[#ff4d8d] hover:bg-[#e6457f] px-3 py-1 border-0 font-medium">
                  Best Value
                </Badge>
                <div className="text-xl font-bold mb-2 text-[#374151]">Monthly</div>
                <div className="text-3xl font-bold mb-4 text-[#374151]">$9.99</div>
                <div className="text-sm text-gray-500 mb-4">Billed monthly <span className="text-[#ff4d8d]">(Save 16%)</span></div>
                <div className="flex-grow">
                  <ul className="text-left text-sm space-y-3 mb-6">
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#fff0f5] flex items-center justify-center mr-2">
                        <span className="text-[#ff4d8d]">✓</span>
                      </span>
                      <span className="text-gray-700">Create palettes without daily limits</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#fff0f5] flex items-center justify-center mr-2">
                        <span className="text-[#ff4d8d]">✓</span>
                      </span>
                      <span className="text-gray-700">1,000 palette generations with ColorGen Assistant</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#fff0f5] flex items-center justify-center mr-2">
                        <span className="text-[#ff4d8d]">✓</span>
                      </span>
                      <span className="text-gray-700">Save unlimited colors and palettes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#fff0f5] flex items-center justify-center mr-2">
                        <span className="text-[#ff4d8d]">✓</span>
                      </span>
                      <span className="text-gray-700">Advanced palette generation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#fff0f5] flex items-center justify-center mr-2">
                        <span className="text-[#ff4d8d]">✓</span>
                      </span>
                      <span className="text-gray-700">Priority support</span>
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={() => handleCheckout('price_1QvHg9KrwythZBNmc6mPbqOp')}
                  className="w-full mt-auto rounded-full py-6 font-medium bg-[#ff4d8d] hover:bg-[#e6457f] text-white"
                >
                  Subscribe Monthly
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mt-6 text-center">
              By subscribing, you agree to our terms of service and privacy policy.
              Cancel anytime. All plans include access to our AI Assistant for generating beautiful color palettes.
            </p>
          </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionDialog;
