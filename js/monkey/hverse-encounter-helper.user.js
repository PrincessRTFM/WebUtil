/* eslint-disable max-len */
// ==UserScript==
// @name         HentaiVerse Encounter Unclicker
// @namespace    PrincessRTFM
// @version      3.1.1
// @description  Massively improves the useability/interface of the HentaiVerse random encounters system; tracks the time since the last event (and what it was), automatically opens random encounters, synchronises display updates, safe to open in multiple tabs (and will update all tabs accordingly)
// @author       Lilith
// @match        https://e-hentai.org/*
// @updateURL    https://gh.princessrtfm.com/js/monkey/hverse-encounter-helper.user.js
// @grant        GM.openInTab
// @grant        GM.notification
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.min.js
// @require      http://princessrtfm.com/js/lib/moment-timer.js
// ==/UserScript==

/*
CHANGELOG:
v1.0.0 - initial release, just removes onclick onhandler
v1.1.0 - added timer since page opened
v1.2.0 - auto-opens in background tab
v1.3.0 - updates page title with timer, opens in foreground tab
v1.3.1 - page title update timer capitalises the first character if it's a letter
v1.3.2 - page title update timer includes the suffix 'ago'
v1.3.3 - fixed the tab opening, actually foregrounds now
v1.4.0 - timer is always injected, an event pane will be created saying that nothing has happened if no event was detected
v1.5.0 - implemented persistent tracking of the time of the last event
v1.6.0 - implemented cross-tab communication to handle events in other tabs, removed the popup notification
v1.7.0 - now tracks the last event text as well as time, so the persistent tracking display makes more sense
v1.7.1 - fixed the bug where opening a page with no event would smash the persistent storage of the event text
v1.7.2 - properly rewrote the "dawn of a new day" header to include the timer
v1.8.0 - title text now includes a short description of the last event detected, updating cross-tab
v1.9.0 - reverted to background tabs for the automatic link opening - the rest has changed enough that foregrounding is too annoying; if `#game` is added to URL, opens in current tab
v1.10.0 - shorten the time-since label in the title
v1.11.0 - cleans up the eventpane contents from "dawn of a new day" events
v2.0.0 - now operates on a master/slave system with BroadcastChannel messages to keep everything synchronised; foundation built for slave displays to not calc updates
v2.0.1 - no longer operates on the hentaiverse pages, BroadcastChannels are not cross-origin so each domain gets one master instance
v3.0.0 - un-stupified the backend (organic code growth is bad, kids)
v3.1.0 - added an "enter the hentaiverse" link on the event pane if there isn't one already
v3.1.1 - fixed a typo, cleaned the file, and bumped the version (forgot to set to 3.1.0)

PLANNED:
[MINOR] Make the master page post a notification (via GM.notification) when the timer runs out
[MAJOR] Use AJAX to get the news page and update the eventpane with the new content when the timer runs out
*/
/* eslint-enable max-len */

/* global GM_addValueChangeListener, jQuery, $, moment */

// SCRIPT INITIALISATION BEGINS \\

const SCRIPT_NAME = `${GM_info.script.name} V${GM_info.script.version || '???'}`;
const EVTPANE_CSS = [
	"width: 720px;",
	"height: auto;",
	"margin: 5px auto 0px;",
	"background: rgb(242, 239, 223);",
	"border: 1px solid rgb(92, 13, 18);",
	"padding: 3px;",
	"font-size: 9pt;",
	"text-align: center !important;",
];
const LAST_EVENT_TIMESTAMP_KEY = "lastEventTime";
const LAST_EVENT_NAME_KEY = "lastEventName";
const AUTO_OPEN_IN_BACKGROUND = true;
const PAGE_TITLE = `[$PERIOD.SHORT$ $EVENT.SHORT$] $STATUS$ E-Hentai`;
const HEADER_TEXT = `You $EVENT$ $PERIOD$ ago!`;
const EVENT_CHECKS = {
	NEW_DAY: /dawn.+?new\s+day/ui,
	RANDOM_FIGHT: /encountered\s+a\s+monster/ui,
};
const EVENT_LABELS = {
	NEW_DAY: "woke to a new day",
	RANDOM_FIGHT: "encountered a monster",
	NO_EVENT: "have been bored since",
};
const EVENT_TITLES = {
	NEW_DAY: "🌞",
	RANDOM_FIGHT: "💥",
	NO_EVENT: "❌",
};
const BUG_CHARS = Object.defineProperty([
	'💀',
	'💣',
	'💔',
	'💢',
	'💥',
	'❌',
	'🛑',
	'❗',
	'🐛',
	'🦟',
	'🦗',
	'🐜',
	'🐝',
], 'toString', {
	value() {
		let s = '';
		const bits = Array.from(this);
		for (let i = 0; i < 5; i++) {
			s += bits.splice(Math.floor(Math.random() * bits.length), 1);
		}
		return s;
	},
});

// SCRIPT CORE BEGINS \\

((window, $, moment) => {
	// eslint-disable-next-line no-extend-native
	Set.prototype.addAll = Set.prototype.addAll || function addAll(iterable) {
		Array.from(iterable).forEach(e => this.add(e));
	};
	const genid = () => ([1e7] + 1e3 + 4e3 + 8e3 + 1e11)
		.repeat(2)
		.replace(
			/[018]/gu,
			c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	const SCRIPT_ID = genid();
	const REGISTRY = new Set([SCRIPT_ID]);
	const RADIO = new BroadcastChannel(SCRIPT_NAME);
	const broadcast = (message, disguise) => RADIO.postMessage({
		source: disguise || SCRIPT_ID,
		event: message,
		known: Array.from(REGISTRY.values()),
	}); // So, you can lie about the source, for good reason! ...well, not GOOD reason.
	RADIO.INITIAL_PING = 'ENQ';
	RADIO.SET_SLAVE = 'SYN';
	RADIO.NEW_MASTER = 'EXCH';
	RADIO.INSTANCE_GONE = 'OO';
	RADIO.TICK = 'EXE';
	RADIO.initialise = () => {
		console.log(`${SCRIPT_ID} << ${RADIO.INITIAL_PING}`);
		broadcast(RADIO.INITIAL_PING);
	};
	RADIO.slaveToMe = () => {
		console.log(`${SCRIPT_ID} << ${RADIO.SET_SLAVE}`);
		broadcast(RADIO.SET_SLAVE);
	};
	RADIO.switchMaster = to => {
		console.log(`${SCRIPT_ID} << ${RADIO.NEW_MASTER} // ${to}`);
		broadcast(RADIO.NEW_MASTER, to);
	};
	RADIO.unloadSelf = () => {
		console.log(`${SCRIPT_ID} << ${RADIO.INSTANCE_GONE}`);
		broadcast(RADIO.INSTANCE_GONE);
	};
	RADIO.runSlaves = () => {
		console.log(`${SCRIPT_ID} << ${RADIO.TICK}`);
		broadcast(RADIO.TICK);
	};
	let MASTER_ID = SCRIPT_ID;
	let eventPane = $('#eventpane');
	let header;
	if (eventPane.length) {
		eventPane.css('height', 'auto');
		const eventLinks = eventPane.find('a[href]');
		eventLinks.each((i, e) => {
			const link = $(e);
			e.addEventListener('click', () => true);
			if (link.text().match(/\bfight\b/ui)) {
				if (location.hash == "#debug") {
					return;
				}
				if (location.hash == "#game") {
					location.replace(e.href);
				}
				else {
					GM.openInTab(e.href, AUTO_OPEN_IN_BACKGROUND);
				}
				link.hide();
			}
		});
		const lines = eventPane.children('p, div');
		header = lines.first();
	}
	else {
		GM_addStyle(`#eventpane {\n${EVTPANE_CSS.map(e => `\t${e}`).join("\n")}\n}`);
		eventPane = $('<div id="eventpane"></div>');
		header = $('<div style="font-size:10pt; font-weight:bold; padding:0px; margin:12px auto 2px"></div>');
		eventPane.append(header);
		eventPane.append('<div style="margin-top: 10px;"></div>');
		header.text(BUG_CHARS); // You shouldn't actually SEE this, so if you do...
		const news = $('#newsinner');
		const gallery = $('#nb');
		if (news.length) {
			news.first().prepend(eventPane);
		}
		else if (gallery.length) {
			gallery.after(eventPane);
		}
	}
	if (!eventPane
		.find('a[href]')
		.filter((i, e) => (e.href || '').toLowerCase().includes('hentaiverse.org'))
		.length
	) {
		eventPane.append('<p><a href="https://hentaiverse.org/">Enter the HentaiVerse</a></p>');
	}
	$('#nb a[href]').filter((i, e) => (e.href || '').toLowerCase().includes('hentaiverse.org'))
		.parents('#nb > *')
		.hide();
	if (!moment) {
		header.attr('title', 'Failed to load moment.js library').css('border-bottom', '2px dotted red');
		return;
	}
	const lastEvent = () => moment(GM_getValue(LAST_EVENT_TIMESTAMP_KEY, 0) || Date.now().valueOf());
	const expandTemplate = (tmpl, durationObj, eventKey) => {
		const durationStr = durationObj.humanize();
		return tmpl
			.replace(/\$PERIOD\$/gu, durationStr)
			.replace(
				/\$PERIOD.SHORT\$/gu,
				durationStr
					.replace(/^a\s+few\s+/ui, "0 ")
					.replace(/^an?\s+/ui, "1 ")
					.replace(/^(\d+)\s+([dhms]).*$/u, "$1$2")
			)
			.replace(/\$EVENT\$/gu, EVENT_LABELS[eventKey])
			.replace(/\$EVENT.SHORT\$/gu, EVENT_TITLES[eventKey])
			.replace(/\$STATUS\$/gu, MASTER_ID == SCRIPT_ID ? '👑' : '⛓')
			.replace(/^(.)(.+)$/u, (match, g1, g2) => g1.toUpperCase() + g2);
	};
	let start = lastEvent();
	let eventKey = GM_getValue(LAST_EVENT_NAME_KEY, 'NO_EVENT');
	const headerText = header.text();
	console.log(`Retrieved event header: ${headerText}`);
	for (const [
		key,
		value,
	] of Object.entries(EVENT_CHECKS)) {
		if (headerText.match(value)) {
			start = moment();
			eventKey = key;
			GM_setValue(LAST_EVENT_TIMESTAMP_KEY, start.valueOf());
			GM_setValue(LAST_EVENT_NAME_KEY, eventKey);
			break;
		}
	}
	GM_setValue(LAST_EVENT_TIMESTAMP_KEY, start.valueOf());
	GM_setValue(LAST_EVENT_NAME_KEY, eventKey);
	GM_addValueChangeListener(LAST_EVENT_TIMESTAMP_KEY, (key, oval, nval, remote) => {
		if (!remote) {
			return;
		} // Only care about changes in other tabs
		start = lastEvent();
	});
	GM_addValueChangeListener(LAST_EVENT_NAME_KEY, (key, oval, nval, remote) => {
		if (!remote) {
			return;
		} // Only care about changes in other tabs
		eventKey = GM_getValue(LAST_EVENT_NAME_KEY, eventKey);
	});
	const updateDisplay = () => {
		console.time("Display update time");
		const now = moment();
		const period = moment.duration(now.diff(start));
		header.text(expandTemplate(HEADER_TEXT, period, eventKey));
		document.title = expandTemplate(PAGE_TITLE, period, eventKey);
		if (period.asMinutes() >= 30 && !$('#hentaiverse-unclicker-reload').length) {
			header.after([
				'<div id="hentaiverse-unclicker-reload" style="margin-top: 10px;">',
				'A new encounter is ready! ',
				'<a href="javascript:window.location.reload()">',
				'Click to reload!',
				'</a></div>',
			].join(''));
		}
		else if (period.asMinutes() < 30) {
			$('#hentaiverse-unclicker-reload').remove();
		}
		console.timeEnd("Display update time");
	};
	const ticker = () => {
		updateDisplay();
		console.log("Transmitting update command to all slaves");
		RADIO.runSlaves();
	};
	updateDisplay();
	const timer = new moment.duration(30000).timer({
		loop: true,
		start: true,
	}, ticker);
	$(window).on('unload', () => {
		if (MASTER_ID == SCRIPT_ID) { // If we're the master and we're going away
			REGISTRY.delete(SCRIPT_ID); // So we can't pick ourselves
			// Send out an event with a fake source, to indicate to all slaved pages
			// that they need to reset their master id
			RADIO.switchMaster(REGISTRY.values().next().value);
		}
		else { // The master instance needs to remove us from the registry
			RADIO.unloadSelf();
		}
	});
	RADIO.addEventListener('message', msgevt => {
		const msgobj = msgevt.data;
		if (typeof msgobj != 'object') {
			return;
		}
		const msgSrc = msgobj.source;
		const msgEvt = msgobj.event;
		const msgAll = msgobj.known;
		console.log(`${msgSrc} >> ${msgEvt}`);
		switch (msgEvt) {
			case RADIO.INITIAL_PING:
				if (MASTER_ID == SCRIPT_ID) {
					console.log("Master instance pinged by new instance, registering");
					REGISTRY.add(msgSrc);
					console.dir(REGISTRY);
					console.log("Slaving new instance to self");
					RADIO.slaveToMe();
					ticker();
				}
				else {
					console.log("Pinged by new instance, ignored (not the master)");
				}
				break;
			case RADIO.SET_SLAVE:
				console.log("Return ping received, disabling local timer and slaving to master");
				timer.stop();
				MASTER_ID = msgSrc;
				break;
			case RADIO.NEW_MASTER: // The established master page unloaded, switch to the new one
				console.log("The king is dead... long live the king.");
				REGISTRY.delete(MASTER_ID); // Remove the now-dead page (if it was in there)
				MASTER_ID = msgSrc;
				REGISTRY.add(MASTER_ID);
				if (MASTER_ID == SCRIPT_ID) { // Are WE the new master?
					console.log("The prince has risen to power now!");
					timer.start(); // If so, start our timer
					REGISTRY.addAll(msgAll); // Load the registry details
					ticker(); // Update everybody
				}
				console.dir(REGISTRY);
				break;
			case RADIO.INSTANCE_GONE:
				REGISTRY.delete(msgSrc);
				if (MASTER_ID == SCRIPT_ID) {
					console.log("Instance terminated, removed from registry");
				}
				break;
			case RADIO.TICK:
				console.log("Received tick instruction, updating display");
				updateDisplay();
				break;
			default:
				console.error('Received unknown broadcast, this is probably a Bad Thing!');
				break;
		}
	});
	console.log("Sending inquisitive ping");
	RADIO.initialise();
})(window, window.jQuery || window.$ || jQuery || $, moment);
// END SCRIPT \\
