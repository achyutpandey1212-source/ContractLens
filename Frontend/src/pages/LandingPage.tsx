import Video from "../components/LandingPage/Video";
import HomeHeroText from "../components/LandingPage/HomeHeroText";
import HomeBottomText from "../components/LandingPage/HomeBottomText";
import { MenuButton } from "../components/LandingPage/MenuButton";

const LandingPage = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Full-screen video background */}
      <div className="fixed inset-0 z-0">
        <Video />
      </div>
      
      {/* Dark overlay for text readability */}
      <div className="fixed inset-0 z-10 bg-black/40" />
      
      {/* Menu Button */}
      <MenuButton onClick={() => {}} />
      
      {/* Content */}
      <div className="relative z-20 h-screen w-full flex flex-col justify-around">
        <HomeHeroText />
        <HomeBottomText />
      </div>
    </div>
  );
};

export default LandingPage;