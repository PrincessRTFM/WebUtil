const insertTextAtCursor = (elem, text, highlightP) => {
	elem.focus();
	const successP = document.execCommand("insertText", false, text);
	// Firefox uses (used?) a non-standard method - the insertText command doesn't (didn't?) work for it
	if (!successP && typeof elem.setRangeText == "function") {
		const start = elem.selectionStart;
		elem.setRangeText(text);
		elem.selectionEnd = start + text.length;
		elem.selectionStart = highlightP
			? start
			: elem.selectionEnd;
		const e = document.createEvent("UIEvent");
		e.initEvent("input", true, false);
		elem.dispatchEvent(e);
	}
};
const blockEvent = evt => {
	evt.preventDefault();
	evt.stopPropagation();
	evt.returnValue = false;
	return false;
};
(() => {
	const input = document.querySelector("#lined");
	const output = document.querySelector("#collapsed");
	const link = document.querySelector('#multireddit');
	const getSortedEntries = () => {
		const seen = Object.create({});
		return input
			.value
			.trim()
			.split(/\W+/u)
			.filter(entry => {
				const filterString = entry.toLowerCase().trim();
				if (!filterString) {
					return false;
				}
				if (seen[filterString]) {
					return false;
				}
				seen[filterString] = true;
				return true;
			})
			.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
	};
	const munge = () => {
		const entries = getSortedEntries();
		input.value = entries.join("\n");
		output.value = entries.join("+");
		location.hash = output.value;
		if (output.value) {
			link.href = `https://www.reddit.com/r/${output.value}`;
			link.style.display = 'inline';
		}
		else {
			link.href = "#";
			link.style.display = 'none';
		}
	};
	const dragStartHandler = evt => {
		evt.target.addClass("dropping");
		return blockEvent(evt);
	};
	const dragStopHandler = evt => {
		evt.target.removeClass("dropping");
		return blockEvent(evt);
	};
	let reader = new FileReader();
	reader.addEventListener('load', evt => {
		input.value = evt.target.result;
	});
	reader.addEventListener('error', evt => {
		console.error(evt);
	});
	reader.onloadend = () => {
		reader = new FileReader();
	};
	input.addEventListener('dragenter', dragStartHandler);
	input.addEventListener('dragover', dragStartHandler);
	input.addEventListener('dragleave', dragStopHandler);
	input.addEventListener('drop', evt => {
		const files = Array.from(evt.originalEvent.dataTransfer.files);
		if (!files.length) {
			return true;
		}
		const file = files[0];
		console.dir(file);
		input.value = '';
		reader.readAsText(file);
		return dragStopHandler(evt);
	});
	document.addEventListener('keydown', evtKeyDown => {
		const ctrl = evtKeyDown.ctrlKey;
		const compareKey = evtKeyDown.key.toLowerCase();
		if (ctrl && compareKey == 'o') {
			const picker = document.createElement('input');
			picker.type = 'file';
			picker.addEventListener('change', evtFileChanged => {
				if (!evtFileChanged.target.files.length) {
					console.log("File selector says no file was chosen");
					return;
				}
				const file = evtFileChanged.target.files[0];
				reader.readAsText(file);
			});
			picker.click();
			return blockEvent(evtKeyDown);
		}
		else if (ctrl && compareKey == 's') {
			munge();
			output.focus();
			output.select();
			document.execCommand("copy");
			output.blur();
			return blockEvent(evtKeyDown);
		}
		return true;
	});
	document.addEventListener('paste', evt => {
		try {
			const text = (evt.clipboardData || window.clipboardData).getData('text/plain').trim();
			if (text) {
				input.value += `\n${text}`;
				input.focus();
				input.blur();
			}
		}
		catch (err) {
			console.error("Couldn't handle paste event:", err);
		}
		return blockEvent(evt);
	}, {
		capture: true,
	});
	document.addEventListener('dragenter', blockEvent);
	document.addEventListener('dragover', blockEvent);
	document.addEventListener('dragleave', blockEvent);
	document.addEventListener('drop', blockEvent);
	input.addEventListener('blur', munge);
	output.addEventListener('focus', () => output.select());
	const initialInput = (location.hash || '')
		.replace(/^[#\/]+/u, '')
		.replace(/^r\//ui, '')
		.replace(/\/*(?:#.*)?$/u, '');
	if (initialInput) {
		location.hash = initialInput;
		input.value = initialInput;
		munge();
	}
})();
