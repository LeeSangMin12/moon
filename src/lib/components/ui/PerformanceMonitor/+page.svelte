<script>
	import { onMount } from 'svelte';

	let performanceData = $state({
		lcp: 0,
		fid: 0,
		cls: 0,
		ttfb: 0,
	});

	onMount(() => {
		// Monitor LCP (Largest Contentful Paint)
		if ('PerformanceObserver' in window) {
			const lcpObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const lastEntry = entries[entries.length - 1];
				performanceData.lcp = lastEntry.startTime;

				// Log LCP for debugging
				console.log('LCP:', performanceData.lcp, 'ms');
			});
			lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

			// Monitor FID (First Input Delay)
			const fidObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				performanceData.fid = entries[0].processingStart - entries[0].startTime;
				console.log('FID:', performanceData.fid, 'ms');
			});
			fidObserver.observe({ entryTypes: ['first-input'] });

			// Monitor CLS (Cumulative Layout Shift)
			const clsObserver = new PerformanceObserver((list) => {
				let clsValue = 0;
				for (const entry of list.getEntries()) {
					if (!entry.hadRecentInput) {
						clsValue += entry.value;
					}
				}
				performanceData.cls = clsValue;
				console.log('CLS:', performanceData.cls);
			});
			clsObserver.observe({ entryTypes: ['layout-shift'] });
		}

		// Get TTFB (Time to First Byte)
		const navigationEntry = performance.getEntriesByType('navigation')[0];
		if (navigationEntry) {
			performanceData.ttfb =
				navigationEntry.responseStart - navigationEntry.requestStart;
			console.log('TTFB:', performanceData.ttfb, 'ms');
		}
	});
</script>

<!-- This component is invisible but monitors performance -->
<div style="display: none;">Performance Monitor Active</div>
