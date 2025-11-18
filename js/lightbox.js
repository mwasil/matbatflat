(() => {
	const SEL = '#below-content-container';
	const MIN = 500;

	const onReady = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());

	const waitNaturalSize = (img) => new Promise((res) => {
		if (img.complete && img.naturalWidth) return res(img);
		img.addEventListener('load', () => res(img), { once: true });
		img.addEventListener('error', () => res(img), { once: true });
	});

	function injectStyles() {
		if (document.getElementById('mlb-styles')) return;
		const css = `
			.mlb-overlay {
				position: fixed; inset: 0; background: rgba(0,0,0,0.9);
				display: flex; align-items: center; justify-content: center;
				z-index: 9999; cursor: zoom-out;
			}
			.mlb-hidden { display: none !important; }
			.mlb-img {
				max-width: 95vw; max-height: 90vh;
				box-shadow: 0 10px 40px rgba(0,0,0,.6);
				cursor: default;
			}
			.mlb-caption {
				position: fixed; left: 50%; bottom: 24px;
				transform: translateX(-50%);
				color: #fff; background: rgba(0,0,0,.5);
				padding: 6px 10px; border-radius: 6px;
				font: 14px/1.2 system-ui;
			}
			.mlb-btn {
				position: fixed; top: 50%; transform: translateY(-50%);
				font: 700 22px/1 system-ui; color: #fff;
				background: rgba(0,0,0,.45); border: none;
				padding: 10px 14px; border-radius: 10px;
				cursor: pointer; user-select: none;
			}
			.mlb-prev { left: 20px; }
			.mlb-next { right: 20px; }
			.mlb-close {
				position: fixed; top: 20px; right: 20px;
				font: 700 20px/1 system-ui; color: #fff;
				background: rgba(0,0,0,.45);
				border: none; padding: 8px 12px;
				border-radius: 10px; cursor: pointer;
			}
			body.mlb-noscroll { overflow: hidden; }
		`;
		const style = document.createElement('style');
		style.id = 'mlb-styles';
		style.textContent = css;
		document.head.appendChild(style);
	}

	function createLightbox() {
		injectStyles();
		const overlay = document.createElement('div');
		overlay.className = 'mlb-overlay mlb-hidden';
		overlay.tabIndex = 0;

		const img = document.createElement('img');
		img.className = 'mlb-img';
		const cap = document.createElement('div');
		cap.className = 'mlb-caption';
		const btnPrev = Object.assign(document.createElement('button'), { className: 'mlb-btn mlb-prev', textContent: '‹' });
		const btnNext = Object.assign(document.createElement('button'), { className: 'mlb-btn mlb-next', textContent: '›' });
		const btnClose = Object.assign(document.createElement('button'), { className: 'mlb-close', textContent: '✕' });

		overlay.append(img, cap, btnPrev, btnNext, btnClose);
		document.body.appendChild(overlay);
		return { overlay, img, cap, btnPrev, btnNext, btnClose };
	}

	onReady(async () => {
		const container = document.querySelector(SEL);
		if (!container) return;

		const imgs = Array.from(container.querySelectorAll('img'));
		if (!imgs.length) return;
		await Promise.all(imgs.map(waitNaturalSize));

		const gallery = imgs
			.filter((i) => (i.naturalWidth || 0) > MIN || (i.naturalHeight || 0) > MIN)
			.map((i) => ({ src: i.currentSrc || i.src, alt: i.alt || '', el: i }));

		if (!gallery.length) return;

		const ui = createLightbox();
		let idx = 0;

		function show(i) {
			idx = (i + gallery.length) % gallery.length;
			const g = gallery[idx];
			ui.img.src = g.src;
			ui.cap.textContent = g.alt || '';
			ui.overlay.classList.remove('mlb-hidden');
			document.body.classList.add('mlb-noscroll');
		}

		function close() {
			ui.overlay.classList.add('mlb-hidden');
			document.body.classList.remove('mlb-noscroll');
			ui.img.src = '';
		}

		gallery.forEach((g, i) => {
			g.el.style.cursor = 'zoom-in';
			g.el.addEventListener('click', (e) => {
				e.preventDefault();
				show(i);
			});
		});

		ui.overlay.addEventListener('click', (e) => {
			if (e.target === ui.overlay) close();
		});
		ui.btnPrev.addEventListener('click', (e) => { e.stopPropagation(); show(idx - 1); });
		ui.btnNext.addEventListener('click', (e) => { e.stopPropagation(); show(idx + 1); });
		ui.btnClose.addEventListener('click', (e) => { e.stopPropagation(); close(); });

		window.addEventListener('keydown', (e) => {
			if (ui.overlay.classList.contains('mlb-hidden')) return;
			if (e.key === 'Escape') close();
			if (e.key === 'ArrowLeft') show(idx - 1);
			if (e.key === 'ArrowRight') show(idx + 1);
		});
	});
})();