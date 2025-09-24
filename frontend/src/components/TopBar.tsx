import ThemeToggle from "./ThemeToggle";
import { FiBell } from "react-icons/fi";

export default function TopBar() {
	return (
		<header className="w-full mb-4">
			<div className="container-card flex items-center gap-4">
				<div className="font-bold text-lg">BlinkPay</div>
				<div className="ml-auto flex items-center gap-3 text-sm">
					<span className="hidden sm:flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Wallet Connected</span>
					<span className="hidden sm:flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Active Blink Session</span>
					<button className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100" aria-label="Notifications"><FiBell /></button>
					<ThemeToggle />
					<div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600" />
				</div>
			</div>
		</header>
	);
}
