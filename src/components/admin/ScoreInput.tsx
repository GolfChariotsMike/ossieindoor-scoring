import { Input } from "@/components/ui/input";

interface ScoreInputProps {
  value: number;
  onChange: (value: string) => void;
}

export const ScoreInput = ({ value, onChange }: ScoreInputProps) => {
  return (
    <Input
      type="number"
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-center w-16 mx-auto"
    />
  );
};