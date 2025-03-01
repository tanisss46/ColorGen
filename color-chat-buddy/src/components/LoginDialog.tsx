import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Key, Loader2, Github } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginDialog = ({ isOpen, onClose }: LoginDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account!");
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        toast.success("Successfully logged in!");
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setIsSignUp(false);
      document.activeElement instanceof HTMLElement && document.activeElement.blur();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        document.activeElement instanceof HTMLElement && document.activeElement.blur();
        onClose();
      }
    }}>
      <DialogContent 
        className="sm:max-w-md text-white bg-slate-100" 
        onPointerDownOutside={() => {
          document.activeElement instanceof HTMLElement && document.activeElement.blur();
        }}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {isSignUp ? "Create an account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-gray-600">
              {isSignUp ? "Sign up to save your favorite colors" : "Sign in to access your saved colors"}
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              className="w-full bg-white text-black hover:bg-gray-100" 
              onClick={() => handleOAuthLogin('google')}
              autoFocus={false}
              tabIndex={-1}
            >
              <FcGoogle className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>
            
            <Button 
              className="w-full bg-[#24292e] hover:bg-[#2f363d]" 
              onClick={() => handleOAuthLogin('github')}
              autoFocus={false}
              tabIndex={-1}
            >
              <Github className="w-5 h-5 mr-2" />
              Continue with GitHub
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-100 px-2 text-gray-600">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <Input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 bg-white border-gray-300 text-gray-900" required />
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 bg-white border-gray-300 text-gray-900" required />
                </div>
              </div>

              <Button type="submit" className="w-full bg-gray-900 text-white hover:bg-gray-800" disabled={isLoading} autoFocus={false} tabIndex={-1}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? "Sign up" : "Sign in"}
              </Button>
            </form>

            <div className="text-center">
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-gray-600 hover:text-gray-900">
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
