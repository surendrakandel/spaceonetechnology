<script lang="ts">
	import { StatusBadge } from '@usecase-ui/svelte';
	import { statusLabel, type Status } from '$lib/types';
	let { status }: { status: Status } = $props();
	let tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' = $derived(
		status === 'offer'
			? 'success'
			: status === 'rejected'
				? 'danger'
				: status === 'processing'
					? 'warning'
					: ['applied', 'interview'].includes(status)
						? 'info'
						: 'neutral'
	);
</script>

<StatusBadge label={statusLabel[status]} {tone} />
