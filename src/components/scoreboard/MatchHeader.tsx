interface MatchHeaderProps {
  court: number;
  startTime: string;
  division?: string;
}

export const MatchHeader = ({ court, startTime, division }: MatchHeaderProps) => {
  return (
    <div className="text-white text-center mb-4">
      <div className="text-xl">Court {court}</div>
      <div className="text-sm opacity-75">
        {new Date(startTime).toLocaleTimeString()}
      </div>
      {division && (
        <div className="text-sm opacity-75 mt-1">
          {division}
        </div>
      )}
    </div>
  );
};