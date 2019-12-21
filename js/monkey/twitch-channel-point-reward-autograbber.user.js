// ==UserScript==
// @name         Twitch Channel Point Reward Autograbber
// @namespace    Lilith
// @version      1.0.0
// @description  Automatically clicks the channel points reward chest whenever it shows up (checks every two seconds)
// @author       PrincessRTFM
// @match        https://www.twitch.tv/*
// @grant        GM_info
// @updateURL    https://gh.princessrtfm.com/js/monkey/twitch-channel-point-reward-autograbber.user.js
// ==/UserScript==


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

