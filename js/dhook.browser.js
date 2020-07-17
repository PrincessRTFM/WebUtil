/* global Discord */

/* eslint-disable max-len */
const HELP_TEXT = Object.freeze({
	'.trigger-hook': "If you haven't got any problems, clicking this will post your content to the given webhook.",
	'#hookId': "You need to enter a valid webhook ID/token here, or just paste the hook URL that Discord gives you.<br /><br /><b>Protip:</b> you can set the <i>document hash</i> or <i>fragment</i> to the hook ID/token and when you load the page, it'll be automatically filled in here!",
	"#hookStatus": "Niko is a Very Good Kitty. Even though Niko's not a cat. But Niko <i>is</i> here to help you check if the entered webhook target is valid!",
	'#overrideUsername': "If you put a new username in here, it'll be used for the display name of the webhook without actually <i>changing</i> the configured webhook on the server. If you leave it blank, it'll just be whatever the server's got it configured to be.",
	'#overrideAvatar': "Like the username override, you can put a URL here to use as the avatar for the webhook without reconfiguring it. Leave it blank to use the default.",
	'#plainMessage': "You can put anything here that you could put into Discord itself. This will be sent like a regular user message, and markdown formatting will be processed and rendered.",
	'#embedTitle': "Rich embeds allow for a number of different parts. The title goes at the top, just <i>below</i> the author (if one exists) and above the content. It supports markdown formatting, but it's only one line, and it'll always be in bold too.",
	'#embedURL': "The title of the embed will be turned into a link to this URL if it's provided. If there's no title, this is useless.",
	'#embedText': "This is where the main content for the embed goes. Markdown is supported here, and you can write whatever you like.",
	'#embedThumbnail': "This needs to be a valid HTTP/HTTPS URL, and shows a thumbnail-sized image to the right of the main content in the embed.",
	'#embedVideo': "This needs to be a valid HTTP/HTTPS URL, and is expected to be a video source to show an inline player for within the embed.",
	'#embedImage': "This needs to be a valid HTTP/HTTPS URL, and will be taken as an image to show <i>below</i> the main content in the embed, a good deal bigger than the thumbnail. You can use both this and a thumbnail together, with the same URL or with two different ones.",
	'#embedAuthorName': "You can provide an author for this message, and it'll render the author's name and icon (if provided) just <i>above</i> the embed title, in bold. It's the same style as the title is, actually.",
	'#embedAuthorURL': "The author's name can be given a separate link from the title, but it must be a valid HTTP/HTTPS URL! And if there isn't any author, this is useless.",
	'#embedAuthorIcon': "The author icon will be rendered (very small) to the left of their name in a circle.",
	'#embedFooter': "The footer is displayed in faded grey and slightly smaller text at the bottom of the embed, after the content - text, image, video, whatever.",
	'#embedFooterIcon': "The footer icon is displayed in a small circle to the left of the footer text.",
	'#embedColour': "Use the colour picker or a hex code to set the colour you want the embed to be. It'll be displayed as a thin stripe on the left side.",
});
/* eslint-enable max-len */

const LOAD_EVENT = 'DOMContentLoaded'; // DOMContentLoaded for page structure, load for all CONTENT loaded
const HOOKPING_SUCCESS = 'img/webhook-found.png';
const HOOKPING_ERROR = 'img/webhook-error.png';
const HOOKPING_IDLE = 'img/webhook-waiting.png';
const HOOKPING_CHECKING = 'img/webhook-checking.png';
const HELPTEXT_TIMEOUT = 500;
const HTMLCLASS_ERROR = 'state-error';
const HTMLCLASS_WARN = 'state-warn';
const HTMLCLASS_OKAY = 'state-okay';
const DEFAULT_SECTION_IDX = 2;

function listen(target, event, handler, singular = false) {
	return target.addEventListener(event, handler, {
		once: singular,
	});
}
function once(...args) {
	return listen(...args, true);
}
function elem(selector) {
	return document.querySelector(selector);
}
function elemAll(selector) {
	return document.querySelectorAll(selector);
}

function extractEndpoint(hookText) {
	const given = String(hookText).trim();
	const m = given
		.replace(/^https?:\/\/([a-z]+\.)?discordapp\.com\/api\/webhooks\//ui, '')
		.replace(/^https?:\/\/([a-z]+\.)?discord\.com\/api\/webhooks\//ui, '')
		.match(/^([^/]+)\/(.+)$/u);
	if (m) {
		return m.slice(1, 3).join('/');
	}
	return '';
}
function validateTextAsURL(text) {
	return String(text)
		.trim()
		.match(/^https?:\/\/[\w-]+(?:\.[\w-]+)+(:\d+)?([/#].*)?$/ui);
}
function validateInputAsURL(element) {
	return validateTextAsURL(element.value || element.textContent);
}

once(window, LOAD_EVENT, () => {
	const hookPingStatus = document.querySelector('#hookStatus');
	const initialHelpText = elem('#helpText').innerHTML;
	const hookInputBox = elem('#hookId');
	const avatarOverrideBox = elem('#overrideAvatar');
	const avatarPreview = elem('#avatarPreview');
	const usernameOverrideBox = elem('#overrideUsername');
	const usernamePreview = elem('#usernamePreview');
	const sections = elemAll('#interface > .sect');
	const messageBox = elem('#plainMessage');
	const resultBox = elem('#transmissionResult');
	const embed = {
		title: elem('#embedTitle'),
		url: elem('#embedURL'),
		description: elem('#embedText'),
		thumbnail: elem('#embedThumbnail'),
		video: elem('#embedVideo'),
		image: elem('#embedImage'),
		authorName: elem('#embedAuthorName'),
		authorURL: elem('#embedAuthorURL'),
		authorIcon: elem('#embedAuthorIcon'),
		footer: elem('#embedFooter'),
		footerIcon: elem('#embedFooterIcon'),
		colour: elem('#embedColour'),
	};
	let hookshot; // This will be the Discord.WebhookClient object
	let webhookNameCache = '';
	let webhookAvatarURL = '';
	let unhelpTimer = false;
	const setHelpText = text => {
		if (typeof unhelpTimer != 'boolean') {
			clearTimeout(unhelpTimer);
		}
		elem('#helpText').innerHTML = text || initialHelpText;
	};
	const startClearHelpTimer = () => {
		unhelpTimer = setTimeout(setHelpText, HELPTEXT_TIMEOUT);
	};
	const help = (selector, text) => {
		const e = elem(selector);
		listen(e, 'mouseenter', setHelpText.bind(setHelpText, text));
		listen(e, 'mouseleave', startClearHelpTimer);
	};
	const checkForWellFormedHook = () => {
		const given = hookInputBox.value;
		const hook = extractEndpoint(given);
		if (hook) { // well-formed content
			hookPingStatus.src = HOOKPING_IDLE;
			if (given != hook) {
				hookInputBox.value = hook;
			}
			hookInputBox.classList.remove(HTMLCLASS_ERROR, HTMLCLASS_OKAY);
			hookInputBox.classList.add(HTMLCLASS_WARN);
			return true;
		}
		if (given) { // badly formed content
			hookInputBox.classList.remove(HTMLCLASS_WARN, HTMLCLASS_OKAY);
			hookInputBox.classList.add(HTMLCLASS_ERROR);
			hookPingStatus.src = HOOKPING_ERROR;
		}
		else { // NO content
			hookInputBox.classList.remove(HTMLCLASS_ERROR, HTMLCLASS_WARN, HTMLCLASS_OKAY);
			hookPingStatus.src = HOOKPING_IDLE;
		}
		return false;
	};
	const updateWebhookPreviewDetails = () => {
		usernamePreview.textContent = usernameOverrideBox.value || webhookNameCache || (
			hookInputBox.value
				? '<checking...>'
				: '<waiting...>'
		);
		const avatarURL = validateInputAsURL(avatarOverrideBox)
			? avatarOverrideBox.value
			: webhookAvatarURL;
		if (avatarURL) {
			avatarPreview.src = `${avatarURL}?size=256`;
		}
		else {
			avatarPreview.style.display = 'none';
		}
	};
	const checkForValidEndpoint = () => {
		const given = hookInputBox.value;
		const hook = extractEndpoint(given);
		updateWebhookPreviewDetails();
		if (hook) { // well-formed content
			if (!(hookshot && hook == `${hookshot.id}/${hookshot.token}`)) { // new hook!
				hookPingStatus.src = HOOKPING_CHECKING;
				const req = new XMLHttpRequest();
				listen(req, 'load', () => {
					if (req.status >= 200 && req.status < 300) {
						// hook exists!
						hookshot = new Discord.WebhookClient(hook);
						const resp = JSON.parse(req.responseText);
						try {
							webhookNameCache = resp.name;
						}
						catch (err) {
							webhookNameCache = `<error!> ${err}`.trim();
						}
						try {
							webhookAvatarURL = `https://cdn.discordapp.com/avatars/${resp.id}/${resp.avatar}.png`;
						}
						catch (err) {
							webhookAvatarURL = '';
						}
						hookInputBox.classList.remove(HTMLCLASS_ERROR, HTMLCLASS_WARN);
						hookInputBox.classList.add(HTMLCLASS_OKAY);
						location.hash = hook;
						hookPingStatus.src = HOOKPING_SUCCESS;
						updateWebhookPreviewDetails();
					}
					else {
						// nope :c
						hookInputBox.classList.remove(HTMLCLASS_WARN, HTMLCLASS_OKAY);
						hookInputBox.classList.add(HTMLCLASS_ERROR);
						hookPingStatus.src = HOOKPING_ERROR;
					}
				});
				listen(req, 'error', () => {
					// something broke :c
					hookInputBox.classList.remove(HTMLCLASS_WARN, HTMLCLASS_OKAY);
					hookInputBox.classList.add(HTMLCLASS_ERROR);
					hookPingStatus.src = HOOKPING_ERROR;
				});
				req.open(
					"GET",
					`https://cors-anywhere.herokuapp.com/https://www.discord.com/api/webhooks/${hook}`
				);
				req.send();
			}
		}
		else if (given) { // badly formed content
			hookInputBox.classList.remove(HTMLCLASS_WARN, HTMLCLASS_OKAY);
			hookInputBox.classList.add(HTMLCLASS_ERROR);
			hookPingStatus.src = HOOKPING_ERROR;
		}
		else { // NO content
			hookInputBox.classList.remove(HTMLCLASS_ERROR, HTMLCLASS_WARN, HTMLCLASS_OKAY);
			hookPingStatus.src = HOOKPING_IDLE;
		}
	};
	const fireHookshotPewPew = evt => {
		const payload = {};
		if (usernameOverrideBox.value) {
			payload.username = usernameOverrideBox.value;
		}
		if (avatarOverrideBox.value) {
			payload.avatarURL = avatarOverrideBox.value;
		}
		if (Object.values(embed).filter(e => e.value).length) { // there's SOMETHING in the embed at least
			payload.embeds = [new Discord.RichEmbed()];
			for (const prop of [
				'title',
				'url',
				'description',
			]) {
				if (embed[prop].value) {
					payload.embeds[0][prop] = embed[prop].value;
				}
			}
			if (embed.authorName.value) {
				payload.embeds[0].setAuthor(
					embed.authorName.value,
					embed.authorIcon.value || void 0,
					embed.authorURL.value || void 0
				);
			}
			if (embed.colour.value) {
				payload.embeds[0].setColor(embed.colour.jscolor.toHEXString());
			}
			if (embed.footer.value) {
				payload.embeds[0].setFooter(
					embed.footer.value,
					embed.footerIcon.value || void 0
				);
			}
			if (embed.image.value) {
				payload.embeds[0].setImage(embed.image.value);
			}
			if (embed.thumbnail.value) {
				payload.embeds[0].setThumbnail(embed.thumbnail.value);
			}
		}
		console.dir(payload);
		resultBox.textContent = "Sending your message...";
		hookshot
			.send(messageBox.value, payload)
			.then(
				() => {
					// :D
					resultBox.textContent = "Your message was sent successfully!";
					return true;
				},
				err => {
					// :c
					let ohnoes = 'Your message failed to send';
					if (err) {
						ohnoes += `: ${err}`;
					}
					else {
						ohnoes += ", but I don't know why!";
					}
					resultBox.textContent = ohnoes;
					return false;
				}
			)
			.catch(console.err);
		try {
			evt.target.blur();
		}
		catch (err) {
			// nop
		}
	};
	const updateHookTargetFromHash = () => {
		if (location.hash.length > 1) {
			for (const closing of sections) {
				closing.classList.remove('active');
			}
			sections[0].classList.add('active');
			hookInputBox.value = location.hash.replace(/^#/u, '');
			if (checkForWellFormedHook()) {
				checkForValidEndpoint();
			}
		}
	};
	// End of variable/constant registration, begin event handler registration...
	listen(hookInputBox, 'input', checkForWellFormedHook);
	listen(hookInputBox, 'blur', checkForValidEndpoint);
	listen(avatarPreview, 'load', evt => {
		evt.target.style.display = 'block';
		avatarOverrideBox.classList.remove(HTMLCLASS_ERROR, HTMLCLASS_WARN);
		if (avatarOverrideBox.value) {
			avatarOverrideBox.classList.add(HTMLCLASS_OKAY);
		}
	});
	listen(avatarPreview, 'error', evt => {
		evt.target.style.display = 'none';
		avatarOverrideBox.classList.remove(HTMLCLASS_WARN, HTMLCLASS_OKAY);
		if (avatarOverrideBox.value) {
			avatarOverrideBox.classList.add(HTMLCLASS_ERROR);
		}
	});
	elemAll('input[type="text"].url').forEach(box => {
		// for ALL input boxes that take URLs, check only that they're well formed
		// checking they EXIST is not our job
		listen(box, 'input', () => {
			if (validateInputAsURL(box)) {
				box.classList.remove(HTMLCLASS_ERROR);
				box.classList.add(HTMLCLASS_OKAY);
			}
			else if (box.value) {
				box.classList.add(HTMLCLASS_ERROR);
				box.classList.remove(HTMLCLASS_OKAY);
			}
			else {
				box.classList.remove(HTMLCLASS_ERROR, HTMLCLASS_OKAY);
			}
		});
		// if you wanna do any special handling, listen to the `urlvalid` event (or the other two)
		listen(box, 'blur', () => {
			if (validateInputAsURL(box)) {
				box.dispatchEvent(new Event('urlvalid'));
			}
			else if (box.value) {
				box.dispatchEvent(new Event('urlinvalid'));
			}
			else {
				box.dispatchEvent(new Event('urlempty'));
			}
		});
	});
	listen(avatarOverrideBox, 'urlvalid', updateWebhookPreviewDetails);
	listen(avatarOverrideBox, 'urlinvalid', updateWebhookPreviewDetails);
	listen(avatarOverrideBox, 'urlempty', updateWebhookPreviewDetails);
	listen(usernameOverrideBox, 'input', updateWebhookPreviewDetails);
	elemAll('.trigger-hook').forEach(e => listen(e, 'click', fireHookshotPewPew));
	listen(window, 'hashchange', updateHookTargetFromHash);
	// End of event handler registration, begin initialisation...
	updateWebhookPreviewDetails();
	for (const section of sections) {
		const headerLink = section.querySelector('h2');
		listen(headerLink, 'click', () => {
			if (section.classList.contains('active')) { // open the "default" one
				for (const closing of sections) { // this can't go outside the checks or it breaks them :/
					closing.classList.remove('active');
				}
				sections[DEFAULT_SECTION_IDX].classList.add('active');
			}
			else { // open this one
				for (const closing of sections) {
					closing.classList.remove('active');
				}
				section.classList.add('active');
			}
		});
	}
	updateHookTargetFromHash();
	sections[0].classList.add('active');
	elemAll('input[type="text"]').forEach(box => {
		listen(box, 'keydown', evt => {
			if (evt.key.toLowerCase() == 'enter') {
				evt.stopPropagation();
				evt.preventDefault();
				box.blur();
			}
		});
		box.autocomplete = 'no';
	});
	for (const selector in HELP_TEXT) {
		if (Object.prototype.hasOwnProperty.call(HELP_TEXT, selector)) {
			help(selector, HELP_TEXT[selector]);
		}
	}
});

