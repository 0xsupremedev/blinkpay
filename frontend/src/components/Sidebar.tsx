import Link from "next/link";
import { useRouter } from "next/router";
import { FiHome, FiCreditCard, FiUsers, FiTrendingUp, FiSettings } from "react-icons/fi";

const items = [
	{ href: "/dashboard", label: "Dashboard", icon: FiHome },
	{ href: "/pay", label: "Payments", icon: FiCreditCard },
	{ href: "/merchant/demo", label: "Merchants", icon: FiUsers },
	{ href: "/dashboard#transactions", label: "Transactions", icon: FiTrendingUp },
	{ href: "/dashboard#settings", label: "Settings", icon: FiSettings },
];

export default function Sidebar() {
	const router = useRouter();
	return (
		<aside className="w-56 flex-shrink-0 p-4">
			<div className="container-card">
				<nav className="flex flex-col gap-1">
					{items.map(it => {
						const active = router.pathname === it.href;
						const Icon = it.icon;
						return (
							<Link key={it.href} href={it.href} className={`px-3 py-2 rounded-lg flex items-center gap-2 ${active ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
								<Icon className="shrink-0" />
								<span>{it.label}</span>
							</Link>
						);
					})}
				</nav>
			</div>
		</aside>
	);
}
