import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, Volleyball } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CourtSelection = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [open, setOpen] = useState(false);
  const courts = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleCourtSelection = (court: number) => {
    const selectedDate = startOfDay(date);
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    navigate(`/court/${court}/${formattedDate}`);
  };

  return (
    <div className="min-h-screen bg-volleyball-red">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex flex-col items-center mb-8">
          <Volleyball className="w-20 h-20 text-volleyball-cream mb-2" />
          <h1 className="text-2xl font-bold text-volleyball-cream">
            Ossie Indoor Beach Volleyball
          </h1>
        </div>

        <div className="bg-volleyball-black/80 rounded-lg p-4 mb-8 max-w-xs mx-auto">
          <h2 className="text-volleyball-cream text-lg mb-2">Select Date</h2>
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
                {date ? format(date, "PPP") : <span>Pick a date</span>}
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