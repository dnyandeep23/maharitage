import Link from "next/link";
import { Cpu } from "lucide-react"; // Lucide AI/CPU icon

const AIFloatingButton = () => {
  return (
    <Link
      href="/ai"
      className="fixed bottom-5 right-5 bg-gradient-to-br shadow-2xl shadow-black from-green-800 to-green-950 text-white rounded-full w-14 h-14 flex justify-center items-center text-md cursor-pointer z-[1000] group"
    >
      {/* Tooltip — right side */}
      <span className="absolute right-[115%] top-1/2 -translate-y-1/2 w-28 bg-green-700 text-white text-center rounded-md py-1 text-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300">
        Ask AI
      </span>

      {/* AI Icon */}
      <Cpu className="w-6 h-6" />
    </Link>
  );
};

export default AIFloatingButton;
