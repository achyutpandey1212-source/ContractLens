import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const HomeBottomText = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleStartUsing = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="font-lausanne flex items-center justify-center gap-4 pb-16 md:pb-20">
      <button
        onClick={handleStartUsing}
        className="cursor-pointer h-[7.5vw] md:h-[6vw] max-h-[72px] min-h-[46px] w-[42vw] md:w-[32vw] max-w-[420px] text-white border-2 md:border-3 border-white rounded-full px-4 md:px-8 transition-colors hover:bg-transparent hover:text-[#D3FD50] hover:border-[#D3FD50] flex items-center justify-center text-[3.8vw] md:text-[3vw] lg:text-[2.2vw] uppercase font-medium tracking-tight whitespace-nowrap leading-none"
      >
        START USING
      </button>
      <Link
        to="/about"
        className="h-[7.5vw] md:h-[6vw] max-h-[72px] min-h-[46px] w-[42vw] md:w-[32vw] max-w-[420px] text-white border-2 md:border-3 border-white rounded-full px-4 md:px-8 transition-colors hover:bg-transparent hover:text-[#D3FD50] hover:border-[#D3FD50] flex items-center justify-center text-[3.8vw] md:text-[3vw] lg:text-[2.2vw] uppercase font-medium tracking-tight whitespace-nowrap leading-none"
      >
        ABOUT US
      </Link>
    </div>
  );
};

export default HomeBottomText;
