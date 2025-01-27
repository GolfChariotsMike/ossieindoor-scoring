import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-volleyball-red">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-center">
          <Link
            to="/courts"
            className="bg-volleyball-black hover:bg-volleyball-black/90 text-volleyball-cream px-16 py-8 rounded-xl text-center text-2xl font-bold transition-colors"
          >
            Courts
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;