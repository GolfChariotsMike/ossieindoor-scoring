
import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";
import { ScoreInput } from "./ScoreInput";
import { MatchScore } from "./types";

interface MatchScoreEditorProps {
  matchId: string;
  currentScores: MatchScore;
  isEditing: boolean;
  onScoreChange: (setNumber: 1 | 2 | 3, team: 'home' | 'away', value: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const MatchScoreEditor = ({
  isEditing,
  currentScores,
  onScoreChange,
  onSave,
  onCancel
}: MatchScoreEditorProps) => {
  return (
    <>
      <TableCell className="text-center">
        <div className="flex flex-col space-y-2">
          <ScoreInput
            value={currentScores.set1_home_score}
            onChange={(value) => onScoreChange(1, 'home', value)}
            isEditing={isEditing}
          />
          <span className="text-gray-500">-</span>
          <ScoreInput
            value={currentScores.set1_away_score}
            onChange={(value) => onScoreChange(1, 'away', value)}
            isEditing={isEditing}
          />
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex flex-col space-y-2">
          <ScoreInput
            value={currentScores.set2_home_score}
            onChange={(value) => onScoreChange(2, 'home', value)}
            isEditing={isEditing}
          />
          <span className="text-gray-500">-</span>
          <ScoreInput
            value={currentScores.set2_away_score}
            onChange={(value) => onScoreChange(2, 'away', value)}
            isEditing={isEditing}
          />
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex flex-col space-y-2">
          <ScoreInput
            value={currentScores.set3_home_score}
            onChange={(value) => onScoreChange(3, 'home', value)}
            isEditing={isEditing}
          />
          <span className="text-gray-500">-</span>
          <ScoreInput
            value={currentScores.set3_away_score}
            onChange={(value) => onScoreChange(3, 'away', value)}
            isEditing={isEditing}
          />
        </div>
      </TableCell>
      <TableCell>
        {isEditing ? (
          <div className="flex space-x-2">
            <Button
              onClick={onSave}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Save
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            onClick={onCancel}
            className="bg-volleyball-red hover:bg-volleyball-red/90 text-white"
          >
            Edit
          </Button>
        )}
      </TableCell>
    </>
  );
};
