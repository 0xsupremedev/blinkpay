import Image from "next/image";

export default function USDCLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`${className} rounded-full overflow-hidden shadow-lg`}>
      <Image
        src="/usdc-logo.png"
        alt="USDC Logo"
        width={48}
        height={48}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
