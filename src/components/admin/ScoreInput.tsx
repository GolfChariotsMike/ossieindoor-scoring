
import { Input } from "@/components/ui/input";

interface ScoreInputProps {
  value: number;
  onChange: (value: number) => void;
  isEditing: boolean;
}

export const ScoreInput = ({ value, onChange, isEditing }: ScoreInputProps) => {
  if (!isEditing) {
    return <span>{value || 0}</span>;
  }

  return (
    <Input
      type="number"
      min="0"
      value={value || 0}
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      className="w-16 text-center"
    />
  );
};
