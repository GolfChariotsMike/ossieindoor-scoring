import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const DateSelector = ({ selectedDate, onDateChange }: DateSelectorProps) => {
  return (
    <div className="flex items-center space-x-2 bg-white rounded-lg shadow p-2">
      <Calendar className="text-volleyball-red h-5 w-5" />
      <Input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        className="border-none focus:ring-0"
      />
    </div>
  );
};