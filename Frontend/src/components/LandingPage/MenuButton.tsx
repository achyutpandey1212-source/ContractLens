import { Menu } from "lucide-react";

interface MenuButtonProps {
  onClick: () => void;
}

export const MenuButton: React.FC<MenuButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-6 right-6 z-50 w-[20vw] h-[8vh] min-w-[60px] min-h-[48px] max-w-[120px] max-h-[80px] bg-[#000] rounded-lg flex items-center justify-center transition-colors hover:bg-[#111] focus:outline-none focus:ring-2 focus:ring-[#D3FD50] focus:ring-offset-2 focus:ring-offset-[#000]"
      aria-label="Open menu"
    >
      <Menu className="w-8 h-8 text-[#fff]" strokeWidth={2.5} />
    </button>
  );
};