import { useState } from "react";

type Props = { label: string; url?: string; onClick?: () => Promise<{ url: string; qr?: string } | void> };

export default function BlinkButton({ label, url, onClick }: Props) {
	const [loading, setLoading] = useState(false);
	const [blinkUrl, setBlinkUrl] = useState<string | undefined>(url);
	const [qr, setQr] = useState<string | undefined>();

	async function handleClick() {
		setLoading(true);
		try {
			if (onClick) {
				const res = (await onClick()) as any;
				if (res?.url) {
					setBlinkUrl(res.url);
					setQr(res.qr);
					window.open(res.url, "_blank");
				}
			} else if (blinkUrl) {
				window.open(blinkUrl, "_blank");
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex flex-col items-center gap-2">
			<button onClick={handleClick} disabled={loading} className="px-4 py-2 rounded bg-black text-white hover:opacity-90 disabled:opacity-60">
				{loading ? "Loading..." : label}
			</button>
			{qr && <img src={qr} alt="blink qr" className="w-40 h-40" />}
		</div>
	);
}
