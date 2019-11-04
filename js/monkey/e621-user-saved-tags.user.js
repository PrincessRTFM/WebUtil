/* eslint-disable max-len */
// ==UserScript==
// @name         E621 Saved Tags
// @namespace    Lilith
// @version      2.1.0
// @description  Provides a user-editable list of tags on the sidebar, with quicksearch/add-to/negate links like normal sidebar tag suggestions. Minor additional QoL tweaks to the site, including a direct link to the image on all image pages. [REQUIRES EMFv2]
// @author       PrincessRTFM
// @match        *://e621.net/*
// @run-at       document-start
// @grant        GM_info
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_addStyle
// @grant        unsafeWindow
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @updateURL    https://gh.princessrtfm.com/js/monkey/e621-user-saved-tags.user.js
// ==/UserScript==

/*
v1.0.0: minimal functionality implemented, taglist only modifiable via "save/forget" links
v1.1.0: basic taglist editing via textareas available
v1.2.0: now cleans up all sidebar tags to include wiki-article, search-only, add-to-search, and negate-in-search links
v1.3.0-rc.1: (ab)use `document.referrer` to grab the originating search on post image pages
v1.3.0-rc.2: switch to saving the originating search in a URL parameter, stick it on all post page links whenever it exists
v1.3.0: provide a box with a share link for the current post without the last-search param, with it if it exists, and with a direct image link (cloned from the download link)
v1.3.1: moved the "This Post" links to a new box so it doesn't break the "Child Posts" displays, which use hard-coded heights because the coder didn't want to use `display: none` I guess?
v1.4.0: the "remember tag" pseudolinks now display differently based on whether the tag is saved or not
v2.0.0: entire script rewritten to function as asynchronously as possible
v2.1.0: added tag search button
*/
/* eslint-enable max-len */

/* eslint-env jquery */
/* global GM_addValueChangeListener */

//   CONFIGURATION   \\
const STORAGE_KEY_TAGS_LIST = 'tagList';
const EDITOR_PAGE_SLUG = 'tagsaver';
// END CONFIGURATION \\

const SCRIPT_NAME = GM_info.script.name;
const SCRIPT_VERSION = `V${GM_info.script.version || '???'}`;
const SCRIPT_TITLE = `${SCRIPT_NAME} ${SCRIPT_VERSION}`;
const DEFAULT_TAGS = {
	general: [
		'rating:e',
		'rating:q',
		'rating:s',
	],
};

(function runScript(window, $, direct) {
	// SETUP
	const logger = {};
	Object.keys(console).forEach(func => {
		logger[func] = console[func].bind(console);
	});
	'debug log info warn error'.split(/\s+/u).forEach(wrap => {
		logger[wrap] = console[wrap].bind(console, `[${SCRIPT_TITLE}]`);
	});
	Object.freeze(logger);
	const normalise = dirty => unescape(
		(dirty || '').trim()
	).replace(/_+/gu, ' ');
	const technify = clean => escape(
		normalise(clean).replace(/\s+/gu, '_')
	);
	const regexLocationTags = /^\/post(?:\/index\/\d+\/?|(?:\/search\/?)?\?tags=|\/show\/\d+\?last=)(.*)$/iu;
	const filterObj = (obj, pred) => {
		const result = {};
		for (const key in obj) {
			if ({}.prototype.hasOwnProperty.call(obj, key) && pred(obj[key])) {
				result[key] = obj[key];
			}
		}
		return result;
	};
	const TAG_TYPES = [
		'general',
		'character',
		'species',
		'copyright',
		'artist',
	];
	const scriptCore = EMF => {
		logger.info(`Initialising with EMF ${EMF.VERSION}`);
		const editorLink = EMF.CPAGE.linkFor(EDITOR_PAGE_SLUG);
		const existingSearch = (
			unescape(location.pathname + location.search).match(regexLocationTags)
			|| [ '', '' ]
		)[1].replace(/\+/gu, ' ');
		logger.info(`Existing search${existingSearch ? `: ${existingSearch}` : ' not found'}`);
		const loadUserTags = async () => {
			let storedValue = GM_getValue(STORAGE_KEY_TAGS_LIST, DEFAULT_TAGS);
			while (typeof storedValue == 'string') { // It can't make up its fucking mind!
				storedValue = JSON.parse(storedValue);
			}
			if (typeof storedValue != "object") {
				throw new TypeError(`Retrieved usertags value is ${typeof storedValue} instead of an object`);
			}
			$.each(storedValue, key => {
				while (typeof storedValue[key] == 'string') {
					try {
						storedValue[key] = JSON.parse(storedValue[key]);
					}
					catch (e) {
						break;
					}
				}
			});
			return storedValue;
		};
		const cleanTagList = async dirtyTags => {
			if (typeof dirtyTags != 'object') {
				throw new TypeError(`cleanTagList() called with ${typeof dirtyTags} instead of object`);
			}
			const userTags = {};
			TAG_TYPES.forEach(type => {
				userTags[type] = dirtyTags[type] || [];
				userTags[type]
					.sort()
					.sort((a, b) => {
						if (a.includes(':') && b.includes(':')) {
							return 0;
						}
						else if (a.includes(':')) {
							return -1;
						}
						return 1;
					});
			});
			return userTags;
		};
		const saveUserTags = async tagList => cleanTagList(tagList).then(cleanedTags => {
			GM_setValue(STORAGE_KEY_TAGS_LIST, JSON.stringify(cleanedTags));
			return cleanedTags;
		});
		// EVENTS
		EMF.EVENTS.navsetup.then(({
			subnav,
		}) => {
			logger.log("Detected EMF's subnavsetup event");
			$(() => {
				if (!$('#userscript-saved-tags').length) {
					subnav
						.filter('.navbar-user, .navbar-post, .navbar-tag')
						.prepend(`<li><a href="${editorLink}">Saved Tags</a></li>`, '<li>|</li>');
				}
				subnav.filter('.navbar-emf').append(`<li><a href="${editorLink}">Saved Tags</a></li>`);
			});
		});
		EMF.EVENTS.cpage.then(
			slug => {
				if (slug.startsWith(EDITOR_PAGE_SLUG)) {
					document.title = "User Saved Tags - e621";
					EMF.EVENTS.navsetup.then(({
						navbar,
						subnav,
					}) => {
						navbar
							.children('li')
							.children('a[href="/user/home"]')
							.parent()
							.addClass('current-page');
						subnav.html(
							'<li>'
							+ '<a href="/user">List</a>'
							+ '</li>'
							+ '<li>'
							+ '<a href="/user/home">Home</a>'
							+ '</li>'
							+ '<li>'
							+ '<a href="/user/edit">Settings</a>'
							+ '</li>'
							+ '<li>'
							+ '<a href="/dmail/inbox">Messages</a>'
							+ '</li>'
							+ '<li>'
							+ '<a href="/user/logout">Logout</a>'
							+ '</li>'
						);
					});
					GM_addStyle(
						'button {'
						+ 'border-radius: 2px;'
						+ 'box-shadow: 2px 2px 5px #07162d;'
						+ 'border: 0;'
						+ 'margin-top: 5px;'
						+ 'border: 0;'
						+ 'padding: 1px 2px;'
						+ 'position: relative;'
						+ 'top: -3px;'
						+ 'min-width: 65px;'
						+ 'min-height:22px;'
						+ '}'
					);
					const mkContainer = type => $('<div class="section taglist-container" style="width: min-content;"></div>')
						.attr('id', `container-taglist-${type}`);
					const mkEditor = type => $('<textarea class="taglist-editor" cols="80" rows="8" style="resize: none; display: block;"></textarea>')
						.attr('id', `taglist-${type}`)
						.on('keyup', function tagEditorEventKeyup() {
							const val = this.value.trim();
							this.rows = val
								? val.split("\n").length + 1
								: 1;
						});
					const mkHeader = (type, text) => {
						const label = $('<label class="taglist-label"></label>')
							.attr('id', `lbl-taglist-${type}`)
							.attr('for', `taglist-${type}`);
						const header = $('<h4 class="taglist-header"></h4>')
							.attr('id', `header-taglist-${type}`)
							.text(text || `Saved Tags: ${type.toLowerCase().replace(/^(.)/u, char => char.toUpperCase())}`);
						label.append(header);
						return label;
					};
					const section = (type, headline) => {
						const container = mkContainer(type);
						const editor = mkEditor(type);
						const header = mkHeader(type, headline);
						const warningUnsaved = $(
							'<span class="taglist-warning taglist-warning-unsaved">⚠ This set of tags has unsaved changes! ⚠</span>'
						).addClass(`unsaved-warning-taglist-${type}`);
						const warningDesynced = $(
							'<span style="float: right;" class="taglist-warning taglist-warning-desync">⚠ This set of tags has changed elsewhere! ⚠</span>'
						).addClass(`desync-warning-taglist-${type}`);
						const btnSave = $('<button class="save-taglist-editor" style="display: inline;">Save</button>')
							.attr('id', `save-taglist-${type}`)
							.on('click', () => {
								loadUserTags()
									.then(cleanTagList())
									.then(usertags => {
										usertags[type] = editor.val()
											.trim()
											.split("\n")
											.map(tag => tag.trim());
										return usertags;
									})
									.then(saveUserTags)
									.then(() => container.removeClass('unsaved desync'));
							});
						const btnReset = $('<button class="reset-taglist-editor" style="display: inline; float: right;">Reset</button>')
							.attr('id', `reset-taglist-${type}`)
							.on('click', () => {
								loadUserTags()
									.then(cleanTagList())
									.then(usertags => {
										editor.val(
											usertags[type]
												.map(tag => tag.trim())
												.join("\n")
												.trim()
										).trigger('keyup');
										container.removeClass('unsaved desync');
									});
							});
						const onTagEditorContentChanged = function onTagEditorContentChanged() {
							if (typeof onTagEditorContentChanged.timeout != 'undefined') {
								clearTimeout(onTagEditorContentChanged.timeout);
							}
							onTagEditorContentChanged.timeout = setTimeout(async () => {
								if (
									(await loadUserTags().then(cleanTagList))[type]
										.map(tag => tag.trim())
										.join("\n")
										.trim()
									== this.value.trim()
								) {
									container.removeClass('unsaved desync');
								}
								else {
									container.addClass('unsaved');
								}
							}, 500);
						};
						[
							'change',
							'keyup',
							'focus',
							'blur',
						].forEach(evt => editor.on(evt, onTagEditorContentChanged));
						container.append(editor, btnSave, warningUnsaved, btnReset, warningDesynced, '<div style="clear: both;"></div>');
						btnReset.trigger('click');
						return [ header, container ];
					};
					const reloadAllTagEditors = () => $('.reset-taglist-editor').each(async function clickEditorReloadButton() {
						$(this).click();
					});
					const core = $('#content');
					const body = $('<div id="saved-tags-edit"></div>');
					TAG_TYPES.forEach(type => body.append(section(type)));
					const headIO = mkHeader('import-export', 'Import/Export');
					const sectIO = mkContainer('import-export');
					const textIO = mkEditor('import-export');
					const inputI = $('<button class="import-taglist-data" style="display: inline;" id="import-taglists">IMPORT</button>')
						.on('click', async () => {
							const imported = JSON.parse(
								textIO.val().trim()
							);
							const tags = {};
							TAG_TYPES.forEach(type => {
								while (typeof imported[type] == 'string') {
									try {
										imported[type] = JSON.parse(imported[type]);
									}
									catch (e) {
										break;
									}
								}
								tags[type] = Array.isArray(imported[type])
									? imported[type]
									: [];
							});
							saveUserTags(tags)
								.then(
									reloadAllTagEditors,
									error => {
										// TODO handle error
									}
								);
						});
					const inputA = $('<button class="amend-taglist-data" style="display: inline;" id="import-taglists">AMEND</button>')
						.on('click', async () => {
							const imported = JSON.parse(
								textIO.val().trim()
							);
							loadUserTags()
								.then(cleanTagList)
								.then(usertags => {
									TAG_TYPES.forEach(type => {
										while (typeof imported[type] == 'string') {
											try {
												imported[type] = JSON.parse(imported[type]);
											}
											catch (e) {
												break;
											}
										}
										if (!Array.isArray(imported[type])) {
											return;
										}
										imported[type].forEach(tag => {
											if (usertags[type].includes(tag)) {
												return;
											}
											usertags[type].push(tag);
										});
									});
									return usertags;
								})
								.then(saveUserTags)
								.then(
									reloadAllTagEditors,
									error => {
										// TODO handle error
									}
								);
						});
					const inputO = $('<button class="export-taglist-data" style="display: inline; float: right;" id="export-taglists">EXPORT</button>')
						.on('click', async () => {
							loadUserTags()
								.then(cleanTagList)
								.then(usertags => filterObj(usertags, list => list.length))
								.then(usertags => {
									textIO.val(
										JSON.stringify(usertags)
									);
								});
						});
					textIO.off('keyup').attr('rows', 10);
					sectIO.append(
						'<p>'
						+ 'To save a copy of your current tag lists, press the EXPORT button and save the resulting text.<br />'
						+ 'To <i>overwrite</i> your current tag lists with that copy, paste the text into the box and press the IMPORT button.<br/>'
						+ 'To <i>add</i> that copy to your current tag lists, paste the text into the box and press the AMEND button.'
						+ '</p>'
					);
					sectIO.append(textIO, inputI, ' ', inputA, inputO, '<div style="clear: both;"></div>');
					body.append(headIO, sectIO);
					core.empty();
					GM_addStyle(
						'.taglist-container > .taglist-warning {'
						+ 'margin: 0 0.5em;'
						+ '}'
						+ '.taglist-container > .taglist-warning-desync {'
						+ 'display: none;'
						+ '}'
						+ '.taglist-container.desync > .taglist-warning-desync {'
						+ 'display: inline;'
						+ '}'
						+ '.taglist-container > .taglist-warning-unsaved {'
						+ 'display: none;'
						+ '}'
						+ '.taglist-container.unsaved > .taglist-warning-unsaved {'
						+ 'display: inline;'
						+ '}'
					);
					core.append(body);
				}
				else {
					const tagSearchInput = $('input#tags');
					const tagSearchContainer = tagSearchInput.parent();
					const tagSearchDiv = tagSearchInput.parents('div.sidebar > div');
					const savedTagsDiv = $('<div id="userscript-saved-tags" style="margin-bottom: 1em;"></div>');
					const savedTagsTogglableContent = $('<div id="user-saved-tags-sidebar-content"></div>').hide();
					const savedTagsHeader = $('<h5></h5>')
						.append(
							$('<span style="cursor: pointer" id="toggle-user-saved-tags-sidebar">User Saved Tags</span>')
								.on('click', () => {
									savedTagsTogglableContent.toggle();
								}),
							' ',
							`<a href="${editorLink}" class="searchhelp">[edit]</a></h5>`
						);
					const savedTagsList = $('<ul></ul>').hide();
					const savedTagsEmptyWarning = $('<div>No user tags have been saved</div>');
					const addTagToSearchBox = (tag, event) => {
						if (tagSearchInput.length) {
							if (typeof event == 'object') {
								if (typeof event.preventDefault == 'function') {
									event.preventDefault();
								}
								event.returnValue = false;
							}
							const searchableTag = normalise(tag);
							const currentSearch = tagSearchInput.val();
							logger.info(`Injecting "${searchableTag}" into existing search for "${currentSearch}"`);
							logger.info(`Stripping existing copies of "${searchableTag}" from existing search`);
							let currentTags = currentSearch
								.split(/\s+/u)
								.filter(existingTag => normalise(existingTag) != searchableTag);
							if (searchableTag.startsWith('-')) {
								logger.info(`Stripping non-negated copies of "${searchableTag}" from existing search`);
								currentTags = currentTags.filter(existingTag => normalise(existingTag) != searchableTag.substr(1));
							}
							else {
								logger.info(`Stripping negated copies of "${searchableTag}" from existing search`);
								currentTags = currentTags.filter(existingTag => normalise(existingTag) != `-${searchableTag}`);
							}
							const modifiedSearch = `${currentTags.join(' ')} ${searchableTag}`.replace(/\s+/gu, ' ').trim();
							logger.debug(`Constructed new search string: ${modifiedSearch}`);
							tagSearchInput.val(modifiedSearch);
							return false;
						}
						if (typeof event == 'object') {
							event.returnValue = true;
						}
						return true;
					};
					const searchForTag = async (unsafeTag, type) => {
						const safeTag = normalise(unsafeTag);
						const usertags = await loadUserTags().then(cleanTagList);
						let index = -1;
						if (type) {
							index = usertags[type].findIndex(testing => normalise(testing) == safeTag);
						}
						else {
							for (let i = 0; i < TAG_TYPES.length; i++) {
								type = TAG_TYPES[i];
								index = usertags[type].findIndex(testing => normalise(testing) == safeTag);
								if (index >= 0) {
									break;
								}
							}
						}
						const details = {
							tag: safeTag,
							tagType: type,
							userlistIndex: index,
						};
						if (index >= 0) {
							return details;
						}
						throw details;
					};
					const generateTagLineElements = (targetTag, type) => {
						targetTag = normalise(targetTag);
						const uriTag = technify(targetTag);
						const wiki = $(`<a class="taglink taglink-wiki taglink-wiki-${uriTag}">?</a>`)
							.attr('href', `/wiki/show?title=${uriTag}`);
						const add = $(`<a class="taglink taglink-append taglink-append-${uriTag}">+</a>`)
							.attr('href', `/post/search?tags=${`${escape(existingSearch)} ${uriTag}`.trim()}`)
							.on('click', e => addTagToSearchBox(targetTag, e));
						const remove = $(`<a class="taglink taglink-negate taglink-negate-${uriTag}">–</a>`)
							.attr('href', `/post/search?tags=${`${escape(existingSearch)} -${uriTag}`.trim()}`)
							.on('click', e => addTagToSearchBox(`-${targetTag}`, e));
						const remember = $(`<a class="taglink taglink-remember taglink-remember-${uriTag}"></a>`)
							.attr('href', '#')
							.on('click', e => {
								searchForTag(targetTag, type)
									.then(
										async ({
											tag,
											tagType,
											userlistIndex,
										}) => {
											const usertags = await loadUserTags().then(cleanTagList);
											usertags[tagType].splice(userlistIndex, 1);
											$(`.taglink.taglink-remember.taglink-remember-${technify(tag)}`)
												.addClass("usertag-unsaved")
												.removeClass("usertag-saved");
											saveUserTags(usertags);
										},
										async ({
											tag,
											tagType,
										}) => {
											const usertags = await loadUserTags().then(cleanTagList);
											usertags[tagType].push(technify(tag));
											$(`.taglink.taglink-remember.taglink-remember-${technify(tag)}`)
												.addClass("usertag-saved")
												.removeClass("usertag-unsaved");
											saveUserTags(usertags);
										}
									);
								if (e.preventDefault) {
									e.preventDefault();
								}
								e.returnValue = false;
								return false;
							});
						searchForTag(targetTag, type).then(
							() => remember.addClass("usertag-saved").removeClass("usertag-unsaved"),
							() => remember.addClass("usertag-unsaved").removeClass("usertag-saved")
						);
						const isolate = $('<a>TAG</a>')
							.text(targetTag)
							.attr('href', `/post/search?tags=${uriTag}`);
						return [
							wiki,
							' ',
							add,
							' ',
							remove,
							' ',
							remember,
							' ',
							isolate,
						];
					};
					const assembleTagList = async usertags => {
						savedTagsList.empty();
						TAG_TYPES.forEach(tagType => {
							usertags[tagType].forEach(tag => {
								const tagValue = tag.trim();
								if (!tagValue) {
									return;
								}
								const li = $(`<li class="tag-line tag-type-${tagType}"></li>`);
								li.append(generateTagLineElements(tagValue, tagType));
								li.children('a')
									.each(
										function applyInlineFontWeight() {
											$(this).css('font-weight', 'normal');
										}
									);
								savedTagsList.append(li);
							});
						});
						if (savedTagsList.children().length) {
							savedTagsList.show();
							savedTagsEmptyWarning.hide();
						}
						else {
							savedTagsList.hide();
							savedTagsEmptyWarning.show();
						}
						return usertags;
					};
					const redrawScriptContent = async () => {
						loadUserTags()
							.then(cleanTagList)
							.then(usertags => {
								$('.taglink.taglink-remember')
									.addClass("usertag-unsaved")
									.removeClass("usertag-saved");
								TAG_TYPES.forEach(async type => {
									usertags[type].forEach(
										tag => $(`.taglink.taglink-remember.taglink-remember-${technify(tag).replace(/%../gu, '_')}`)
											.addClass("usertag-saved")
											.removeClass("usertag-unsaved")
									);
								});
								return usertags;
							})
							.then(assembleTagList);
					};
					savedTagsTogglableContent.append(savedTagsList, savedTagsEmptyWarning);
					GM_addStyle(
						'.taglink.taglink-remember.usertag-saved::after {'
						+ 'content: "$";'
						+ '}'
						+ '.taglink.taglink-remember.usertag-unsaved::after {'
						+ 'content: "#";'
						+ '}'
					);
					// debugger;
					if (location.pathname.startsWith('/post/show/')) {
						console.log(`Existing search ${existingSearch ? `found: ${unescape(existingSearch)}` : 'not found'}`);
						const originalTitle = document.title;
						const postID = location.pathname.substr('/post/show/'.length);
						document.title = `#${postID}: ${originalTitle}`;
						tagSearchInput.val(unescape(existingSearch));
						const noticeBox = $('<div class="status-notice" style="padding: .5em;" id="uscript-this-post"></div>');
						$('div.status-notice').prependTo('.sidebar');
						$('.sidebar').prepend(noticeBox);
						const thisPost = $('<p></p>');
						const br = '<br />';
						const linkClean = $(`<a href="${location.href.substring(0, location.href.length - location.search.length)}"></a>`);
						const linkDirty = $(`<a href="${location.href}"></a>`);
						const linkImage = $(`<a href="${
							$('#highres').attr('href')
							|| $('#image').attr('src')
						}"></a>`);
						linkClean.text(`#${location.pathname.replace(/^.+\/(\d+).*$/u, '$1') + (existingSearch ? ' (clean link)' : '')}`);
						linkDirty.text(`#${location.pathname.replace(/^.+\/(\d+).*$/u, '$1')} (this link)`);
						linkImage.text('Direct image');
						thisPost.append(linkClean, existingSearch
							? [
								br,
								linkDirty,
								br,
							]
							: br, linkImage);
						noticeBox.prepend('<h6>This Post</h6>', thisPost);
					}
					if (existingSearch) {
						$('a[href]')
							.each(async (i, elem) => {
								const href = new URL(elem.href, location.origin);
								if (href.host == location.host && href.pathname.startsWith("/post/show/")) {
									href.searchParams.set("last", existingSearch);
									elem.href = href;
								}
							});
					}
					savedTagsDiv.append(savedTagsHeader, savedTagsTogglableContent);
					tagSearchDiv.after(savedTagsDiv);
					tagSearchInput.css('width', tagSearchContainer[0].getWidth() - (tagSearchContainer[0].getHeight() + 10)).val(existingSearch);
					tagSearchContainer.append(
						$(`<input type="button" id="tagsearch-go-button"/>`)
							.css('width', tagSearchContainer[0].getHeight())
							.css('min-width', tagSearchContainer[0].getHeight())
							.css('height', tagSearchContainer[0].getHeight())
							.css('min-height', tagSearchContainer[0].getHeight())
							.val('→')
							.on('click', () => {
								const tags = tagSearchInput.val().replace(/\s+/gu, ' ').trim();
								if (tags.length) {
									location.assign(`/post/index/1/${tags}`);
								}
								else {
									location.assign('/post');
								}
							})
					);
					redrawScriptContent();
					$('#tag-sidebar > li[class]')
						.each(async (i, e) => {
							if (!e.className.includes('tag-type-')) {
								return;
							}
							const tagLine = $(e);
							const tag = tagLine.children('a[href]')
								.last()
								.text();
							tagLine.children('a[href]').remove();
							const remainder = tagLine.children().detach();
							tagLine
								.addClass('tag-line')
								.append(
									generateTagLineElements(
										tag,
										e.className
											.split(/\s+/u)
											.filter(test => test.startsWith('tag-type-'))[0]
											.substr('tag-type-'.length)
									),
									' ',
									remainder
								);
						});
					GM_addValueChangeListener(STORAGE_KEY_TAGS_LIST, name => {
						if (name != STORAGE_KEY_TAGS_LIST) {
							return;
						}
						logger.info("Saved tags have changed, reassembling page data");
						redrawScriptContent();
						$('li.tag-line');
						$('.taglist-container')
							.each((i, container) => {
								if ($(container).hasClass('unsaved')) {
									$(container).addClass('desync');
								}
								else {
									$(container)
										.children('.reset-taglist-editor')
										.click();
								}
							});
					});
				}
			}
		);
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
	emfCheck.then(scriptCore, error => logger.info("Failed to initialise:", error));
})(window, window.jQuery || window.$ || jQuery || $, unsafeWindow);

