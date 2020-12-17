/* globals initialise initialize boxes reset loadScript */
(() => {
	const autoloadScriptPrefix = 'load=';
	const keypressLabel = event => {
		let pressed = '';
		if (event.ctrlKey) {
			pressed += '^';
		}
		if (event.altKey) {
			pressed += '!';
		}
		if (event.shiftKey) {
			pressed += '+';
		}
		if (event.metaKey) {
			pressed += '#';
		}
		pressed += (event.key || '').toLowerCase();
		return pressed;
	};
	const insertTextAtCursor = (input, text, highlightP) => {
		input.focus();
		const successP = document.execCommand("insertText", false, text);
		// Firefox uses (used?) a non-standard method - the insertText command doesn't (didn't?) work for it
		if (!successP && typeof input.setRangeText == "function") {
			const start = input.selectionStart;
			input.setRangeText(text);
			input.selectionEnd = start + text.length;
			input.selectionStart = highlightP
				? start
				: input.selectionEnd;
			const e = document.createEvent("UIEvent");
			e.initEvent("input", true, false);
			input.dispatchEvent(e);
		}
	};
	const proc = (target, ...details) => {
		if (typeof target.process == 'function') {
			target.process(target, ...details);
		}
		else if (typeof window.process == 'function') {
			window.process(target, ...details);
		}
	};
	const pageInitialiser = function pageInitialiser(count) {
		const ids = 'abcdefghijklmnopqrstuvwxyz';
		const body = document.body;
		count = parseInt(count, 10);
		if (isNaN(count)) {
			console.error("Initialisation count must be a valid number");
			return;
		}
		if (count < 1) {
			console.error("Initialisation count must be greater than zero");
			return;
		}
		if (count > ids.length) {
			console.error(`Initialisation count cannot exceed ${ids.length}`);
			return;
		}
		while (body.firstChild) {
			body.firstChild.remove();
		}
		ids.split('').forEach((id, index) => {
			delete window[id];
			delete window[`$${id}`];
			if (index < count) {
				let row = Array.from(document.querySelectorAll('.row')).pop();
				if (!row || index % 4 == 0) {
					row = document.createElement('div');
					row.className = "row"; // eslint-disable-line unicorn/no-keyword-prefix
					body.append(row);
				}
				const box = document.createElement('div');
				box.className = "box"; // eslint-disable-line unicorn/no-keyword-prefix
				const label = document.createElement('span');
				label.className = "label"; // eslint-disable-line unicorn/no-keyword-prefix
				const textarea = document.createElement('textarea');
				let reader = new FileReader();
				reader.addEventListener('load', evt => {
					textarea.value = evt.target.result;
					proc(textarea, '', evt);
				});
				reader.addEventListener('error', evt => {
					console.error(evt);
				});
				reader.addEventListener('loadend', () => {
					reader = new FileReader();
				});
				textarea.id = id;
				textarea.process = "function(textarea, pressed, event)";
				label.textContent = id;
				textarea.addEventListener('dragenter', evt => {
					evt.block();
					textarea.classList.add('dropping');
				});
				textarea.addEventListener('dragover', evt => {
					evt.block();
					textarea.classList.add('dropping');
				});
				textarea.addEventListener('dragleave', evt => {
					evt.block();
					textarea.classList.remove('dropping');
				});
				textarea.addEventListener('drop', evt => {
					evt.block();
					textarea.classList.remove('dropping');
					const files = Array.from(evt.dataTransfer.files);
					console.log(`File drop event on input #${index + 1} with ${files.length} file(s)`);
					if (!files.length) {
						return;
					}
					const file = files[0];
					console.dir(file);
					textarea.value = '';
					reader.readAsText(file);
				});
				textarea.addEventListener('keydown', evtKeyDown => {
					const hit = keypressLabel(evtKeyDown);
					if (hit == '^o') {
						evtKeyDown.block();
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
					}
					else if (hit == '^d') {
						evtKeyDown.block();
						textarea.value = '';
					}
					else if (hit == '^s') {
						evtKeyDown.block();
						textarea.select();
						document.execCommand("copy");
					}
					else if (hit == 'tab') {
						evtKeyDown.block();
						insertTextAtCursor(textarea, "\t");
						proc(textarea, hit, evtKeyDown);
					}
					proc(textarea, hit, evtKeyDown);
				});
				Object.defineProperties(textarea, {
					munge: {
						enumerable: true,
						value: munger => {
							textarea.value = munger(textarea.value) || textarea.value;
						},
					},
					toString: {
						value: () => textarea.value,
					},
				});
				window[id] = textarea;
				box.append(textarea, label);
				row.append(box);
			}
		});
	};
	const blockEvent = function blockEvent() {
		this.preventDefault();
		this.stopPropagation();
	};
	Event.prototype.block = blockEvent;
	Object.defineProperties(window, {
		initialise: {
			value: pageInitialiser,
			enumerable: true,
		},
		initialize: {
			value: pageInitialiser,
		},
		boxes: {
			get: () => document.querySelectorAll('textarea').length,
			set: amount => window.initialise(amount),
			enumerable: true,
		},
		reset: {
			value: () => {
				window.boxes = window.boxes || 1;
			},
			enumerable: true,
		},
		loadScript: {
			value: src => {
				const script = document.createElement('script');
				script.type = "text/javascript";
				script.addEventListener('load', () => {
					console.info(`Loaded script from ${src}`);
					script.remove();
				});
				script.addEventListener('error', () => {
					console.error(`Unable to load script from ${src} (did your browser block the request?)`);
					script.remove();
				});
				document.head.append(script);
				script.src = src;
			},
			enumerable: true,
		},
	});
	const setup = () => {
		const globalKeyHandler = evt => {
			if (evt.ctrlKey && 'osd'.includes(evt.key.toLowerCase()) || ['tab'].includes(evt.key.toLowerCase())) {
				evt.block();
			}
		};
		const globalDragDropHandler = evt => {
			evt.preventDefault();
		};
		document.addEventListener('dragenter', globalDragDropHandler);
		document.addEventListener('dragleave', globalDragDropHandler);
		document.addEventListener('dragover', globalDragDropHandler);
		document.addEventListener('drop', globalDragDropHandler);
		document.addEventListener('keydown', globalKeyHandler);
		document.addEventListener('keyup', globalKeyHandler);
		reset();
		window.process = "function(textarea, pressed, event)";
		const unknownParameters = [];
		const knownParameters = [];
		(location.hash || '').replace(/^#/u, '').split(/\s*,\s*/u)
			.map(part => part.trim())
			.filter(part => part.length)
			.forEach(param => {
				if (param.startsWith(autoloadScriptPrefix)) {
					loadScript(param.slice(autoloadScriptPrefix.length));
				}
				else {
					unknownParameters.push(param);
					return;
				}
				knownParameters.push(param);
			});
		location.hash = knownParameters.join(",");
		/* eslint-disable max-len */
		console.groupCollapsed("Help");
		console.groupCollapsed("Basic Usage");
		console.info("Call `initialise(<numberOfTextBoxes>)` (or `initialize` - both spellings do the same thing!) to reset the page and produce the given number of textareas, or just set `window.boxes` to a number. Calling `reset()` is the same as initialising to a single box.");
		console.info("When changing the number of boxes on the page, the page is entirely cleared and brand new boxes are created, so all custom properties event handlers are lost!");
		console.info("All textarea are tagged in the lower right corner with their ID - which is also defined as a global variable pair: `window.<id>` is the box with that ID.");
		console.info("Pressing CONTROL-S in a box will select all contents and copy them to the clipboard, and pressing CONTROL-D will clear it.");
		console.groupEnd();
		console.groupCollapsed("Automatic Input Handling");
		console.info("When a key or key combo (that isn't already registered to do something) is pressed on a textarea, it tries to call an automatic handler if one is found.");
		console.info("Each textarea has an element instance property names `process`, which can be set to a function that takes `targetTextarea, pressedKeyCombo, triggerEvent` as arguments.");
		console.info("There is also a global `window.process` handler, which takes the same signature. That one will ONLY be called for textareas that DON'T have a specific handler.");
		console.info("Since per-input handlers are instance properties, changing the number of textareas on the page will destroy them. The global handler will not be touched.");
		console.info("All automatic handlers are triggered on KEYDOWN, and apply to ANYTHING not already defined to do something.");
		console.info("Pressed key combo strings take the form of `[^][!][+][#]<key name>`, with the four flags corresponding to CONTROL, ALT, SHIFT, and META, respectively, and any modifiers not pressed will just be left out.");
		console.info("You can call `eventObject.block()` to prevent the default effect AND stop event propagation in one go.");
		console.groupEnd();
		console.groupCollapsed("Loading Files From Disk");
		console.info("You can press CONTROL-O in a box to select a file and load its contents into the box, or just drag-and-drop a file onto the one you want to load it into.");
		console.info("When a file is loaded into a textarea, the processor (either instanced or global) will be called, with the key combo set to an empty string and the FileReader's load event as the third parameter.");
		console.groupEnd();
		console.groupCollapsed("External Scripts");
		console.info("If you want to load an external script, pass the source to the global `loadScript(<source>)` function.");
		console.info(`You can pass script URLs in the page URI hash as \`${autoloadScriptPrefix}<url>\` and they will automatically call \`loadScript(<url>)\`. Each url must be passed as its own parameter, separated with commas.`);
		console.groupEnd();
		console.groupEnd();
		/* eslint-enable max-len */
		if (unknownParameters.length) {
			console.info(
				`Received ${unknownParameters.length} unknown arguments in page URI hash:`,
				unknownParameters
			);
		}
	};
	window.addEventListener('load', setup);
})();
