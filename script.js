const GA_MEASUREMENT_ID = 'G-4YFKX3VH3H';
const LOOKER_STUDIO_EMBED_URL = '';

const isValidGaMeasurementId = (id) => {
	return /^G-[A-Z0-9]{6,12}$/.test(id) && id !== 'G-XXXXXXXXXX';
};

const initializeGoogleAnalytics = () => {
	const configuredId = (window.SEMICOMM_GA_MEASUREMENT_ID || GA_MEASUREMENT_ID || '').trim();

	if (!isValidGaMeasurementId(configuredId)) {
		return null;
	}

	if (window.gtag) {
		return configuredId;
	}

	window.dataLayer = window.dataLayer || [];
	window.gtag = function gtag() {
		window.dataLayer.push(arguments);
	};

	window.gtag('js', new Date());
	window.gtag('config', configuredId, {
		anonymize_ip: true,
		send_page_view: true
	});

	const gaScript = document.createElement('script');
	gaScript.async = true;
	gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${configuredId}`;
	document.head.appendChild(gaScript);

	return configuredId;
};

const initializeAnalyticsPage = (gaId) => {
	const analyticsPage = document.querySelector('[data-analytics-page]');

	if (!analyticsPage) {
		return;
	}

	const gaStatus = document.querySelector('[data-ga-status]');
	const dashboardFrame = document.querySelector('[data-analytics-frame]');
	const dashboardPlaceholder = document.querySelector('[data-analytics-placeholder]');

	if (gaStatus) {
		if (gaId) {
			gaStatus.textContent = `GA4 status: connected (${gaId})`;
		} else {
			gaStatus.textContent = 'GA4 status: not configured yet (set GA_MEASUREMENT_ID in script.js).';
		}
	}

	if (!dashboardFrame || !dashboardPlaceholder) {
		return;
	}

	const configuredUrl = (window.SEMICOMM_LOOKER_STUDIO_EMBED_URL || LOOKER_STUDIO_EMBED_URL || '').trim();
	const isLookerEmbed = configuredUrl.startsWith('https://lookerstudio.google.com/embed/reporting/');

	if (!isLookerEmbed) {
		dashboardPlaceholder.hidden = false;
		dashboardFrame.hidden = true;
		return;
	}

	dashboardFrame.src = configuredUrl;
	dashboardFrame.hidden = false;
	dashboardPlaceholder.hidden = true;
};

const activeGaMeasurementId = initializeGoogleAnalytics();
initializeAnalyticsPage(activeGaMeasurementId);

const yearElement = document.getElementById('year');

if (yearElement) {
	yearElement.textContent = new Date().getFullYear();
}

const commentForms = document.querySelectorAll('[data-comment-form]');

commentForms.forEach((form) => {
	const list = form.parentElement.querySelector('[data-comment-list]');

	if (!list) {
		return;
	}

	const storageKey = `semicomm-comments:${window.location.pathname}`;
	const viewerKey = 'semicomm-comment-owner';

	const getViewerId = () => {
		const existingViewerId = localStorage.getItem(viewerKey);

		if (existingViewerId) {
			return existingViewerId;
		}

		const generatedViewerId = `viewer-${Date.now()}-${Math.random().toString(16).slice(2)}`;
		localStorage.setItem(viewerKey, generatedViewerId);
		return generatedViewerId;
	};

	const viewerId = getViewerId();

	const readComments = () => {
		try {
			const storedComments = JSON.parse(localStorage.getItem(storageKey) || '[]');
			let didMutate = false;
			const normalizedComments = storedComments.map((entry) => {
				if (entry.ownerId && entry.id) {
					return entry;
				}

				didMutate = true;
				return {
					...entry,
					id: entry.id || `comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
					ownerId: entry.ownerId || viewerId
				};
			});

			if (didMutate) {
				localStorage.setItem(storageKey, JSON.stringify(normalizedComments));
			}

			return normalizedComments;
		} catch {
			return [];
		}
	};

	const writeComments = (comments) => {
		localStorage.setItem(storageKey, JSON.stringify(comments));
	};

	const renderComments = () => {
		const comments = readComments();

		if (!comments.length) {
			list.innerHTML = '<p class="comment-empty">No comments yet. Start the discussion.</p>';
			return;
		}

		list.innerHTML = comments
			.map(
				(entry, index) => `
					<article class="comment-card">
						<div class="comment-header">
							<div class="comment-meta">
								<span>${entry.name}</span>
								<span>${entry.date}</span>
							</div>
							${entry.ownerId === viewerId ? `<button class="comment-delete" type="button" data-comment-delete="${index}">Delete</button>` : ''}
						</div>
						<p class="comment-reaction">${entry.reaction}</p>
						<p>${entry.comment}</p>
					</article>
				`
			)
			.join('');
	};

	list.addEventListener('click', (event) => {
		const deleteButton = event.target.closest('[data-comment-delete]');

		if (!deleteButton) {
			return;
		}

		const commentIndex = Number(deleteButton.dataset.commentDelete);
		const comments = readComments();

		if (Number.isNaN(commentIndex) || commentIndex < 0 || commentIndex >= comments.length) {
			return;
		}

		comments.splice(commentIndex, 1);
		writeComments(comments);
		renderComments();
	});

	form.addEventListener('submit', (event) => {
		event.preventDefault();

		const formData = new FormData(form);
		const name = (formData.get('name') || '').toString().trim() || 'Anonymous';
		const reaction = (formData.get('reaction') || 'Insightful').toString().trim();
		const comment = (formData.get('comment') || '').toString().trim();

		if (!comment) {
			return;
		}

		const comments = readComments();
		comments.unshift({
			id: `comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
			ownerId: viewerId,
			name,
			reaction,
			comment,
			date: new Date().toLocaleDateString('en-GB', {
				day: '2-digit',
				month: 'short',
				year: 'numeric'
			})
		});

		writeComments(comments);
		form.reset();
		renderComments();
	});

	renderComments();
});
