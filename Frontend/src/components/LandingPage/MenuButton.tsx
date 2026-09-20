interface MenuButtonProps {
  onClick?: () => void;
}

export const MenuButton: React.FC<MenuButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-0 right-0 z-50 w-[28vw] min-w-[140px] max-w-[240px] h-[48px] md:h-[52px] bg-[#fff] border-b border-l border-black flex flex-col justify-center items-end pr-7 md:pr-8 gap-1.5 cursor-pointer rounded-none transition-colors duration-200 hover:bg-[#D3FD50] focus:outline-none group"
      aria-label="Open menu"
    >
      <span className="w-12 h-[2px] bg-black block transition-all duration-200" />
      <span className="w-6 h-[2px] bg-black block transition-all duration-200 group-hover:w-12" />
    </button>
  );
};