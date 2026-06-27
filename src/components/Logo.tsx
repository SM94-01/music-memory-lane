import logoAsset from "@/assets/trax-logo.png.asset.json";

export function Logo({ className = "h-7 w-auto" }: { className?: string }) {
  return <img src={logoAsset.url} alt="TraX" className={className} draggable={false} />;
}
