import { ReactNode } from "react";

type Props = { open: boolean; onClose: () => void; title?: string; children: ReactNode };
export default function Modal({ open, onClose, title, children }: Props) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />
			<div className="relative w-full max-w-2xl mx-4">
				<div className="container-card">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-semibold">{title}</h2>
						<button onClick={onClose} className="btn-secondary">✕</button>
					</div>
					{children}
				</div>
			</div>
		</div>
	);
}
