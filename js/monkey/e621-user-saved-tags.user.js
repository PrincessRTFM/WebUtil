/* eslint-disable max-len */
// ==UserScript==
// @name         E621 User Saved Tags
// @namespace    Lilith
// @version      2.9.3
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
v2.2.0: tag search links now just replace the tag search box contents
v2.2.1: fixed a bug in the tagline link functions where spaces wouldn't be escaped to underscores, which mangled searches
v2.3.0: errors are now displayed using EMF's new message utility
v2.3.1: fixed é (accented lowercase e) turning into 'Ã©' in search tags (was using the wrong encode/decode function)
v2.3.2: fixed a bug where jquery was upset about invalid characters in a search query
v2.3.3: fixed a bug where existing searches didn't fully decode
v2.4.0: improved functionality of tagline links
v2.4.1: fixed some incorrect logging calls
v2.5.0: added a help/tutorial/guide page
v2.5.1: fixed a TypeError where the script tried to get the height of something that didn't exist on EMF cpages
v2.5.2: fix an error with pinning tags that use non-ASCII-alphanumeric characters
v2.5.3: fix a bug where the explicitly clean link was still being munged like the others
v2.6.0: double clicking the post image now goes to the direct image itself
v2.6.1: fixed a bug causing duplicated search terms
v2.6.2: finished fixing the bug about duplicate search terms
v2.6.3: finally tracked down a bug preventing tags from being properly detected during the add/remove process
v2.7.0: post pages have a tag count for each category header on the sidebar
v2.8.0: tag index pages (/tag/index) now offer save/forget links too
v2.8.1: tag editors are slightly cleaner now
v2.8.2: fixed a bug where the update handler wouldn't register on cpages
v2.9.0: added a save/unsave link on wiki pages
v2.9.1: fixed a bug in a utility function that prevented exporting the tags
v2.9.2: (theoretically) optimised some code for updating the save/unsave buttons so it should run faster now
v2.9.3: fixed a bug introduced in the last update that caused some of the save/unsave buttons to not update properly
*/
/* eslint-enable max-len */

/* eslint-env jquery */
/* global GM_addValueChangeListener */


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
const STORAGE_KEY_TAGS_LIST = 'tagList';
const EDITOR_PAGE_SLUG = 'tagsaver/edit';
const HELP_PAGE_SLUG = 'tagsaver/help';
const POST_PAGE_SLUG = 'post/show/';
const STORAGE_KEY_FIRST_RUN = 'firstRun';

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
		decodeURI(
			(dirty || '').trim()
		)
	).replace(/_+/gu, ' ');
	const technify = clean => encodeURI(
		normalise(clean).replace(/\s+/gu, '_')
	);
	const regexLocationTags = /^\/post(?:\/index\/\d+\/?|(?:\/search\/?)?\?tags=|\/show\/\d+\?last=)(.*)$/iu;
	const filterObj = (obj, pred) => {
		const result = {};
		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key) && pred(obj[key])) {
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
		const helpLink = EMF.CPAGE.linkFor(HELP_PAGE_SLUG);
		if (GM_getValue(STORAGE_KEY_FIRST_RUN, true)) { // First run, so exciting!
			EMF.UTIL.help(
				`Welcome to <abbr title="${SCRIPT_NAME}">EUST</abbr> ${SCRIPT_VERSION}! `
				+ 'It looks like this is your first time using this script, so we wanted to offer a '
				+ `<a href="${helpLink}">quick guide</a> in case you're not sure what to do.`
			);
			GM_setValue(STORAGE_KEY_FIRST_RUN, false);
		}
		const existingSearch = (
			unescape(decodeURI(location.pathname + location.search))
				.match(regexLocationTags)
			|| [ '', '' ]
		)[1]
			.replace(/\+/gu, ' ');
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
		const registerUpdateHandler = handler => {
			if (typeof handler == 'function') {
				GM_addValueChangeListener(STORAGE_KEY_TAGS_LIST, name => {
					if (name != STORAGE_KEY_TAGS_LIST) {
						return;
					}
					logger.debug("Saved tags have changed, executing registered update handler");
					handler();
				});
			}
			else {
				logger.error("Attempted to register non-function update handler");
			}
		};
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
				if (slug.startsWith(HELP_PAGE_SLUG)) {
					document.title = "User Saved Tags - Guide/Help - e621";
					const body = $('#content');
					const add = '<tt>+</tt>';
					const del = '<tt>-</tt>';
					const save = '<tt>#</tt>';
					const unsave = '<tt>$</tt>';
					const wiki = '<tt>?</tt>';
					GM_addStyle(
						'img.centre {'
						+ 'display: block;'
						+ 'margin: 0 auto;'
						+ '}'
					);
					body.append([
						/* eslint-disable max-len */
						'<h4><a name="quickstart">Quickstart Guide</a></h4>',
						`<p>If you're here, using this script, chances are you already know what it's for and you want it. This section tells you how to easily get set up with it for casual use. If that's wrong or you'd like a better description of this script, you'll probably want to look at the <a href="overview">overview</a> instead.</p>`,
						`<p>At the most basic level:</p>`,
						`<ul>`
						+ `<li>Click the ${add} to un-negate (or add) the tag to your search box</li>`
						+ `<li>Click the ${del} to remove (or negate) the tag from your search box</li>`
						+ `<li>Click the tag itself to replace your search box contents with only that tag</li>`
						+ `<li>Click the ${save} to add the tag to your favourites list</li>`
						+ `<li>Click the ${unsave} to remove the tag from your favourites list</li>`
						+ `<li>Go to <a href="${editorLink}">the editor page</a> to edit your tags in text fields</li>`
						+ `<li>Click on the <tt>User Saved Tags</tt> header to show/hide your favourites list</li>`
						+ `</ul>`,
						`<p>Also, all changes to your favourite tags list are synchronised across tabs, so even if you have a dozen tabs open, they'll all keep up-to-date with any tags you add or remove, no matter where you do it.</p>`,
						'<h4><a name="overview">Overview</a></h4>',
						`<p>Welcome, presumably new user, to ${SCRIPT_TITLE}. This script is more of a general tag enhancer at this point, having grown from the original couple of hundred lines to about five times as long. The original (and main) purpose is to provide a list of your favourite or "pinned" tags in the sidebar, for quick and easy access.</p>`,
						`<p>To that end, all post index and post view pages now have an additional section in the sidebar, just below the tag search box. The tag list is collapsed on page load so as to avoid over-cluttering your sidebar, but clicking on the <tt>User Saved Tags</tt> header will toggle it open and closed.</p>`,
						`<p>For the sake of easier browsing, particularly with... ahem, only one hand, the sidebar tag links have all been overhauled as well. The ${wiki} link is unchanged and still directs you immediately to the wiki page, but the others now modify the contents of the tag search box instead of opening new pages.</p>`,
						`<p>Additionally, the ${add} and ${del} links are now somewhat more powerful/useful. If you go to negate (the ${del} button) a tag that is currently in your search box, the non-negated tag will be removed, but the negated one will not be added. If the tag is not currently present, the negated tag will be appended to your search. The same effect in reverse applies to the ${add} button as well.</p>`,
						`<p>Matching this, clicking a tag in the sidebar will completely replace the search query with the tag clicked, allowing you to start with only one tag and add/negate more as you please, before loading the search page. Finally, all internal links are rewritten to include the search query that you followed to reach that link. On search pages, this means that all post view page links will include the string you searched for, so that it can be preloaded into the search box on all available pages.</p>`,
						`<p>The pinned tag list should be easy to use - clicking the ${save} button next to a sidebar tag will add it to your saved list and change the button to display a ${unsave} instead, which will remove the tag and return the button to the ${save} symbol. When your tag list is changed, all open pages running this script will update to match, with one exception.</p>`,
						`<p>There is a rudimentary (the best available for a client-only script) <a href="${editorLink}">text-based editor page</a> for your pinned tags. All tags are separated into the five site categories: content, character, copyright, species, and artist. In practice, this is only to group and style the links in your pinned tags list according to the site's stylesheet. Unless you are manually editing your tag lists, the script will handle this for you.</p>`,
						`<p>On the manual editor page, there are five text areas, one for each category of tag. If you enter a non-existant tag, the script will not care. If you enter a tag into the wrong category, the script will not care. However, when your pinned tags are updated from another page, only editor boxes that are "in sync" with the saved content will automatically update to match. Any editor that has different content from the saved list will be left untouched and will display an "out of sync" warning, requiring you to choose whether to save it and lose other changes, or reset it and lose those changes.</p>`,
						`<p>Finally, on the manual editor page, you have three additional functions available: you can export your current tag list (all categories) as text, you can import a saved tags list from text and <b>replace</b> your current tags, or you can import from text and <b>amend</b> your current tags. Replacing your tags will delete all of your tags and replace them with the imported list. Amending will only add tags to your list that were in the imported list but not your own. Currently, this is all or nothing - you cannot export/import/amend only a specific category. This feature is planned for the future.</p>`,
						`<p>Thank you for installing ${SCRIPT_NAME}, and we hope it serves you well. If you have questions, feature requests, or bug reports, please report them to the <a href="https://github.com/PrincessRTFM/WebUtil/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc">issue tracker</a>.</p>`,
						/* eslint-enable max-len */
					]);
				}
				else if (slug.startsWith(EDITOR_PAGE_SLUG)) {
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
						const btnSave = $('<input type="button" class="save-taglist-editor" style="display: inline;" value="Save" />')
							.attr('id', `save-taglist-${type}`)
							.on('click', () => {
								loadUserTags()
									.then(cleanTagList)
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
						const btnReset = $('<input type="button" class="reset-taglist-editor" style="display: inline; float: right;" value="Reset" />')
							.attr('id', `reset-taglist-${type}`)
							.on('click', () => {
								loadUserTags()
									.then(cleanTagList)
									.then(usertags => {
										editor.val(
											usertags[type]
												.map(tag => normalise(tag)
													.replace(/\s+/gu, '_')
													.trim())
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
										.map(tag => normalise(tag)
											.replace(/\s+/gu, '_')
											.trim())
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
					const inputI = $('<input type="button" class="import-taglist-data" style="display: inline;" id="import-taglists" value="IMPORT" />')
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
										EMF.UTIL.error("Couldn't import tags, check your console for details");
										logger.error(error);
									}
								);
						});
					const inputA = $('<input type="button" class="amend-taglist-data" style="display: inline;" id="import-taglists" value="AMEND" />')
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
										EMF.UTIL.error("Couldn't amend tags, check your console for details");
										logger.error(error);
									}
								);
						});
					const inputO = $(
						'<input type="button" class="export-taglist-data" style="display: inline; float: right;" id="export-taglists" value="EXPORT" />'
					)
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
					registerUpdateHandler(() => {
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
				else {
					const tagSearchInput = $('input#tags');
					const searchboxExists = !!tagSearchInput.length;
					const wikiPageP = location.pathname.startsWith("/wiki/show");
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
							const searchableTag = normalise(tag).replace(/\s+/gu, '_');
							const negatedTagP = searchableTag.startsWith('-');
							const includeTag = negatedTagP
								? searchableTag.substr(1)
								: searchableTag;
							const excludeTag = `-${includeTag}`;
							const currentSearch = tagSearchInput.val();
							let currentTags = currentSearch
								.split(/\s+/u);
							if (negatedTagP) {
								logger.info(`Negating tag "${includeTag}" in search string "${currentTags.join(' ')}"`);
								if (currentTags.includes(excludeTag)) {
									logger.debug("Tag is already present and negated");
								}
								else if (currentTags.includes(includeTag)) {
									logger.debug("Tag is present, removing");
									currentTags = currentTags.filter(
										existingTag => normalise(existingTag).replace(/\s+/gu, '_') != includeTag
									);
								}
								else {
									logger.debug("Tag is not present, negating");
									currentTags.push(excludeTag);
								}
							}
							else {
								logger.info(`Applying tag "${includeTag}" to search string "${currentTags.join(' ')}"`);
								if (currentTags.includes(includeTag)) {
									logger.debug("Tag is already present");
								}
								else if (currentTags.includes(excludeTag)) {
									logger.debug("Tag is negated, removing");
									currentTags = currentTags.filter(
										existingTag => normalise(existingTag).replace(/\s+/gu, '_') != excludeTag
									);
								}
								else {
									logger.debug("Tag is not present, adding");
									currentTags.push(includeTag);
								}
							}
							const modifiedSearch = currentTags
								.join(' ')
								.replace(/\s+/gu, ' ')
								.trim();
							logger.debug(`Constructed new search string "${modifiedSearch}"`);
							tagSearchInput.val(modifiedSearch);
							if (typeof event == 'object') {
								if (typeof event.preventDefault == 'function') {
									event.preventDefault();
								}
								event.returnValue = false;
							}
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
						const wiki = $(`<a class="taglink taglink-wiki taglink-type-${type} taglink-wiki-${uriTag}">?</a>`)
							.attr('href', `/wiki/show?title=${uriTag}`);
						const add = $(`<a class="taglink taglink-append taglink-type-${type} taglink-append-${uriTag}">+</a>`)
							.attr('href', `/post/search?tags=${`${encodeURI(existingSearch)} ${uriTag}`.trim()}`)
							.on('click', e => addTagToSearchBox(targetTag, e));
						const remove = $(`<a class="taglink taglink-negate taglink-type-${type} taglink-negate-${uriTag}">–</a>`)
							.attr('href', `/post/search?tags=${`${encodeURI(existingSearch)} -${uriTag}`.trim()}`)
							.on('click', e => addTagToSearchBox(`-${targetTag}`, e));
						const remember = $(`<a class="taglink taglink-remember taglink-type-${type} taglink-remember-${
							uriTag
								.replace(/%../gu, '_')
								.replace(/\W+/gu, '_')
						}"></a>`)
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
											$(`.taglink.taglink-remember.taglink-remember-${
												technify(tag)
													.replace(/%../gu, '_')
													.replace(/\W+/gu, '_')
											}`)
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
											$(`.taglink.taglink-remember.taglink-remember-${
												technify(tag)
													.replace(/%../gu, '_')
													.replace(/\W+/gu, '_')
											}`)
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
						remember[0].dataset.tag = targetTag.replace(/\s+/gu, '_');
						remember[0].dataset.type = type;
						searchForTag(targetTag, type).then(
							() => remember.addClass("usertag-saved").removeClass("usertag-unsaved"),
							() => remember.addClass("usertag-unsaved").removeClass("usertag-saved")
						);
						const isolate = $(`<a class="taglink taglink-isolate taglink-type-${type}">TAG</a>`)
							.text(targetTag)
							.attr('href', `/post/search?tags=${uriTag}`);
						if (searchboxExists) {
							isolate.on('click', e => {
								tagSearchInput.val(targetTag.replace(/\s+/gu, '_'));
								if (e.preventDefault) {
									e.preventDefault();
								}
								e.returnValue = false;
								return false;
							});
						}
						return searchboxExists
							? [
								wiki,
								' ',
								add,
								' ',
								remove,
								' ',
								remember,
								' ',
								isolate,
							]
							: [
								wiki,
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
									.each(async (i, e) => {
										if (usertags[e.dataset.type].includes(e.dataset.tag)) {
											e.classList.remove("usertag-unsaved");
											e.classList.add("usertag-saved");
										}
										else {
											e.classList.remove("usertag-saved");
											e.classList.add("usertag-unsaved");
										}
									});
								return usertags;
							})
							.then(assembleTagList);
					};
					savedTagsTogglableContent.append(savedTagsList, savedTagsEmptyWarning);
					if (wikiPageP) {
						GM_addStyle([
							'.taglink.taglink-remember.usertag-saved::after {',
							'content: "[unsave]";',
							'float: right;',
							'}',
							'.taglink.taglink-remember.usertag-unsaved::after {',
							'content: "[save]";',
							'float: right;',
							'}',
						].join("\n"));
					}
					else {
						GM_addStyle([
							'.taglink.taglink-remember.usertag-saved::after {',
							`content: "$";`,
							'}',
							'.taglink.taglink-remember.usertag-unsaved::after {',
							`content: "#";`,
							'}',
						].join("\n"));
					}
					// debugger;
					if (location.pathname.startsWith('/post/show/')) {
						GM_addStyle([
							'span.tag-header-count {',
							'color: #888888;',
							'}',
						].join("\n"));
						logger.info(`Existing search ${existingSearch ? `found: ${existingSearch}` : 'not found'}`);
						const originalTitle = document.title;
						const postID = location.pathname.substr('/post/show/'.length);
						document.title = `#${postID}: ${originalTitle}`;
						tagSearchInput.val(existingSearch);
						const noticeBox = $('<div class="status-notice" style="padding: .5em;" id="uscript-this-post"></div>');
						$('div.status-notice').prependTo('.sidebar');
						$('.sidebar').prepend(noticeBox);
						const thisPost = $('<p></p>');
						const postImage = $('#image');
						const br = '<br />';
						const uriClean = location.href.substring(0, location.href.length - location.search.length);
						const uriDirty = location.href;
						const uriImage = $('#highres').attr('href')
							|| postImage.attr('src');
						const linkClean = $(`<a class="eust-no-munge-href" href="${uriClean}"></a>`);
						const linkDirty = $(`<a href="${uriDirty}"></a>`);
						const linkImage = $(`<a href="${uriImage}"></a>`);
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
						postImage.on('dblclick', () => {
							location.assign(uriImage);
						});
						TAG_TYPES.forEach(tagType => {
							const tagHeader = $(`ul#tag-sidebar > li#category-${tagType}, ul#tag-sidebar > li#category-hidden-${tagType}`);
							const tagCount = $(`ul#tag-sidebar > li.tag-type-${tagType}`).length;
							tagHeader.append(' ', `<span class="tag-header-count tag-count-${tagType}">[${tagCount}]</span>`);
						});
					}
					else if (location.pathname.startsWith('/tag/index') || location.pathname == '/tag') {
						$('div#content table tbody tr td[class*="tag-type-"]').each((i, e) => {
							try {
								const type = Array.from(e.classList).filter(s => s.startsWith("tag-type-"))[0].substr(9);
								if (TAG_TYPES.includes(type)) {
									const line = generateTagLineElements(e.innerText.trim(), type);
									$(e)
										.empty()
										.append(line);
								}
							}
							catch (ex) {
								logger.error(ex);
							}
						});
					}
					else if (wikiPageP) {
						const titleLine = $('#wiki-show > h2.title');
						const [ tagType, tagText ] = titleLine
							.text()
							.trim()
							.toLowerCase()
							.split(/\s*:\s*/u);
						if (tagType && tagText && TAG_TYPES.includes(tagType)) {
							const toggleLink = generateTagLineElements(tagText, tagType).slice(-3, -2);
							if (toggleLink) {
								titleLine.append(toggleLink);
							}
						}
					}
					if (existingSearch) {
						$('a[href]')
							.each(async (i, elem) => {
								if (elem.classList.contains("eust-no-munge-href")) {
									return;
								}
								const href = new URL(elem.href, location.origin);
								if (href.host == location.host && href.pathname.startsWith("/post/show/")) {
									href.searchParams.set("last", existingSearch);
									elem.href = href;
								}
							});
					}
					savedTagsDiv.append(savedTagsHeader, savedTagsTogglableContent);
					tagSearchDiv.after(savedTagsDiv);
					if (tagSearchContainer.length) {
						tagSearchInput
							.css('width', tagSearchContainer[0].getWidth() - (tagSearchContainer[0].getHeight() + 10))
							.val(existingSearch);
						tagSearchContainer.append(
							$(`<input type="button" id="tagsearch-go-button"/>`)
								.css('width', tagSearchContainer[0].getHeight())
								.css('min-width', tagSearchContainer[0].getHeight())
								.css('height', tagSearchContainer[0].getHeight())
								.css('min-height', tagSearchContainer[0].getHeight())
								.val('→')
								.on('click', () => {
									const tags = tagSearchInput
										.val()
										.replace(/\s+/gu, ' ')
										.trim();
									if (tags.length) {
										location.assign(`/post/index/1/${tags}`);
									}
									else {
										location.assign('/post');
									}
								})
						);
					}
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
					registerUpdateHandler(redrawScriptContent);
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
	emfCheck.then(scriptCore, error => logger.error("Failed to initialise:", error));
})(window, window.jQuery || window.$ || jQuery || $, unsafeWindow);

