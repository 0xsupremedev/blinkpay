import { useEffect, useState } from "react";
import { connection } from "../lib/solana";

export function usePaymentStatus(programId: string, receipt: string | null) {
	const [status, setStatus] = useState<"idle"|"pending"|"confirmed"|"error">("idle");
	const [signature, setSignature] = useState<string | null>(null);

	useEffect(() => {
		if (!programId || !receipt) return;
		setStatus("pending");
		const sub = connection.onLogs(programId, (logs) => {
			if (logs.logs?.some((l) => l.includes("PaymentCompleted")) && logs.logs?.some((l) => l.includes(receipt))) {
				setStatus("confirmed");
				setSignature(logs.signature);
			}
		}, "confirmed");
		return () => {
			connection.removeOnLogsListener(sub);
		};
	}, [programId, receipt]);

	return { status, signature };
}
