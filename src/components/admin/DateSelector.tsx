import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, format, parse } from "date-fns";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const DateSelector = ({ selectedDate, onDateChange }: DateSelectorProps) => {
  const handlePreviousDay = () => {
    const currentDate = parse(selectedDate, 'yyyy-MM-dd', new Date());
    const newDate = addDays(currentDate, -1);
    onDateChange(format(newDate, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const currentDate = parse(selectedDate, 'yyyy-MM-dd', new Date());
    const newDate = addDays(currentDate, 1);
    onDateChange(format(newDate, 'yyyy-MM-dd'));
  };

  return (
    <div className="flex items-center space-x-4 bg-white rounded-lg shadow p-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePreviousDay}
        className="hover:bg-gray-100"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center space-x-2">
        <Calendar className="text-volleyball-red h-5 w-5" />
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="border-none focus:ring-0"
        />
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextDay}
        className="hover:bg-gray-100"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};