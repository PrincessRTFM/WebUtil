/* eslint-disable max-len */
// ==UserScript==
// @name         E621 Modding Framework
// @namespace    Lilith
// @version      2.1.2
// @description  Provides a simple, event-based framework for E621 pages to be modified by userscripts. Should be loaded before such pages, but can (theoretically, if the plugin script is written properly) be loaded anywhere so long as it loads within one second of the plugin script.
// @author       PrincessRTFM
// @match        *://e621.net/*
// @run-at       document-start
// @grant        GM_info
// @grant        GM_addStyle
// @grant        unsafeWindow
// @grant        GM_setClipboard
// @grant        GM_download
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js
// @updateURL    https://gh.princessrtfm.com/js/monkey/e621-modding-framework.user.js
// ==/UserScript==

/*
v2.0.0: rewritten to use asynchronous JS where possible, and to be less bloated and organic
v2.1.0: added EMF.UTIL with three message display functions
v2.1.1: set the message display box's z-index to 9999 so it'll stay on top of other things
v2.1.2: fixed a cpage bug where the background would be inherited by child elements
*/
/* eslint-enable max-len */

/* eslint-env jquery */
/* global GM_addValueChangeListener GM_download Cookies */

const SCRIPT_NAME = GM_info.script.name;
const SCRIPT_VERSION = `V${GM_info.script.version || '???'}`;
const SCRIPT_TITLE = `${SCRIPT_NAME} ${SCRIPT_VERSION}`;

(function applyFrameworkToPage(window, $, direct) {
	const deepFreeze = target => {
		if (typeof target == 'object' || typeof target == 'function') {
			Object.freeze(target);
			for (const key in target) {
				if (Object.prototype.hasOwnProperty.call(target, key)) {
					deepFreeze(target[key]);
				}
			}
		}
		else if (Array.isArray(target)) {
			for (let i = 0; i < target.length; i++) {
				deepFreeze(target[i]);
			}
		}
		return target;
	};
	const logger = {};
	Object.keys(console).forEach(func => {
		logger[func] = console[func].bind(console);
	});
	'debug log info warn error'.split(/\s+/u).forEach(wrap => {
		logger[wrap] = console[wrap].bind(console, `[${SCRIPT_TITLE}]`);
	});
	Object.freeze(logger);
	logger.info(`${SCRIPT_TITLE} initialising`);
	const USERNAME = Cookies.get('login');
	const warningBox = () => {
		const ID = 'emf-message-box';
		let box = $(`#${ID}`);
		if (box.length) {
			return box.first();
		}
		box = $(`<div class="status-notice" id="${ID}"></div>`).hide();
		GM_addStyle(
			`#${ID} {`
			+ 'position: fixed;'
			+ 'right: 0;'
			+ `top: ${document.getElementById('content').offsetTop}px;`
			+ 'border-top-right-radius: 0;'
			+ 'border-bottom-right-radius: 0;'
			+ 'width: 350px;'
			+ 'z-index: 9999;'
			+ '}'
			+ `#${ID} > .emf-message {`
			+ 'display: block;'
			+ 'margin: 4px;'
			+ 'padding: 3px;'
			+ '}'
			+ '.emf-message-dismiss {'
			+ 'cursor: pointer;'
			+ 'margin-right: 4px;'
			+ 'color: #999999;'
			+ 'font-size: 17px;'
			+ 'position: relative;'
			+ 'top: 2px;'
			+ '}'
			+ '.emf-message-icon {'
			+ 'cursor: default;'
			+ 'margin-left: 3px;'
			+ 'margin-right: 2px;'
			+ 'font-size: 16px;'
			+ 'position: relative;'
			+ 'top: 1px;'
			+ '}'
			+ '.emf-message-icon.emf-message-error {'
			+ 'color: #EE0000;'
			+ '}'
			+ '.emf-message-icon.emf-message-warning {'
			+ 'color: #EEEE00;'
			+ '}'
			+ '.emf-message-icon.emf-message-help {'
			+ 'color: #00EE44;'
			+ '}'
			+ '.emf-message-content {'
			+ 'cursor: default;'
			+ 'margin-left: 2px;'
			+ 'font-size: 16px;'
			+ '}'
		);
		$('body')
			.first()
			.append(box);
		return box;
	};
	const insertUserMessage = (content, type, icon) => {
		const messageContainer = $(`<div class="emf-message emf-message-${type}"></div>`);
		const messageText = $(`<span class="emf-message-content emf-message-${type}"></span>`).html(content);
		const messageClose = $(`<span class="emf-message-dismiss emf-message-${type}">✖</span>`);
		const messageIcon = $(`<span class="emf-message-icon emf-message-${type}"></span>`).text(icon);
		messageContainer.append([
			messageClose,
			messageIcon,
			messageText,
		]);
		messageClose.on('click', () => {
			messageContainer.remove();
			const master = warningBox();
			if (!master.children().length) {
				master.hide();
			}
		});
		warningBox()
			.append(messageContainer)
			.show();
	};
	const EMF = {
		USER: USERNAME,
		VERSION: SCRIPT_VERSION,
		EVENTS: {},
		CPAGE: {
			PREFIX: '/emf/',
			linkFor: Object.freeze(cpage => `${EMF.CPAGE.PREFIX}${cpage}`.replace(/\/+/gu, '/')),
			on: Object.freeze(slug => EMF.CPAGE.slug.startsWith(slug.toLowerCase().replace(/\/+/gu, '/'))),
			get is() {
				return location.pathname.startsWith(EMF.CPAGE.PREFIX);
			},
			set slug(cpage) {
				location.assign(EMF.CPAGE.url(cpage));
			},
			get slug() {
				return EMF.CPAGE.is
					? location
						.pathname
						.substr(EMF.CPAGE.PREFIX.length)
						.toLowerCase()
						.replace(/\/+/gu, '/')
					: void 0;
			},
		},
		UTIL: {
			error(content) {
				insertUserMessage(content, 'error', '⚠');
			},
			warning(content) {
				insertUserMessage(content, 'warning', '⚠');
			},
			help(content) {
				insertUserMessage(content, 'help', '🛈');
			},
		},
	};
	$(() => {
		logger.info(`${SCRIPT_TITLE} injecting`);
		EMF.EVENTS.navsetup = new Promise(resolve => {
			const navbar = $('#navbar');
			const subnav = $('#subnav > .flat-list');
			const subnavLinks = {
				user: [
					'<a href="/user/home">Home</a>',
					'<a href="/user/edit">Settings</a>',
					'<a href="/dmail/inbox">Messages</a>',
					'<a href="/user/logout">Logout</a>',
				],
				post: [
					'<a href="/post/index">Index</a>',
					'<a href="/post/upload">Upload</a>',
					`<a href="/post/index?tags=${escape(`fav:${USERNAME}`)}">Favourites</a>`,
					'<a href="/post/random">Random</a>',
				],
				pool: [ '<a href="/pool/index">Index</a>', '<a href="/pool/create">Create</a>' ],
				tag: ['<a href="/tag/index">Index</a>'],
				set: [
					'<a href="/set/index">Index</a>',
					'<a href="/set/new">Create</a>',
					`<a href="/set/index?username=${USERNAME}&order=creator">Mine</a>`,
					'<a href="/set_maintainer">Invites</a>',
				],
				artist: [ '<a href="/artist/index">Index</a>', '<a href="/artist/create">Add</a>' ],
				dmail: [
					'<a href="/dmail/inbox">Inbox</a>',
					'<a href="/dmail/compose">Compose</a>',
					'<a href="/dmail/mark_all_read">Mark all read</a>',
					'<a href="/dmail/hide_all">Hide all</a>',
					'<a href="/dmail/inbox?visibility=hidden">View hidden</a>',
				],
				emf: [
					`<a href="${EMF.CPAGE.linkFor('debug')}">Debug</a>`,
					'|',
					`<a href="${EMF.CPAGE.linkFor('config')}">Configure EMF</a>`,
				],
			};
			const saved = $('#navbar > div').detach();
			const moreLink = $('#morelink')
				.parent()
				.detach();
			navbar.empty();
			subnav.empty();
			if (USERNAME) {
				navbar.append(
					`<li class="${location.pathname.startsWith('/user/') ? 'current-page' : ''}">`
					+ `<a href="/user/home" title="Logged in as ${USERNAME}">Account</a></li>`
				);
			}
			else {
				navbar.append(
					`<li class="${location.pathname.startsWith('/user/') ? 'current-page' : ''}">`
					+ `<a href="/user/login?url=${escape(location.pathname)}">Login</a>`
					+ `</li>`
				);
			}
			'post pool tag set artist'.split(/\s+/u).forEach(
				where => navbar.append(
					`<li class="${location.pathname.startsWith(`/${where}/`) ? 'current-page' : ''}">`
					+ `<a href="/${where}/index">${where.replace(/^./u, m => m.toUpperCase())}s</a>`
					+ `</li>`
				)
			);
			navbar.append(`<li class="${location.pathname.startsWith('/dmail/') ? 'current-page' : ''}"><a href="/dmail/inbox">Messages</a></li>`);
			navbar.append(`<li class="${EMF.CPAGE.is ? 'current-page' : ''}"><a href="${EMF.CPAGE.linkFor("config")}">EMF</a></li>`);
			navbar.append(moreLink, saved);
			subnav.addClass('subnavbar').attr('id', 'subnavbar');
			navbar.children('li').each((i, elem) => {
				const li = $(elem);
				const navbarLinks = li.children('a[href]');
				if (!navbarLinks.length) {
					return;
				}
				const uri = navbarLinks.attr('href');
				if (!uri) {
					return;
				}
				const clazz = uri
					.substr(1)
					.replace('static/', '')
					.replace(/\/.*$/u, '')
					|| 'frontpage';
				li.addClass(`navlink ${clazz}`);
				if (uri.includes('/login')) {
					li.removeClass(clazz).addClass('login');
				}
				if (li.hasClass('current-page')) {
					subnav.addClass(`navbar-${clazz}`);
					if (subnavLinks[clazz] && subnavLinks[clazz].length) {
						const links = subnavLinks[clazz];
						if (Array.isArray(links)) {
							subnav.prepend(links.map(link => {
								if (!link || link == '|') {
									return '<li>|</li>';
								}
								if (link.startsWith('<') && !link.startsWith('<li')) {
									return `<li>${link}</li>`;
								}
								return link;
							}));
						}
						else {
							subnav.prepend(links);
						}
					}
				}
			});
			resolve({
				navbar,
				subnav,
			});
		});
		EMF.EVENTS.cpage = new Promise(resolve => {
			if (EMF.CPAGE.is) {
				const body = $('#content').first();
				const wrapper = $('<div id="emf-content-wrapper"></div>');
				const style = body[0].currentStyle || window.getComputedStyle(body[0]);
				const bgBits = {
					'background-image': "url('https://i.imgur.com/ruTZXSo.png')",
					'background-size': '150px',
					'background-position': 'top right',
					'background-repeat': 'no-repeat',
					'background-color': 'transparent',
					'background-attachment': 'fixed',
					'margin': 'initial',
					'padding': 'initial',
					'border-radius': 'initial',
					'box-shadow': 'initial',
					'min-width': 'initial',
					'padding-right': '170px',
					'min-height': '150px',
				};
				'background margin padding border-radius box-shadow min-width'.split(/\s+/u).forEach(prop => {
					wrapper.css(prop, style[prop]);
				});
				body.wrap(wrapper);
				Object.keys(bgBits).forEach(key => body[0].style.setProperty(key, bgBits[key], "important"));
				body.empty();
				GM_addStyle([
					'#content * {',
					'background: none !important;', // You want a background, use a more specific CSS rule
					'}',
				].join(''));
				if (EMF.CPAGE.on('/debug')) { // EMF internal debug info page
					document.title = `${SCRIPT_TITLE} Debug - e621`;
					const header = $(`<h2 id="emf-debug-header">${SCRIPT_NAME} Debug Information</h2>`);
					body.append(header, '<h5>Basic details</h5>');
					GM_addStyle(
						'#emf-debug {'
						+ 'width: 50%;'
						+ '}'
						+ '#emf-debug-extended {'
						+ 'font-size: 0.75em;'
						+ 'font-family: monospace;'
						+ 'overflow-wrap: break-word;'
						+ '}'
						+ 'table {'
						+ 'padding: 0;'
						+ '}'
						+ '#emf-debug > tr > td:last-child {'
						+ 'text-align: right;'
						+ '}'
					);
					const table = $('<table id="emf-debug"></table>');
					const debugInfo = {
						'Installed version': SCRIPT_VERSION,
						'Last updated': GM_info.script.lastUpdated || 'never',
						'Update source': GM_info.scriptUpdateURL || 'none',
						'Script injection priority': GM_info.script.position,
						'Script injection time': GM_info.script.options.run_at,
						'Script handler': `${GM_info.scriptHandler} ${GM_info.version}`,
					};
					Object.keys(debugInfo).forEach(name => table.append(`<tr><td>${name}</td><td>${debugInfo[name]}</td></tr>`));
					const extDebug = btoa(JSON.stringify(GM_info));
					const extendedBlock = $('<div id="emf-debug-extended"></div>');
					extendedBlock.text(extDebug);
					body.append(
						table,
						'<h5>Extended details (for the developer - <a href="javascript:void 0" id="emf-copy-extended">copy</a> '
							+ 'or <a href="javascript:void 0" id="emf-save-extended">save</a>)</h5>',
						extendedBlock
					);
					let copyLinkTextResetTimeout;
					$('#emf-copy-extended').on('click', function copyExtendedDebugData() {
						GM_setClipboard(extDebug);
						const link = $(this);
						link.text('copied!');
						if (typeof copyLinkTextResetTimeout != 'undefined') {
							clearTimeout(copyLinkTextResetTimeout);
						}
						copyLinkTextResetTimeout = setTimeout(() => link.text('copy'), 1500);
					});
					$('#emf-save-extended').on('click', () => {
						GM_download({
							url: `data:text/plain,${extDebug}`,
							name: 'emf-extended-debug-data.txt',
							saveAs: true,
							onerror: state => {
								if (state.error == 'not_enabled') {
									EMF.UTIL.error(`You need to allow ${GM_info.scriptHandler} to download files to use this`);
								}
								else if (state.error == 'not_whitelisted') {
									EMF.UTIL.error(`You need to whitelist '.txt' files in ${GM_info.scriptHandler} to use this`);
								}
								else if (state.error == 'not_permitted') {
									EMF.UTIL.error(`You need to give ${GM_info.scriptHandler} permission to download files`);
								}
								else if (state.error == 'not_supported') {
									EMF.UTIL.error(`${GM_info.scriptHandler} is unable to download files in your browser`);
								}
								else {
									EMF.UTIL.error('There was an unknown error - check your console for details');
									logger.group(`${SCRIPT_TITLE} download error`);
									logger.dir(state.error);
									logger.dir(state.details);
									logger.groupEnd();
								}
							},
						});
					});
				}
				else if (EMF.CPAGE.on('/config')) { // EMF internal settings page
					document.title = `${SCRIPT_TITLE} Settings - e621`;
					body.append(`<h2>${SCRIPT_TITLE} Configuration</h2>`);
					body.append('<p>There are no configurable settings in the E621 Modding Framework at this time.</p>');
					body.append(
						'<p>In the future, there may (probably will) be settings you can change, '
						+ 'but this project is still in moderate infancy, and cannot yet be configured.</p>'
					);
					body.append(
						'<p>Any scripts that depend on this framework have their own settings pages (if applicable), '
						+ 'so if you were looking for one of those, you should try looking in various areas relating to the script, '
						+ 'or in the subnav bar above.</p>'
					);
				}
				resolve(EMF.CPAGE.slug);
			}
			else {
				resolve('');
			}
		});
		Object.defineProperty(direct, 'EMF', {
			value: deepFreeze(EMF),
		});
	});
})(window, window.jQuery || window.$ || jQuery || $, unsafeWindow);

