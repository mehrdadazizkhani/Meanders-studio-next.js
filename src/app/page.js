import Navbar from "@/components/layouts/navbar/Navbar";
import SlimeMold from "@/components/sections/slimeMold/SlimeMold";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <Navbar />
      <div className="bg-zinc-300 absolute w-full top-0">
        <div className="w-full h-screen ">
          <SlimeMold />
        </div>
        <div className="w-full h-screen bg-amber-700">
          <img
            src="https://www.apple.com/v/iphone-16-pro/a/images/overview/welcome/hero_endframe__b3cjfkquc2s2_large.jpg"
            alt=""
            className="w-full h-full"
          />
        </div>
        <div className="w-full h-screen bg-amber-700"></div>
      </div>
    </div>
  );
}
