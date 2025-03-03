import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SavedColor, SavedPalette } from "@/types/color";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Bookmark, ChevronDown, Copy, Trash2, ArrowUpRight, CreditCard } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import Logo from "./Logo";
import SubscriptionDialog from "./SubscriptionDialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface NavbarProps {
  user: User | null;
  savedColors: SavedColor[];
  savedPalettes: SavedPalette[];
  onLogin: () => void;
  onLogout: () => Promise<void>;
  onPaletteSelect?: (colors: string[]) => void;
  onColorSelect?: (color: string) => void;
  onDeleteColor?: (color: string) => void;
  onDeletePalette?: (id: string) => void;
  onSavePalette?: () => void;
  isPro?: boolean;
  selectedColors?: any[];
  selectedPalette?: any;
  onOpenLogin?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

const Navbar = ({
  user,
  savedColors = [],
  savedPalettes = [],
  onLogin,
  onLogout,
  onPaletteSelect,
  onColorSelect,
  onDeleteColor,
  onDeletePalette,
  onSavePalette,
  isPro = false,
  selectedColors,
  selectedPalette,
  onOpenLogin,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}: NavbarProps) => {
  const [activeTab, setActiveTab] = useState<'palettes' | 'colors'>('palettes');

  // Session durumunu kontrol et
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
    };
    checkSession();
  }, []);

  const handleCopyColor = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      toast.success("Color code copied!");
    } catch (error) {
      toast.error("Failed to copy color code");
    }
  };

  const handleCopyPalette = async (colors: string[]) => {
    try {
      await navigator.clipboard.writeText(colors.join(", "));
      toast.success("Palette colors copied!");
    } catch (error) {
      toast.error("Failed to copy palette");
    }
  };

  return (
    <div className="relative flex items-center justify-between h-14 px-4 bg-gray-100 z-40">
      <div className="flex items-center">
        <Logo onClick={() => {
          // Reset to home state if needed
          window.location.href = '/';
        }} />
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-gray-950 hover:bg-gray-200">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Saved
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-[320px] bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden p-2" 
                align="end" 
                side="bottom" 
                sideOffset={4}
                style={{ zIndex: 100 }}
              >
                <div className="flex gap-2 mb-3">
                  <Button
                    variant={activeTab === 'palettes' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setActiveTab('palettes')}
                  >
                    Saved Palettes
                  </Button>
                  <Button
                    variant={activeTab === 'colors' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setActiveTab('colors')}
                  >
                    Saved Colors
                  </Button>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {activeTab === 'palettes' ? (
                    savedPalettes?.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {savedPalettes.map(palette => (
                          <DropdownMenuItem 
                            key={palette.id} 
                            className="flex items-center justify-between p-2 focus:bg-gray-50 hover:bg-gray-50 rounded-md cursor-pointer"
                            onKeyDown={(e) => {
                              if (e.key === 'Delete' || e.key === 'Backspace') {
                                e.preventDefault();
                                onDeletePalette?.(palette.id);
                              }
                            }}
                            onClick={() => {
                              console.log("Palette selected:", palette.colors);
                              onPaletteSelect?.(palette.colors);
                            }}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex gap-0.5 flex-1">
                                {palette.colors.map((color, index) => (
                                  <div
                                    key={`${palette.id}-${index}`}
                                    className="h-4 flex-1 first:rounded-l last:rounded-r"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleCopyPalette(palette.colors);
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <Copy className="w-3 h-3 text-gray-600" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onDeletePalette?.(palette.id);
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <Trash2 className="w-3 h-3 text-gray-600" />
                                </button>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ) : (
                      <div className="py-2 text-sm text-center text-gray-500">
                        No saved palettes yet
                      </div>
                    )
                  ) : (
                    savedColors?.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {savedColors.map(color => (
                          <DropdownMenuItem 
                            key={color.id} 
                            className="flex items-center justify-between p-2 focus:bg-gray-50 hover:bg-gray-50 rounded-md cursor-pointer"
                            onKeyDown={(e) => {
                              if (e.key === 'Delete' || e.key === 'Backspace') {
                                e.preventDefault();
                                onDeleteColor?.(color.color_value);
                              }
                            }}
                            onClick={() => {
                              console.log("Color selected:", color.color_value);
                              onColorSelect?.(color.color_value);
                            }}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div 
                                className="w-6 h-6 rounded-full border border-gray-200" 
                                style={{ backgroundColor: color.color_value }}
                              />
                              <span className="text-sm text-gray-700">{color.color_value}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleCopyColor(color.color_value);
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Copy className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  onDeleteColor?.(color.color_value);
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ) : (
                      <div className="py-2 text-sm text-center text-gray-500">
                        No saved colors yet
                      </div>
                    )
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge variant={isPro ? 'default' : 'secondary'} className="capitalize">
              {isPro ? 'PRO' : 'FREE'}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-gray-950 bg-slate-400 hover:bg-slate-300"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.user_metadata.avatar_url} />
                    <AvatarFallback>
                      {user.email?.[0].toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-white"
                side="bottom"
                sideOffset={4}
                style={{ zIndex: 100 }}
              >
                <DropdownMenuItem asChild>
                  <a
                    href="#"
                    className="relative flex items-center"
                    onClick={async (e) => {
                      e.preventDefault();
                      const target = e.currentTarget;
                      const originalContent = target.innerHTML;
                      
                      try {
                        // Loading durumunu göster
                        target.innerHTML = `
                          <div class="flex items-center">
                            <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading...
                          </div>
                        `;

                        // Stripe customer ID'yi al
                        const { data: profile, error: profileError } = await supabase
                          .from('profiles')
                          .select('stripe_customer_id')
                          .single();

                        if (profileError) throw profileError;
                        if (!profile?.stripe_customer_id) {
                          throw new Error('No Stripe customer ID found. Please contact support.');
                        }

                        // Auth session'ı al
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session?.access_token) {
                          throw new Error('No active session found');
                        }

                        // Request body hazırla
                        const requestBody = { customerId: profile.stripe_customer_id };
                        console.log('Sending request with body:', requestBody);

                        // Portal link oluştur
                        const { data, error } = await supabase.functions.invoke('create-portal-link', {
                          body: requestBody,  // Supabase otomatik olarak JSON.stringify yapıyor
                          headers: {
                            'Authorization': `Bearer ${session.access_token}`
                          }
                        });

                        console.log('Response:', { data, error });

                        if (error) throw error;
                        if (!data?.url) throw new Error('No portal URL returned from server');

                        // Portal'a yönlendir
                        window.location.href = data.url;
                      } catch (error) {
                        console.error('Subscription portal error:', error);
                        toast.error(
                          error instanceof Error
                            ? `Failed to open subscription portal: ${error.message}`
                            : 'An unexpected error occurred'
                        );
                        // Hata durumunda orijinal içeriği geri yükle
                        target.innerHTML = originalContent;
                      }
                    }}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Subscription
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button
            variant="ghost"
            className="text-gray-950 hover:bg-gray-200"
            onClick={onLogin}
          >
            Login
          </Button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
