type Props = { title: string; value: string; sub?: string };
export default function StatCard({ title, value, sub }: Props) {
	return (
		<div className="container-card">
			<div className="text-slate-500 text-sm">{title}</div>
			<div className="text-2xl font-bold">{value}</div>
			{sub && <div className="text-slate-400 text-xs mt-1">{sub}</div>}
		</div>
	);
}
