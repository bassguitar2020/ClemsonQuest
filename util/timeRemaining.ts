export const timeRemaining = (expiresAt: any) => {
	if (!expiresAt) {
		// No deadline set
		return 'No deadline';
	}

	// Support Firestore Timestamp, Date, or raw value
	const exp: Date =
		typeof expiresAt?.toDate === 'function'
			? expiresAt.toDate()
			: expiresAt instanceof Date
				? expiresAt
				: new Date(expiresAt);

	if (isNaN(exp.getTime())) {
		// Something weird in the data – don’t crash the app
		return 'No deadline';
	}

	const diffMs = exp.getTime() - Date.now();
	if (diffMs <= 0) return 'Expired';

	const hours = Math.floor(diffMs / (1000 * 60 * 60));
	const mins = Math.floor((diffMs / (1000 * 60)) % 60);

	if (hours <= 0) return `${mins} min left`;
	return `${hours}h ${mins}m left`;
};


