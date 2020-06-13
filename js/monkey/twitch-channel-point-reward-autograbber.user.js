/* eslint-disable max-len */
// ==UserScript==
// @name         Twitch Channel Point Reward Autograbber
// @namespace    PrincessRTFM
// @version      1.0.0
// @description  Automatically clicks the channel points reward chest whenever it shows up (checks every two seconds)
// @author       Lilith Song <lilith@princessrtfm.com>
// @match        https://www.twitch.tv/*
// @updateURL    https://gh.princessrtfm.com/js/monkey/twitch-channel-point-reward-autograbber.user.js
// ==/UserScript==
/* eslint-enable max-len */


setInterval(() => {
	const chest = document.querySelector('.claimable-bonus__icon');
	if (chest) {
		try {
			chest.click();
		}
		catch (err) {
			console.error(err);
		}
	}
}, 2000);

