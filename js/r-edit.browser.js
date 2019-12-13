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
	const getSortedEntries = () => {
		const seen = Object.create({});
		return input
			.value
			.split(/\W+/u)
			.filter(entry => {
				const filterString = entry.toLowerCase();
				if (seen[filterString]) {
					return false;
				}
				seen[filterString] = true;
				return true;
			})
			.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
	};
	const mungeInput = () => {
		input.value = getSortedEntries().join("\n");
	};
	const mungeOutput = () => {
		output.value = getSortedEntries().join("+");
		output.select();
	};
	const dragStartHandler = evt => {
		evt.target.addClass("dropping");
		return blockEvent(evt);
	};
	const dragStopHandler = evt => {
		evt.target.removeClass("dropping");
		return blockEvent(evt);
	};
	for (const box of [ input, output ]) {
		let reader = new FileReader();
		reader.addEventListener('load', evt => {
			box.value = evt.target.result;
		});
		reader.addEventListener('error', evt => {
			console.error(evt);
		});
		reader.onloadend = () => {
			reader = new FileReader();
		};
		box.addEventListener('dragenter', dragStartHandler);
		box.addEventListener('dragover', dragStartHandler);
		box.addEventListener('dragleave', dragStopHandler);
		box.addEventListener('drop', evt => {
			const files = Array.from(evt.originalEvent.dataTransfer.files);
			if (!files.length) {
				return true;
			}
			const file = files[0];
			console.dir(file);
			box.value = '';
			reader.readAsText(file);
			return dragStopHandler(evt);
		});
		box.addEventListener('keydown', evtKeyDown => {
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
			else if (ctrl && compareKey == 'd') {
				box.value = '';
				return blockEvent(evtKeyDown);
			}
			else if (ctrl && compareKey == 's') {
				box.select();
				document.execCommand("copy");
				return blockEvent(evtKeyDown);
			}
			else if (compareKey == 'tab') {
				insertTextAtCursor(box, "\t");
				return blockEvent(evtKeyDown);
			}
			return true;
		});
		Object.defineProperty(box, 'toString', {
			value: () => box.value,
		});
	}
	document.addEventListener('keydown', evt => {
		if ((evt.ctrlKey && 'osd'.includes(evt.key.toLowerCase())) || ['tab'].includes(evt.key.toLowerCase())) {
			return blockEvent(evt);
		}
		return true;
	});
	document.addEventListener('dragenter', blockEvent);
	document.addEventListener('dragover', blockEvent);
	document.addEventListener('dragleave', blockEvent);
	document.addEventListener('drop', blockEvent);
	input.addEventListener('blur', mungeInput);
	output.addEventListener('focus', mungeOutput);
	output.addEventListener('blur', () => {
		output.value = '';
	});
	const initialInput = (location.hash || '').replace(/^#+\/*/u, '').replace(/\/+$/u, '');
	if (initialInput) {
		input.value = initialInput;
		mungeInput();
	}
	input.focus();
})();
