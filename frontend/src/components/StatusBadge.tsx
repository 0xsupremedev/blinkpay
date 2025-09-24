type Props = { status: "success" | "failed" | string };
export default function StatusBadge({ status }: Props) {
	const ok = String(status).toLowerCase() === "success";
	const cls = ok ? "bg-green-600/20 text-green-300" : "bg-red-600/20 text-red-300";
	return <span className={`px-2 py-0.5 rounded text-xs ${cls}`}>{ok ? "Success" : "Failed"}</span>;
}
