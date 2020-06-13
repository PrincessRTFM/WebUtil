/* eslint-disable max-len */
// ==UserScript==
// @name         Homestuck Keyboard Navigation
// @namespace    Lilith
// @version      2.0.0
// @description  Provides key controls for easier reading. Q scrolls up, E scrolls down, A goes back, D goes forward, W scrolls to the first panel and hides any *log present, S shows the log and scrolls to it
// @author       PrincessRTFM
// @match        https://www.homestuck.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==
/* eslint-enable max-len */

(window => {
	const BLOOD_TEAL = '#008282';
	const BLOOD_LIME = '#658200';
	// const BLOOD_VIOLET = '#6a006a';
	const BLOOD_JADE = '#008282';
	const scrollWindow = offset => {
		console.log(`Scrolling window by ${offset}`);
		window.scrollBy({
			top: offset,
			behavior: 'smooth',
		});
	};
	const scrollDown = () => {
		scrollWindow(window.innerHeight * 0.8);
	};
	const scrollUp = () => {
		scrollWindow(-(window.innerHeight * 0.8));
	};
	const scrollToShow = elem => {
		elem.scrollIntoView({
			behavior: 'smooth',
		});
	};
	const core = () => {
		const next = document.querySelector('.o_story-nav a[href]');
		const prev = document.querySelector(
			'#story_footer_container > div > ul.o_game-nav > li > a:not(#o_start-over)'
		);
		const head = document.querySelector('#content_container > h2');
		const comic = document.querySelectorAll(
			'#content_container embed, #content_container img, #content_container iframe'
		);
		const chat = document.querySelector('.o_chat-log');
		if (!(head && comic.length)) {
			console.warn("Can't find header and comics! Retrying in 500ms...");
			setTimeout(core, 500);
			return;
		}
		const toggleHeader = document.createElement('p');
		const showChat = () => {
			if (chat) {
				chat.style.display = 'block';
				scrollToShow(toggleHeader);
			}
		};
		const hideChat = () => {
			if (chat) {
				chat.style.display = 'none';
			}
		};
		const toggleChat = () => {
			if (chat) {
				if ((chat.style.display || chat.computedStyleMap().get('display').value) == 'none') {
					showChat();
				}
				else {
					hideChat();
				}
			}
		};
		if (chat) {
			const vanillaLogToggle = chat.parentElement.querySelector('button');
			vanillaLogToggle.style.display = 'none';
			toggleHeader.title = "Press S to show, W to hide";
			toggleHeader.textContent = vanillaLogToggle.textContent.slice(5);
			toggleHeader.style.cursor = "pointer";
			toggleHeader.style.textDecoration = "underline";
			toggleHeader.style.color = "blue";
			toggleHeader.addEventListener('click', toggleChat);
			chat.insertAdjacentElement('beforebegin', toggleHeader);
		}
		const onKeyDown = evt => {
			const key = String(evt.key || '').toLowerCase();
			let link;
			switch (key) {
				case 'w':
					console.groupCollapsed("Scrolling up");
					scrollUp();
					console.groupEnd();
					break;
				case 'q':
					scrollToShow(head);
					hideChat();
					break;
				case 's':
					console.groupCollapsed("Scrolling down");
					scrollDown();
					console.groupEnd();
					break;
				case 'a':
					link = prev;
					break;
				case 'e':
					showChat();
					break;
				case 'd':
					link = next;
					break;
				default:
					return;
			}
			if (link && link.href) {
				link.style.color = BLOOD_LIME;
				window.location = link.href;
			}
		};
		document.addEventListener('keydown', onKeyDown);
		console.log("Scrolling page to header");
		scrollToShow(head);
		head.style.color = BLOOD_TEAL; // Teal blood for scratch pages, violet blood for normal ones
		if (next.href) {
			next.style.color = BLOOD_JADE;
		}
		document.title = head.textContent;
	};
	setTimeout(core, 250);
})(window);

