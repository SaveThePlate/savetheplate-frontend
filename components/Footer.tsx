import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-200 bg-white/80 backdrop-blur-sm hidden lg:block">
      <div className="w-full mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-gray-500">
        <div className="inline-flex items-center">
          <Image
            src="/logoOnly.png"
            alt="Save The Plate"
            width={20}
            height={20}
            className="object-contain"
          />
        </div>
        <span className="inline-flex items-center font-medium text-gray-700">
          Save The Plate
        </span>
        <span className="inline-flex items-center text-gray-400">·</span>
        <span className="inline-flex items-center text-gray-400">
          © {currentYear}
        </span>
        <span className="inline-flex items-center text-gray-400">·</span>
        <Link
          href="/privacy"
          className="inline-flex items-center text-gray-500 hover:text-emerald-600 transition-colors text-xs sm:text-sm"
        >
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
