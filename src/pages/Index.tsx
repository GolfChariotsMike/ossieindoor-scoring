import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-volleyball-red">
      <div className="max-w-4xl mx-auto p-8">
        <div className="grid grid-cols-2 gap-8">
          <Link
            to="/courts"
            className="bg-volleyball-black hover:bg-volleyball-black/90 text-volleyball-cream p-8 rounded-xl text-center text-2xl font-bold transition-colors"
          >
            Courts
          </Link>
          <Link
            to="/admin"
            className="bg-volleyball-black hover:bg-volleyball-black/90 text-volleyball-cream p-8 rounded-xl text-center text-2xl font-bold transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
