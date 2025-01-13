import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, Upload } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const CourtSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [open, setOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>("/lovable-uploads/1b9b6b64-0bcc-42d0-9d2b-dd0c359ad5d2.png");
  const courts = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleCourtSelection = (court: number) => {
    const selectedDate = startOfDay(date);
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    navigate(`/court/${court}/${formattedDate}`);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive"
        });
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-volleyball-red">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex flex-col items-center mb-8">
          <img src={logoUrl} alt="Logo" className="w-48 h-48 object-contain mb-4" />
          
          {/* Logo upload button */}
          <div className="mb-4">
            <label htmlFor="logo-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 bg-volleyball-cream text-volleyball-black px-4 py-2 rounded-md hover:bg-volleyball-cream/90 transition-colors">
                <Upload size={16} />
                <span>Upload Logo</span>
              </div>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="bg-volleyball-black/80 rounded-lg p-4 mb-8 max-w-xs mx-auto">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-volleyball-cream hover:bg-volleyball-cream/90 text-sm py-1",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(startOfDay(newDate));
                    setOpen(false);
                  }
                }}
                initialFocus
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {courts.map((court) => (
            <div
              key={court}
              className="bg-volleyball-black/80 rounded-lg p-4"
            >
              <Button
                className="w-full h-20 text-2xl bg-volleyball-cream text-volleyball-black hover:bg-volleyball-cream/90 transition-colors"
                onClick={() => handleCourtSelection(court)}
              >
                Court {court}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourtSelection;