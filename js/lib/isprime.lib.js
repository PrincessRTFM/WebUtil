/* eslint-disable max-len */
/**
 * Test if the given number is a prime number or not. Takes two parameters: the value to test, and a verbose-return flag.
 * The return value depends on the verbose-return flag:
 * If verbose is false(y), the return will be a boolean indicating whether the given number is prime. Invalid values (eg, non-numbers) also return explicitly false. This return value is GUARANTEED to be a DEFINED boolean.
 * Otherwise, the return is a five-element array with the following values:
 * - boolean isNumberPrime: the same value that would be returned if verbose return was off
 * - int iterationsForCalculation: the number of loop iterations executed, NOT including the initial checks (always an int >= 0)
 * - int/NaN/undefined lastFactorTested: NaN for non-number inputs, undefined when the absolute value of the input is < 2, otherwise int
 * - int/NaN/undefined otherFactor: NaN for non-number inputs, undefined when the absolute value of the input is < 2 OR the input is prime, otherwise int
 * - int/NaN absoluteIntValueOfInput: NaN for non-number inputs, otherwise int
 * The lastFactorTested is always returned for inputs that are numbers >= 2, but is only an actual factor of the (absolute) input when the input is not prime. It is guaranteed to be positive when it is a defined number.
 * The otherFactor is only a defined number when the input is NOT prime, and can be multiplied by the lastFactorTested to produce the absolute value of the non-prime input. It is guaranteed to be positive when it is a defined number.
 * The absoluteIntValueOfInput is a defined number (guaranteed positive OR zero) when the input value is a valid number. It is the absolute value of the whole-number part of the input, in the event of non-integer numeric input. If present, this is the number that was tested for primeness. If not present (NaN), the input was not considered valid.
 */
/* eslint-enable max-len */
function isPrime(test, verbose) {
	// Convert the given value to a string, then [back] to an integer - force any passed value to become an int
	const number = parseInt(String(test), 10);
	// The following two conditionals are tests for basic restrictions:
	// - Must be a number
	// - (Absolute value) must be greater than one (zero and one are excluded by the definition of a prime)
	if (isNaN(number)) {
		return verbose
			? [
				false,
				0,
				NaN,
				NaN,
				NaN,
			]
			: false;
	}
	const absolute = Math.abs(number);
	if (absolute < 2) {
		return verbose
			? [
				false,
				0,
				void 0,
				void 0,
				absolute,
			]
			: false;
	}
	// This handles all even numbers, because I can't initialise
	// the lower factor test to an even number or it'll break
	if (absolute % 2 == 0) {
		return verbose
			? [
				false,
				0,
				2,
				absolute / 2,
				absolute,
			]
			: false;
	}
	// `factor` is the number being tested as a potential factor,
	// incrementing by two every test (to skip even numbers)
	let factor = 3;
	// `bound` is the upper bound of potential factors being tested,
	// and is constantly reduced as factors are tested
	let bound = absolute / factor;
	// `iters` tracks the number of iterations required to calculate prime/not-prime for the given number
	let iters = 0;
	// Up to (and including) the upper bound, which will be lowered each test...
	while (factor <= bound) {
		iters++;
		// ...obviously cut out if the factor being tested evenly divides into the number...
		if (absolute % factor == 0) {
			return verbose
				? [
					false,
					iters,
					factor,
					absolute / factor,
					absolute,
				]
				: false;
		}
		// ...skip even numbers by incrementing the potential factor to test by two...
		factor += 2;
		// ...and move the bound down. If `n` didn't divide in evenly,
		// then there's no point in testing past `absolute / n` either.
		// In order to test one third of the number, it must be calculated.
		// If it's not an integer, then clearly nothing between it and one
		// half will work either, because then you'd have a denominator of
		// two and a fraction. So there's no point in testing past a third
		// of the number if three doesn't work. But there's no point testing
		// past five if it doesn't work, because the only possible valid
		// factor is four - which isn't actually valid, since the number isn't
		// even (we already tested two in the first iteration) so there actually
		// ISN'T a valid factor past five. So if five doesn't work, we don't
		// test past a fifth, there'll be nothing there that works. And then
		// the same applies to seven, with six being between them and excluded
		// because nothing even can be a valid factor. And then nine with eight.
		// And so on and so forth. So every time we find another lower "factor"
		// that doesn't work, we can cut back on the upper bound of factors to test.
		// ADDENDUM: we can actually cut down even further than just that, because
		// we know that the failed number plus one is even, which automatically
		// fails. Additionally, since we're testing up to AND INCLUDING the lower
		// bound, we can cut down to plus two over the failed one - it'll still be
		// tested if we can reach it. If it's not the next one, then it'll still be
		// tested by it's corresponding factor next loop.
		bound = absolute / (factor + 2);
		// This will, over time, continually slice the bound further and further. 1/3, 1/5, 1/7, 1/9, etc.
		// The potential factors are NOT tested for being primes themselves because
		// that would add both all of needed calculations to test it AND another
		// frame of the callstack, which would just slow everything down even more.
	}
	// If we exit the loop to here, it means we couldn't find a valid factor for the given number.
	// According to the above, that means that the only factors are one and the number - which means it's prime.
	// We're done.
	return verbose
		? [
			true,
			iters,
			factor,
			void 0,
			absolute,
		]
		: true;
}

/* global module:false */
if (typeof module == "object" && module !== null) { // assume nodejs
	module.exports = isPrime;
}

