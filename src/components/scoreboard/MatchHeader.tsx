interface MatchHeaderProps {
  court: number;
  startTime: string;
}

export const MatchHeader = ({ court, startTime }: MatchHeaderProps) => {
  return (
    <div className="text-white text-center mb-4">
      <div className="text-xl">Court {court}</div>
      <div className="text-sm opacity-75">
        {new Date(startTime).toLocaleTimeString()}
      </div>
    </div>
  );
};