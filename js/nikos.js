/* eslint-env browser, jquery */
$(() => {
	const HELP_TEXT = Object.freeze({
		'#message': "Write a message here to display in the dialogue box with Niko's face.",
		'#faces': "Pick an expression for Niko to make, to accompany your message!",
		'#photoshop': "This is the canvas where the composite image is actually drawn. Right click to save it or copy as an image now.",
		'#render': "This is the fully-rendered image, built off the canvas from the composite elements. You can save it or copy to use now.",
	});
	const FACES = Object.freeze([
		'niko',
		'niko2',
		'niko3',
		'niko4',
		'niko5',
		'niko6',
		'niko_83c',
		'niko_blush',
		'niko_cry',
		'niko_disgusted',
		'niko_distressed',
		'niko_distressed_cry',
		'niko_distressed_talk',
		'niko_distressed2',
		'niko_eyeclosed',
		'niko_eyeclosed_sigh',
		'niko_gasmask',
		'niko_less_sad',
		'niko_oof',
		'niko_ouch',
		'niko_pancakes',
		'niko_sad',
		'niko_shock',
		'niko_shocked',
		'niko_smile',
		'niko_speak',
		'niko_surprise',
		'niko_thinking',
		'niko_upset',
		'niko_upset_meow',
		'niko_upset2',
		'niko_what',
		'niko_what2',
		'niko_wink',
		'niko_winkc',
		'niko_wtf',
		'niko_wtf2',
		'niko_xwx',
		'niko_yawn',
	]);
	const initialHelpText = $('#helpText').html();
	let unhelpTimer = false;
	const setHelpText = function(text) {
		if (typeof unhelpTimer != 'boolean') {
			clearTimeout(unhelpTimer);
		}
		$('#helpText').html(text || initialHelpText);
	};
	const startClearHelpTimer = function() {
		unhelpTimer = setTimeout(setHelpText, 500);
	};
	const help = (selector, text) => $(selector).hover(setHelpText.bind(setHelpText, text), startClearHelpTimer);
	$('.soften, textarea').addClass('ui-corner-all');
	const error = $('#errortext');
	const canvas = document.getElementById('photoshop');
	const draw = canvas.getContext('2d');
	const image = document.getElementById('render');
	const background = new Image();
	const message = document.getElementById('message');
	const refreshRender = () => {
		const MAX_LINE_LENGTH = 465;
		draw.clearRect(0, 0, canvas.width, canvas.height);
		if (background.complete) {
			draw.drawImage(background, 0, 0);
		}
		else {
			return;
		}
		// Render the chosen FACE at X=496 Y=16
		if (document.getElementById('selected')) {
			try {
				draw.drawImage(document.getElementById('selected'), 496, 16);
			}
			catch (e) {
				console.error(e);
				console.dir(document.getElementById('selected'));
			}
		}
		// Render the text from X=20 Y=17 to X=485 (465px)
		if (message.value) {
			const lines = message.value.split("\n");
			for (let lineNo = 0; lineNo < lines.length; lineNo++) {
				if (lineNo >= 3) {
					error.show();
					break;
				}
				else {
					error.hide();
				}
				let line = lines[lineNo];
				if (draw.measureText(line).width > MAX_LINE_LENGTH) {
					const words = line.split(/\s/u);
					for (let word = words.length; word > 0; word--) {
						const left = words.slice(0, word).join(" ");
						if (draw.measureText(left).width <= MAX_LINE_LENGTH) {
							line = left;
							lines.splice(lineNo + 1, 0, words.slice(word).join(" "));
							break;
						}
					}
				}
				draw.fillText(line, 20, 17 + lineNo * 28, MAX_LINE_LENGTH);
			}
		}
		else {
			error.hide();
		}
		// See if we can render it to a proper image element, so people can select it on mobile and all browsers (IE is not a browser, do not complain about it being broken)
		try {
			image.src = canvas.toDataURL();
			image.style.display = 'block';
			canvas.style.display = 'none';
		}
		catch (e) {
			image.style.display = 'none';
			canvas.style.display = 'block';
		}
	};
	const faceList = $('#faces');
	FACES.forEach(filename => {
		const face = $(`<img class="face" src="img/expressions/${filename}.png" />`);
		faceList.append(face);
	});
	draw.font = '20pt TerminusTTF';
	draw.textBaseline = 'top';
	draw.fillStyle = '#ffffff';
	background.addEventListener('load', refreshRender, false);
	background.src = "img/niko-background.png";
	faceList.children('img').on('click', function setExpression() {
		$('.face#selected').attr('id', '');
		this.id = 'selected';
		refreshRender();
	});
	message.addEventListener('input', refreshRender);
	message.focus();
	for (const selector in HELP_TEXT) {
		if (Object.prototype.hasOwnProperty.call(HELP_TEXT, selector)) {
			help(selector, HELP_TEXT[selector]);
		}
	}
});

