"use client";

import { useScrollY } from "@/hooks/useScrollY";
import { remap } from "@/utils/remap";
import { useEffect, useState } from "react";
import NavBtn from "./NavBtn";

const Navbar = () => {
  const [opacity, setOpacity] = useState(0);
  const scrollY = useScrollY();
  const mapped = remap(
    scrollY,
    window.innerHeight * 0.8,
    window.innerHeight * 1.2,
    0,
    1
  );

  useEffect(() => {
    setOpacity(mapped);
  }, [mapped]);

  return (
    <div
      style={{ marginTop: window.innerHeight - 64 }}
      className={
        "bg-zinc-800/60 h-16 flex items-center justify-center sticky top-0 backdrop-blur-md px-5 z-10"
      }
    >
      <div className="container h-full flex items-center uppercase">
        <h1 id="title" className={`text-zinc-300 font-extrabold text-3xl`}>
          Meanders
        </h1>
      </div>
      <div
        style={{ opacity }}
        className=" gap-10 h-full justify-center items-center hidden md:flex"
      >
        <NavBtn title="Projects" link="" />
        <NavBtn title="products" link="" />
        <NavBtn title="srvices" link="" />
        <NavBtn title="contact" link="" />
      </div>
    </div>
  );
};

export default Navbar;
