import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PinEntryProps {
  onSuccess: () => void;
}

export const PinEntry = ({ onSuccess }: PinEntryProps) => {
  const [pin, setPin] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data, error } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_name', 'admin_pin')
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to verify PIN",
        variant: "destructive",
      });
      return;
    }

    if (data.setting_value === pin) {
      onSuccess();
    } else {
      toast({
        title: "Invalid PIN",
        description: "Please try again",
        variant: "destructive",
      });
      setPin("");
    }
  };

  return (
    <div className="min-h-screen bg-volleyball-red flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Admin Access</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="text-center text-2xl tracking-widest"
              maxLength={4}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-volleyball-black hover:bg-volleyball-black/90"
          >
            Enter
          </Button>
        </form>
      </div>
    </div>
  );
};