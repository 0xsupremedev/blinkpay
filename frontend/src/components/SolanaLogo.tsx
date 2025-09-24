import Image from "next/image";

export default function SolanaLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`${className} rounded-full overflow-hidden shadow-lg`}>
      <Image
        src="/solana-logo.png"
        alt="Solana Logo"
        width={48}
        height={48}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
