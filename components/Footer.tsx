import Image from "next/image";
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="w-full mx-auto px-4 sm:px-6 py-3 flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500">
        <Image
          src="/logoOnly.png"
          alt="Save the plate"
          width={20}
          height={20}
          className="object-contain"
        />
        <span className="font-medium text-gray-700">
          Save the plate
        </span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-400">
          © {currentYear}
        </span>
      </div>
    </footer>
  );
};

export default Footer;
