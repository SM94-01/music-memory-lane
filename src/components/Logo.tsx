import logo from "@/assets/trax-logo.png";

export function Logo({ className = "h-10 w-auto" }) {
  return <img src={logo} alt="TraX" className={className} draggable={false} />;
}