import Link from "next/link";

const NavBtn = ({ title, link }) => {
  return (
    <Link
      className=" text-zinc-300 text-sm uppercase cursor-pointer"
      href={link}
    >
      {title}
    </Link>
  );
};

export default NavBtn;
