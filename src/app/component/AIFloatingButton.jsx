import Link from "next/link";
import { Cpu } from "lucide-react"; // Lucide AI/CPU icon

const AIFloatingButton = () => {
  return (
    <Link
      href="/ai"
      className="group fixed bottom-24 right-4 z-[1000] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#263a2d] text-white shadow-2xl shadow-black/30 ring-1 ring-[#d2ba7d]/24 transition hover:bg-[#101b15] md:bottom-5 md:right-5"
    >
      {/* Tooltip — right side */}
      <span className="invisible absolute right-[115%] top-1/2 w-28 -translate-y-1/2 rounded-md bg-[#263a2d] py-1 text-center text-sm text-white opacity-0 shadow-xl transition-opacity duration-300 group-hover:visible group-hover:opacity-100">
        Ask AI
      </span>

      {/* AI Icon */}
      <Cpu className="w-6 h-6" />
    </Link>
  );
};

export default AIFloatingButton;
