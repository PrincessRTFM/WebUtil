/* eslint-disable max-len */
// ==UserScript==
// @name         E621 Pool Reader
// @namespace    Lilith
// @version      2.0.1
// @description  Adds a reader mode to pool pages, which displays all images sequentially. The pool reader page is a separate path, and normal pool page links are replaced with links to the corresponding pool reader page instead. [REQUIRES EMFv2]
// @author       PrincessRTFM
// @match        https://e621.net/*
// @run-at       document-start
// @grant        GM_info
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_download
// @grant        unsafeWindow
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @updateURL    https://gh.princessrtfm.com/js/monkey/e621-pool-reader.user.js
// ==/UserScript==

/*
v2.0.0: rewritten for the new EMF v2.0.0 to make use of asynchronous JS where possible
v2.0.1: fixed some incorrect logging calls
*/
/* eslint-enable max-len */

/* eslint-env jquery */
/* global GM_addValueChangeListener */

const SCRIPT_NAME = GM_info.script.name;
const SCRIPT_VERSION = `V${GM_info.script.version || '???'}`;
const SCRIPT_TITLE = `${SCRIPT_NAME} ${SCRIPT_VERSION}`;

(function scopeWrapper(window, $, direct) {
	// SETUP
	const logger = {};
	Object.keys(console).forEach(func => {
		logger[func] = console[func].bind(console);
	});
	'debug log info warn error'.split(/\s+/u).forEach(wrap => {
		logger[wrap] = console[wrap].bind(console, `[${SCRIPT_TITLE}]`);
	});
	Object.freeze(logger);
	const scriptCore = EMF => {
		logger.info(`Initialising with EMF ${EMF.VERSION}`);
		const READER_PATH_PREFIX = '/pool/read/';
		const NORMAL_PATH_PREFIX = '/pool/show/';
		EMF.EVENTS.navsetup.then(({
			subnav,
		}) => {
			$('a[href]').each(function redirectPoolPageLinks() {
				this.href = this.href.split(NORMAL_PATH_PREFIX).join(READER_PATH_PREFIX);
			});
			if (location.pathname.startsWith(NORMAL_PATH_PREFIX)) {
				const poolID = parseInt(location.pathname.substr(NORMAL_PATH_PREFIX.length), 10);
				const subnavbar = $('#subnav')
					.children('.flat-list')
					.first();
				subnavbar.prepend(`<li><a href="${READER_PATH_PREFIX}${poolID}">Reader</a></li><li>|</li>`);
			}
			else if (location.pathname.startsWith(READER_PATH_PREFIX)) {
				// DEFINITIONS
				const poolID = parseInt(location.pathname.substr(READER_PATH_PREFIX.length), 10);
				const body = $('#content');
				const statusLine = subnav;
				const postList = [];
				const lpad = (thing, length, padding) => ''.padStart.call(thing, length, padding);
				const status = function(statusText) {
					statusLine.empty();
					statusLine.text(statusText).append('<span id="statusline-right"></span>');
					$('#statusline-right').append(`<a id="pool-source-link" href="/pool/show/${poolID}">Pool</a>`);
					logger.debug(`[${SCRIPT_NAME}] ${statusText}`);
				};
				const title = function(subtitle) {
					document.title = `Pool Reader: ${subtitle} - e621`;
				};
				const onPoolDataLoaded = (additionalPagesNeeded, poolData) => {
					body.empty();
					const pool = poolData.response;
					const id = pool.id || poolData.context.pool;
					const page = poolData.context.page || 1;
					const name = pool.name.replace(/_/gu, ' ');
					const total = pool.post_count;
					title(`loading ${name}... (#${id})`);
					status(`Queueing posts for pool ${id} (${name}...`);
					pool.posts.forEach(post => postList.push(post));
					if (postList.length == total) {
						status(`Loading ${total} post${total == 1 ? '' : 's'} from ${id}...`);
						// Put the image on the page, load it
						// When it's done, pull the next and repeat
						let post;
						let img;
						let index = 0;
						const loadNextImage = () => {
							if (typeof img != 'undefined') {
								$(img).show();
								img.onload = null;
							}
							if (!(post = postList.shift())) {
								title(`${name} (#${id})`);
								status(`Loaded ${name} (pool #${id}, ${total} image${total == 1 ? '' : 's'})`);
								return;
							}
							index++;
							status(`Loading image #${post.id} (${lpad(index, String(total).length, 0)}/${total})...`);
							img = document.createElement('img');
							img.onload = loadNextImage;
							$(img).addClass('pool-image')
								.hide();
							body.append(img);
							img.src = post.file_url;
						};
						loadNextImage();
					}
					else {
						status(`Loaded ${postList.length} of ${total} posts, trying next page`);
						additionalPagesNeeded(id, page + 1);
					}
				};
				const onPoolLoadingError = err => {
					const id = err.context.pool || poolID;
					const page = err.context.page || 1;
					title(`Error on ${id}`);
					status(`Unable to load pool data for ${id}, page ${page}`);
				};
				const onPoolLoadingTimeout = state => {
					const id = state.context.pool || poolID;
					const page = state.context.page || 1;
					title(`Timed out on ${id}`);
					status(`Request timed out loading pool data for ${id}, page ${page}`);
				};
				const loadPoolData = (id, page) => {
					page = page || 1;
					title(`loading ${id}...`);
					status(`Loading pool data for page ${page} of ${id}...`);
					GM_xmlhttpRequest({
						method: "GET",
						url: `${location.origin}/pool/show/${id}.json?page=${page}`,
						responseType: 'json',
						onerror: onPoolLoadingError,
						onload: onPoolDataLoaded.bind(onPoolDataLoaded, loadPoolData),
						ontimeout: onPoolLoadingTimeout,
						context: {
							pool: id,
							page,
						},
					});
				};
				// EXECUTION
				GM_addStyle(
					'.pool-image {'
					+ 'display: block;'
					+ 'margin-left: auto;'
					+ 'margin-right: auto;'
					+ 'margin-top: 10px;'
					+ 'margin-bottom: 10px;'
					+ 'max-width: 100%;'
					+ '}'
					+ '#statusline-right {'
					+ 'position: absolute;'
					+ 'right: 20px;'
					+ '}'
				);
				body.empty();
				loadPoolData(poolID);
			}
		});
	};
	let emfCheckCounter = 0;
	const emfCheck = new Promise((resolve, reject) => {
		const interval = setInterval(() => {
			if (typeof direct.EMF == 'object') {
				clearInterval(interval);
				resolve(direct.EMF);
			}
			else if (++emfCheckCounter > 50) {
				clearInterval(interval);
				reject(new Error('EMF not detected'));
			}
		}, 100);
	});
	emfCheck.then(scriptCore, error => logger.error("Failed to initialise:", error));
})(window, window.jQuery || window.$ || jQuery || $, unsafeWindow);

