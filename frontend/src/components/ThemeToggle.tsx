import { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

export default function ThemeToggle() {
	const [dark, setDark] = useState(true);
	useEffect(() => {
		const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
		const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
		const isDark = saved ? saved === "dark" : prefersDark;
		setDark(isDark);
		document.documentElement.classList.toggle("dark", isDark);
	}, []);
	function toggle() {
		const next = !dark;
		setDark(next);
		document.documentElement.classList.toggle("dark", next);
		localStorage.setItem("theme", next ? "dark" : "light");
	}
	return (
		<button onClick={toggle} aria-label="Toggle theme" className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100">
			{dark ? <FiSun /> : <FiMoon />}
		</button>
	);
}
