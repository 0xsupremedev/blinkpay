type Props = { dataUrl?: string };
export default function QRCodeDisplay({ dataUrl }: Props) {
	if (!dataUrl) return null;
	return <img src={dataUrl} alt="qr" className="w-48 h-48" />;
}
