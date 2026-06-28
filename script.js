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

	const readComments = () => {
		try {
			return JSON.parse(localStorage.getItem(storageKey) || '[]');
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
				(entry) => `
					<article class="comment-card">
						<div class="comment-header">
							<span>${entry.name}</span>
							<span>${entry.date}</span>
						</div>
						<p class="comment-reaction">${entry.reaction}</p>
						<p>${entry.comment}</p>
					</article>
				`
			)
			.join('');
	};

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
