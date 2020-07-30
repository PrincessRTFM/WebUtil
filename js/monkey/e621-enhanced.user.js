/* eslint-disable max-len */
// ==UserScript==
// @name         E(nhanced)621
// @namespace    Lilith
// @version      1.6.2
// @description  Provides minor-but-useful enhancements to e621
// @author       PrincessRTFM
// @match        *://e621.net/*
// @updateURL    https://gh.princessrtfm.com/js/monkey/en621.user.js
// @grant        GM_info
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setClipboard
// @grant        unsafeWindow
// ==/UserScript==

/* CHANGELOG
v1.0.0 - initial script, minimal functionality, mostly ripped apart from three old scripts broken in the site update
v1.1.0 - added keybind features; currently only alt-r for random but more can be easily added
v1.2.0 - added an indicator for parent/child posts on post pages
v1.3.0 - added a tag entry for the post rating
v1.3.1 - fixed a missing property access on sanity checking, removed an unnecessary Promise.resolve(), reordered the pool reader sequence
v1.3.2 - clean up some element-contructor code
v1.4.0 - add pool reader progress to tab title
v1.5.0 - make the "current search" text on post pages into a link to that search
v1.6.0 - move searched-for tags on post pages to the top of their tag groups and italicise them
v1.6.1 - searching for tags in the post page tag list is no longer confused by underscores
v1.6.2 - changed script update URL so that users will update to this version and then be redirected to update to the new location
*/
/* eslint-enable max-len */


const SCRIPT_NAME = GM_info.script.name;
const SCRIPT_VERSION = `V${GM_info.script.version || '???'}`;
const SCRIPT_TITLE = `${SCRIPT_NAME} ${SCRIPT_VERSION}`;

const NOP = () => {}; // eslint-disable-line no-empty-function

const debug = console.debug.bind(console, `[${SCRIPT_TITLE}]`);
const log = console.log.bind(console, `[${SCRIPT_TITLE}]`);
const info = console.info.bind(console, `[${SCRIPT_TITLE}]`);
const warn = console.warn.bind(console, `[${SCRIPT_TITLE}]`);
const error = console.error.bind(console, `[${SCRIPT_TITLE}]`);

const KB_NONE = 0;
const KB_ALT = 1;
const KB_CTRL = 2;
const KB_SHIFT = 4;


const pause = delay => new Promise(resolve => setTimeout(resolve.bind(resolve, delay), delay));
const request = (uri, ctx) => {
	const url = new URL(String(uri));
	url.searchParams.append('_client', encodeURIComponent(`${SCRIPT_TITLE} by lsong@princessrtfm.com`));
	return new Promise((resolve, reject) => GM_xmlhttpRequest({
		method: "GET",
		url: url.toString(),
		responseType: 'json',
		onerror: reject,
		onload: resolve,
		ontimeout: reject,
		context: ctx || Object.create(null),
	}));
};

const makeElem = (tag, id, clazz) => {
	const elem = document.createElement(tag);
	if (id) {
		elem.id = id;
	}
	if (clazz) {
		elem.className = clazz; // eslint-disable-line unicorn/no-keyword-prefix
	}
	return elem;
};
const warningBox = () => {
	const ID = 'enhanced621-message-box';
	let box = document.querySelector(`#${ID}`);
	if (box) {
		return box;
	}
	box = makeElem('div', ID, 'status-notice');
	box.style.display = 'none';
	/* eslint-disable sonarjs/no-duplicate-string */
	GM_addStyle([
		`#${ID} {`,
		'position: fixed;',
		'right: 0;',
		`top: ${document.querySelector("#image-container").offsetTop}px;`,
		'border-top-right-radius: 0;',
		'border-bottom-right-radius: 0;',
		'width: 350px;',
		'z-index: 9999;',
		'}',
		`#${ID} > .enhanced621-message {`,
		'display: block;',
		'margin: 4px;',
		'padding: 3px;',
		'}',
		'.enhanced621-message-dismiss {',
		'cursor: pointer;',
		'margin-right: 4px;',
		'color: #999999;',
		'font-size: 17px;',
		'position: relative;',
		'top: 2px;',
		'}',
		'.enhanced621-message-icon {',
		'cursor: default;',
		'margin-left: 3px;',
		'margin-right: 2px;',
		'font-size: 16px;',
		'position: relative;',
		'top: 1px;',
		'}',
		'.enhanced621-message-icon.enhanced621-message-error {',
		'color: #EE0000;',
		'}',
		'.enhanced621-message-icon.enhanced621-message-warning {',
		'color: #EEEE00;',
		'}',
		'.enhanced621-message-icon.enhanced621-message-help {',
		'color: #00EE44;',
		'}',
		'.enhanced621-message-content {',
		'cursor: default;',
		'margin-left: 2px;',
		'font-size: 16px;',
		'}',
	].join(''));
	/* eslint-enable sonarjs/no-duplicate-string */
	document.body.append(box);
	return box;
};
const putMessage = (content, type, icon) => {
	const master = warningBox();
	const messageContainer = makeElem('div', '', `enhanced621-message enhanced621-message-${type}`);
	const messageText = makeElem('span', '', `enhanced621-message-content enhanced621-message-${type}`);
	const messageClose = makeElem('span', '', `enhanced621-message-dismiss enhanced621-message-${type}`);
	const messageIcon = makeElem('span', '', `enhanced621-message-icon enhanced621-message-${type}`);
	messageText.innerHTML = content;
	messageClose.textContent = '✖';
	messageIcon.textContent = icon;
	messageContainer.append(messageClose, messageIcon, messageText);
	messageClose.addEventListener('click', () => {
		messageContainer.remove();
		if (!master.children.length) {
			master.style.display = 'none';
		}
	});
	master.append(messageContainer);
	master.style.display = 'block';
};
const putError = content => putMessage(content, 'error', '⚠');
const putWarning = content => putMessage(content, 'warning', '⚠');
const putHelp = content => putMessage(content, 'help', '🛈');

const KEY_HANDLERS = new Map();
const registerKeybind = (keys, handler) => {
	let modifiers = KB_NONE;
	KEYSTRING: for (let key of keys.split(/\s+/u)) {
		while (key.length > 1) {
			const modifier = key.slice(0, 1);
			key = key.slice(1);
			if (modifier == '^') {
				modifiers |= KB_CTRL;
			}
			else if (modifier == '!') {
				modifiers |= KB_ALT;
			}
			else if (modifier == '+') {
				modifiers |= KB_SHIFT;
			}
			else {
				console.error(`Unknown modifier "${modifier}" in keystring, skipping`);
				continue KEYSTRING;
			}
		}
		if (key != key.toLowerCase()) {
			modifiers |= KB_SHIFT;
			key = key.toLowerCase();
		}
		const keymap = KEY_HANDLERS.get(key) || [];
		keymap[modifiers] = handler;
		KEY_HANDLERS.set(key, keymap);
		const pretty = (modifiers & KB_CTRL ? 'ctrl-' : '')
			+ (modifiers & KB_ALT ? 'alt-' : '')
			+ (modifiers & KB_SHIFT ? 'shift-' : '')
			+ key;
		console.log(`Registered keybind handler for ${pretty}`);
	}
};
document.addEventListener('keydown', evt => {
	// eslint-disable-next-line array-bracket-newline, array-element-newline
	if (evt.target.isContentEditable || [ 'input', 'textarea' ].includes(evt.target.tagName.toLowerCase())) {
		// The user is typing into some kind of input area - don't interfere
		return;
	}
	if (event.isComposing || event.keyCode === 229) {
		// This is part of an IME composition - don't interfere
		return;
	}
	const key = (evt.key || '').toLowerCase();
	const alt = evt.altKey;
	const ctrl = evt.ctrlKey;
	const shift = evt.shiftKey;
	const modifiers = (alt ? KB_ALT : KB_NONE)
		| (ctrl ? KB_CTRL : KB_NONE)
		| (shift ? KB_SHIFT : KB_NONE);
	const handlerMap = KEY_HANDLERS.get(key) || [];
	const handler = handlerMap[modifiers];
	if (typeof handler == 'function') {
		const handled = handler(evt, key, modifiers);
		if (handled === false) { // If you don't return a value, it'll assume you handled things fine
			evt.preventDefault();
			evt.stopPropagation();
		}
	}
});

const CURRENT_SEARCH = (() => {
	const p = new URLSearchParams(location.search);
	return void 0
		|| p.get('q')
		|| p.get('tags')
		|| p.get('name')
		|| '';
})();

const navbar = document.querySelector("#nav").children[0];
const subnavbar = document.querySelector("#nav").children[1];

const POOL_PATH_PREFIX = '/pools/';
const POST_PATH_PREFIX = '/posts/';

const POOL_FRAG_READER = 'reader-mode';

const POOL_READER_CONTAINER_ID = 'pool-reader';
const POOL_READER_STATUSLINE_ID = 'enhanced621-pool-reader-status';

const enablePoolReaderMode = async () => {
	location.hash = POOL_FRAG_READER;
	const vanillaPageList = document.querySelector("div#posts");
	let readerPageContainer = document.querySelector(`div#${POOL_READER_CONTAINER_ID}`);
	if (!vanillaPageList) {
		throw new Error("No post container found");
	}
	if (readerPageContainer) {
		vanillaPageList.style.display = 'none';
		readerPageContainer.style.display = '';
		document.querySelector(`#${POOL_READER_STATUSLINE_ID}`).style.display = '';
		return readerPageContainer;
	}
	GM_addStyle([
		`div#${POOL_READER_CONTAINER_ID} > a {`,
		'display: block;',
		'margin: 20px auto;',
		'width: fit-content;',
		'}',
		`div#${POOL_READER_CONTAINER_ID} > a > img.pool-image {`,
		'display: block;',
		'max-width: 85vw;',
		'max-height: 120vh;',
		'}',
	].join(''));
	const poolID = parseInt(location.pathname.slice(POOL_PATH_PREFIX.length), 10);
	readerPageContainer = makeElem('div', POOL_READER_CONTAINER_ID);
	const statusLine = makeElem('menu', POOL_READER_STATUSLINE_ID);
	subnavbar.parentElement.append(statusLine);
	const status = statusText => {
		debug("Status:", statusText);
		statusLine.textContent = statusText;
	};
	const title = subtitle => {
		document.title = `Pool Reader: ${subtitle} - e621`;
	};
	const checkResponseValidity = async poolData => {
		const pools = poolData.response;
		// pools is an array of pool objects
		if (pools.length > 1) {
			throw new Error(`Site returned too many options (${pools.length})`);
		}
		if (pools.length < 1) {
			throw new Error("Site returned no pools");
		}
		const pool = pools[0];
		const id = pool.id || poolData.context.pool;
		const name = pool.name.replace(/_/gu, ' ');
		const total = pool.post_count;
		if (total != pool.post_ids.length) {
			throw new Error(
				`Sanity check failed, post list (${pool.post_ids.length}) doesn't match expected size (${total})`
			);
		}
		if (!total) {
			throw new Error("Sanity check failed, post list empty");
		}
		title(`loading ${name}... (#${id})`);
		status(`Loading ${total} post${total == 1 ? '' : 's'} from pool #${id}...`);
		const state = Object.create(null);
		state.poolID = id;
		state.poolName = name;
		state.postCount = total;
		state.postIDs = pool.post_ids;
		return state;
	};
	const insertImages = async state => {
		state.posts = [];
		await state.postIDs.reduce(async (ticker, postID) => {
			await ticker;
			status("Pausing to comply with site rules");
			await pause(1500);
			const current = state.posts.length + 1;
			const total = state.postCount;
			title(`${current}/${total} loading ${name}... (#${state.poolID})`);
			status(`Loading post #${postID} (${current}/${total})`);
			const api = await request(`https://e621.net/posts/${postID}.json`);
			state.posts.push({
				url: api.response.post.file.url,
				id: api.response.post.id,
			});
			return new Promise(resolve => {
				const img = makeElem('img', '', 'pool-image');
				const link = makeElem('a', `post-${postID}`);
				link.href = `/posts/${postID}`;
				link.title = `${state.poolName}, ${current}/${total}`;
				link.append(img);
				readerPageContainer.append(link);
				img.addEventListener('load', resolve, {
					once: true,
				});
				img.src = api.response.post.file.url;
			});
		}, Promise.resolve());
		return state;
	};
	const onPoolLoadingError = err => {
		title(`pool loading failed`);
		status(err.toString().replace(/^error:\s+/ui, ''));
	};
	title(`loading pool #${poolID}...`);
	status(`Loading pool data for pool #${poolID}...`);
	const context = {
		pool: poolID,
	};
	return request(`${location.origin}/pools.json?search[id]=${poolID}`, context)
		.then(checkResponseValidity)
		.catch(onPoolLoadingError)
		.then(state => {
			vanillaPageList.parentElement.append(readerPageContainer);
			vanillaPageList.style.display = 'none';
			return state;
		})
		.then(insertImages)
		.then(state => {
			title(`${state.poolName} (#${state.poolID})`);
			status(`Finished loading images for pool ${state.poolID} (${state.postCount} total)`);
			return state;
		});
};
const disablePoolReaderMode = () => {
	location.hash = '';
	const vanillaPageList = document.querySelector("div#posts");
	const readerPageContainer = document.querySelector(`div#${POOL_READER_CONTAINER_ID}`);
	if (!vanillaPageList || !readerPageContainer) {
		return;
	}
	readerPageContainer.style.display = 'none';
	vanillaPageList.style.display = '';
	document.querySelector(`#${POOL_READER_STATUSLINE_ID}`).style.display = 'none';
};
const togglePoolReaderMode = evt => {
	const readerPageContainer = document.querySelector(`div#${POOL_READER_CONTAINER_ID}`);
	if (readerPageContainer && readerPageContainer.style.display) {
		// Exists, hidden
		enablePoolReaderMode();
	}
	else if (readerPageContainer) {
		// Exists, visible
		disablePoolReaderMode();
	}
	else {
		// Doesn't exist
		enablePoolReaderMode();
	}
	if (evt) {
		evt.preventDefault();
		evt.stopPropagation();
	}
};

log("Initialising");

registerKeybind('!r', () => {
	document.location = 'https://e621.net/posts/random';
});

for (const link of document.querySelectorAll(`a[href^="${POOL_PATH_PREFIX}"]`)) {
	link.href = `${link.href}#${POOL_FRAG_READER}`;
}
if (location.pathname.startsWith(POOL_PATH_PREFIX)) {
	const readerItem = makeElem('li', 'enhanced621-pool-reader-toggle');
	const readerLink = makeElem('a');
	GM_addStyle('#enhanced621-pool-reader-toggle { position: absolute; right: 20px; cursor: pointer; }');
	readerLink.addEventListener('click', togglePoolReaderMode);
	readerLink.textContent = 'Toggle reader';
	readerItem.append(readerLink);
	subnavbar.append(readerItem);
	if (location.hash.replace(/^#+/u, '') == POOL_FRAG_READER) {
		enablePoolReaderMode();
	}
}
else if (location.pathname.startsWith(POST_PATH_PREFIX)) {
	const errorNoSource = "Could't find download/source link!";
	const postRatingClassPrefix = 'post-rating-text-';
	const sourceLink = document.querySelector("#image-download-link > a[href]");
	const image = document.querySelector("#image");
	const parentChildNotices = document.querySelector(".bottom-notices > .parent-children");
	const postRatingElem = document.querySelector("#post-rating-text");
	const tagList = document.querySelector("#tag-list");
	const curSearch = document.querySelector("#search-seq-nav span.search-name");
	if (image) {
		if (image.tagName.toLowerCase() == 'img') {
			image.addEventListener('dblclick', evt => {
				if (sourceLink && sourceLink.href) {
					location.assign(sourceLink.href);
				}
				else {
					putError(errorNoSource);
				}
				evt.preventDefault();
				evt.stopPropagation();
			});
		}
		if (sourceLink && sourceLink.href) {
			const directSourceItem = makeElem('li', 'enhanced621-direct-source');
			const directSourceLink = makeElem('a');
			GM_addStyle('#enhanced621-direct-source { position: absolute; right: 20px; cursor: pointer; }');
			directSourceLink.textContent = 'Direct Link';
			directSourceLink.href = sourceLink.href;
			directSourceItem.append(directSourceLink);
			subnavbar.append(directSourceItem);
		}
		else {
			putError(errorNoSource);
		}
	}
	if (parentChildNotices) {
		const scrollToNoticeItem = makeElem('li', 'enhanced621-parent-child-notices');
		const scrollToNoticeLink = makeElem('a');
		GM_addStyle('#enhanced621-parent-child-notices { position: absolute; right: 120px; cursor: pointer; }');
		scrollToNoticeLink.textContent = [
			document.querySelector("#has-parent-relationship-preview") ? 'Parent' : '',
			document.querySelector("#has-children-relationship-preview") ? 'Children' : '',
		].filter(e => e).join('/');
		scrollToNoticeLink.href = '#';
		scrollToNoticeLink.addEventListener('click', evt => {
			try {
				parentChildNotices.scrollIntoView();
				console.log("Scrolled to parent/child notices");
			}
			catch (err) {
				putError("Scrolling failed");
				console.err("Can't scroll to parent/child notices:", err);
			}
			evt.preventDefault();
			evt.stopPropagation();
		});
		scrollToNoticeItem.append(scrollToNoticeLink);
		subnavbar.append(scrollToNoticeItem);
	}
	if (postRatingElem) {
		try {
			const postRating = Array.from(postRatingElem.classList)
				.filter(cl => cl.startsWith(postRatingClassPrefix))
				.shift()
				.slice(postRatingClassPrefix.length)
				.toLowerCase();
			if (postRating) {
				const ratingTag = `rating:${postRating}`;
				const ratingURI = encodeURIComponent(ratingTag);
				const header = makeElem('h2', '', 'rating-tag-list-header tag-list-header');
				const list = makeElem('ul', '', 'rating-tag-list');
				const item = makeElem('li', '', 'category-0');
				const wiki = makeElem('a', '', 'wiki-link');
				const include = makeElem('a', 'search-inc-tag');
				const exclude = makeElem('a', 'search-exl-tag');
				const search = makeElem('a', 'search-tag');
				const tagParam = new URL(location.href)
					.searchParams
					.get('q')
					.replace(
						new RegExp("\\s*-?rating(:|%3A)\\w+\\s*", 'iug'),
						''
					);
				header.dataset.category = 'rating';
				[
					wiki,
					include,
					exclude,
					search,
				].forEach(a => {
					a.rel = 'nofollow';
					a.classList.add('rating-tag');
				});
				wiki.textContent = '?';
				wiki.href = `/wiki_pages/show_or_new?title=${ratingURI}`;
				include.textContent = '+';
				include.href = `/posts?tags=${tagParam}${tagParam ? '+' : ''}${ratingTag}`;
				exclude.textContent = '-';
				exclude.href = `/posts?tags=${tagParam}${tagParam ? '+' : ''}-${ratingTag}`;
				search.textContent = postRating.slice(0, 1).toUpperCase()
					+ postRating.slice(1);
				search.href = `/posts?tags=${ratingURI}`;
				item.append(wiki, ' ', include, ' ', exclude, ' ', search);
				list.append(item);
				header.textContent = "Rating";
				tagList.insertBefore(list, tagList.children[0]);
				tagList.insertBefore(header, tagList.children[0]);
			}
		}
		catch (err) {
			console.error("Can't find post rating:", err);
		}
	}
	if (curSearch) { // may not exist
		const link = makeElem('a', 'enhanced621-current-search-link');
		link.textContent = CURRENT_SEARCH;
		link.href = `/posts?tags=${encodeURIComponent(CURRENT_SEARCH)}`;
		curSearch.innerHTML = link.outerHTML;
	}
	if (CURRENT_SEARCH) { // may also be empty
		const terms = CURRENT_SEARCH
			.split(/\s+/u)
			.filter(t => !t.includes(':'))
			.filter(t => !t.includes('*')) // TODO find a way to handle wildcard tags in searches?
			.map(t => t
				.replace(/^~/u, '')
				.replace(/_/gu, ' ')
				.toLowerCase());
		const originalTermCount = CURRENT_SEARCH.split(/\s+/u).length;
		const difference = Math.abs(terms.length - originalTermCount);
		if (terms.length != originalTermCount) {
			console.info(`${difference} term${difference == 1 ? '' : 's'} can't be searched for!`);
		}
		if (terms.length) {
			GM_addStyle([
				".enhanced621-highlighted-tag {",
				"font-style: italic;",
				"}",
			].join("\n"));
			const tagElements = Array.from(tagList.querySelectorAll("a.search-tag")).reverse();
			console.log(`Elevating all instances ${terms.length} searched tags in ${tagElements.length} listed`);
			for (const tagElem of tagElements) {
				try {
					const tag = tagElem.textContent.toLowerCase();
					const idx = terms.indexOf(tag);
					if (idx >= 0) {
						terms.splice(idx, 1);
						console.log(`Elevating "${tag}"`);
						const line = tagElem.parentElement;
						const group = line.parentElement;
						tagElem.classList.add("enhanced621-highlighted-tag");
						group.insertAdjacentElement('afterbegin', line);
					}
				}
				catch (err) {
					console.error("Cannot examine tag element:", err);
				}
			}
			if (terms.length) {
				console.info(
					`${terms.length} term${terms.length == 1 ? '' : 's'} did not appear: ${terms.join(", ")}`
				);
			}
		}
	}
	try {
		subnavbar.scrollIntoView();
	}
	catch (err) {
		console.error("Can't scroll to page content:", err);
	}
}

