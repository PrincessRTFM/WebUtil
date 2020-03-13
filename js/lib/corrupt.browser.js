/**
 * Iteratively "corrupt" a string of text from the initial content to the target, one character at a time.
 *
 * Takes two required arguments plus two more optional ones:
 * from - the initial text content
 * to - the final text content
 * extraChars? - the characters to use if the string needs to be grown to match the target content's length
 *               (defaults to all lowercase letters)
 * ignoreExtraCharCase? - whether all letters given in extraChars should be used as both upper and lowercase,
 *                        or if they should be used literally (defaults to true, use both cases even if not
 *                        explicitly given)
 *
 * Returns an iterator object that progressively converts from the initial string to the desired string
 */
function* corrupt(from, to, extraChars = '', ignoreExtraCharCase = true) {
	// Make sure that we have STRINGS, and then explode them arrays of each character
	from = String(from).split('');
	to = String(to).split('');
	// This is the bit we're operating on
	const current = from;
	// If you don't provide extra characters, we'll handle it.
	// First, make sure we have *A* value
	// Then, make sure it's a string
	// Then, explode it to all the characters
	// If there aren't any (and if you don't pass any, there won't be) it defaults to a-z
	// If you want to only use the ones in the origin string, just pass it in again.
	// Same for the target string. If you want both, just concatenate them together.
	// Duplicates are removed, and if you set ignoreExtraCharCase to a falsey value, it'll only use the
	// literal EXACT charactes given, instead of allowing upper and lower case variants of any letters.
	if (!extraChars) {
		extraChars = '';
	}
	if (!Array.isArray(extraChars)) {
		extraChars = String(extraChars).split('');
	}
	if (!extraChars.length) {
		extraChars = 'abcdefghijklmnopqrstuvwxyz'.split('');
	}
	/*
	 * From the inside out:
	 * Map all of the elements in extraChars to their string value
	 * IF ignoreExtraCharCase is true, return the lower and upper case variants
	 * Automatically flatten to produce a one-dimensional array
	 * Construct a Set from those values, to remove duplicates
	 * Immediately turn that back into a normal array
	 *
	 * In short: take extraChars, turn all letters into lower-and-upper case if desired, remove all duplicates
	 */
	extraChars = [
		...new Set(
			extraChars.flatMap(char => {
				if (ignoreExtraCharCase) {
					return [
						String(char).toLowerCase(),
						String(char).toUpperCase(),
					];
				}
				return String(char);
			})
		),
	];
	// We yield the initial value first, so that this can be easily slapped into, say, an interval function
	// to update some text field while still showing the initial value at least once. If that's not desirable,
	// then just call `.next()` on the returned iterator once before using it.
	yield current.join('');
	// Until the strings are the same, keep operating - can't compare the arrays directly, even the same content
	// will still compare as false, even with loose equality.
	while (current.join('') != to.join('')) {
		// We obviously need them to be the same length, so that's step one.
		// If the current string is too long, strip out one character each time, at random.
		if (current.length > to.length) {
			current.splice(
				Math.floor(Math.random() * current.length),
				1
			);
		}
		// If it's too SHORT, we splice a random character from the list into a random position each time instead
		else if (current.length < to.length) {
			current.splice(
				Math.floor(Math.random() * current.length),
				0,
				extraChars[Math.floor(Math.random() * extraChars.length)]
			);
		}
		const maxIndex = Math.min(current.length, to.length);
		// If the operable segment of both strings is the same, don't bother corrupting
		// It's not LIKELY unless you specifically set it up to happen, but I don't want
		// to end up in an endless thrash loop down in that do/while.
		if (current.slice(0, maxIndex).join('') != to.slice(0, maxIndex).join('')) {
			// Initially, we didn't do this until it was the right length, but that looked too boring.
			// So instead, we start corrupting immediately, and if the length changes, we'll just have to corrupt
			// the letters we already corrupted until we're done.
			let idx;
			// Keep coming up with a new index to change until the characters at that index AREN'T the same.
			// Otherwise, we'd keep slowing down the visible changes and it'd take a lot longer to finish.
			do {
				// Use whichever is shorter, to guarantee we actually get a character in both
				idx = Math.floor(Math.random() * maxIndex);
			} while (current[idx] == to[idx]);
			current[idx] = to[idx];
		}
		// If we're done, then make sure we don't do another (unnecessary) call - break the loop and return,
		// so that the iterator is marked complete.
		if (current.join('') == to.join('')) {
			break;
		}
		// Otherwise, we've more to do, so hand this back and wait to be called again.
		yield current.join('');
	}
	// And we're done!
	return current.join('');
}
