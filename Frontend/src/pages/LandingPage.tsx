import Video from "../components/LandingPage/Video";
import HomeHeroText from "../components/LandingPage/HomeHeroText";
import HomeBottomText from "../components/LandingPage/HomeBottomText";
import { MenuButton } from "../components/LandingPage/MenuButton";
import { EditorialScrollCard } from "../components/LandingPage/EditorialScrollCard";

const LandingPage = () => {
  return (
    <div className="relative w-full min-h-screen bg-black">
      {/* ── Fixed Cinematic Video Background ───────────────── */}
      <div className="fixed inset-0 z-0">
        <Video />
      </div>

      {/* Dark overlay for contrast */}
      <div className="fixed inset-0 z-10 bg-black/40 pointer-events-none" />

      {/* Menu Button */}
      <MenuButton onClick={() => {}} />

      {/* ── First Viewport: Cinematic Hero Screen ──────────── */}
      <div className="relative z-20 h-screen w-full flex flex-col justify-around">
        <HomeHeroText />
        <HomeBottomText />
      </div>

      {/* ── Scroll Section: Pinned 95vw White Editorial Card ─ */}
      <div className="relative z-20">
        <EditorialScrollCard />
      </div>
    </div>
  );
};

export default LandingPage;