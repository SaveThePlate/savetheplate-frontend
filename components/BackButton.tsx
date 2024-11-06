"use client";
import { useRouter } from "next/navigation";

const BackButton = () => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="absolute top-4 left-4 p-2 bg-gray-200 rounded-md shadow hover:bg-gray-300 transition"
    >
      <span> &lt;  </span>
    </button>
  );
};

export default BackButton;
