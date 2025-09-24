import { ReactNode } from "react";

type Props = { children: ReactNode; className?: string };
export default function Card({ children, className = "" }: Props) {
	return <div className={`container-card ${className}`}>{children}</div>;
}
