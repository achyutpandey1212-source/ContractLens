import { useState } from "react";
import Video from "../components/LandingPage/Video";
import HomeHeroText from "../components/LandingPage/HomeHeroText";
import HomeBottomText from "../components/LandingPage/HomeBottomText";
import { MenuButton } from "../components/LandingPage/MenuButton";
import { EditorialScrollCard } from "../components/LandingPage/EditorialScrollCard";
import { FullscreenMenu } from "../components/LandingPage/FullscreenMenu";
import { LandingPageCardsAndFooter } from "../components/LandingPage/LandingPageCardsAndFooter";

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative w-full min-h-screen bg-black overflow-x-hidden">
      {/* ── Fullscreen Editorial Menu ──────────────────────── */}
      <FullscreenMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* ── Menu Button ────────────────────────────────────── */}
      <MenuButton onClick={() => setMenuOpen(true)} />

      {/* ── First Viewport & First Chapter Video Section ───── */}
      {/* Container holds video and the 95vw white scroll takeover card.
          Once user scrolls past this sequence, the entire section scrolls up
          and out of the viewport, transitioning into clean #ffffff bg. */}
      <div className="relative w-full z-10">
        {/* Sticky/Fixed Video Background within the hero section */}
        <div className="sticky top-0 h-screen w-full -mb-[100vh] z-0 overflow-hidden">
          <Video />
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        </div>

        {/* Cinematic Hero Screen */}
        <div className="relative z-10 h-screen w-full flex flex-col justify-around">
          <HomeHeroText />
          <HomeBottomText />
        </div>

        {/* 95vw White Editorial Card Pinned Scroll Sequence */}
        <div className="relative z-20">
          <EditorialScrollCard />
        </div>
      </div>

      {/* ── Second Stage: White BG Transition with 3 Stacking Cards & Converto Footer */}
      <div className="relative z-30 bg-[#ffffff] text-black">
        <LandingPageCardsAndFooter />
      </div>
    </div>
  );
};

export default LandingPage;