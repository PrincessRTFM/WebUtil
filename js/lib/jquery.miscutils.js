if (typeof jQuery != 'undefined') {
	(function extendJQ($) {
		$.fn.exists = function exists() {
			return this.length > 0;
		};
		$.fn.scrollToTop = function scrollToTop(options) {
			const self = this;
			$('html, body').animate({
				scrollTop: self.offset().top,
			}, options);
			return self;
		};
		$.fn.scrollToMiddle = function scrollToMiddle(options) {
			const self = this;
			$('html, body').animate({
				scrollTop: self.offset().top - (($(window).height() / 2) - (self.height() / 2)),
			}, options);
			return self;
		};
		$.fn.scrollToShow = $.fn.scrollToTop;
		$.fn.pickOne = function pickOne() {
			let retval = false;
			while (!retval) {
				retval = this[Math.floor(Math.random() * this.length)];
			}
			return $(retval);
		};
		$.fn.soften = function soften() {
			return this.addClass('ui-corner-all');
		};
		$.fn.highlight = function highlight() {
			return this.addClass("ui-state-highlight");
		};
		$.fn.unhighlight = function unhighlight() {
			return this.removeClass("ui-state-highlight");
		};
		$.fn.error = function error() {
			return this.addClass("ui-state-error");
		};
		$.fn.unerror = function unerror() {
			return this.removeClass("ui-state-error");
		};
		$.fn.plain = function plain() {
			return this.unhighlight().unerror();
		};
		$.fn.slideIn = function slideIn(side) {
			return this.show({
				effect: 'slide',
				direction: side,
			});
		};
		$.fn.slideOut = function slideOut(side) {
			return this.hide({
				effect: 'slide',
				direction: side,
			});
		};
		$.fn.slideAround = function slideAround(side) {
			return this.toggle({
				effect: 'slide',
				direction: side,
			});
		};
		$.fn.reject = function reject() {
			return this.effect('highlight', {color: '#FF3E96'}, 1500);
		};
		$.fn.accept = function accept() {
			return this.effect('highlight', {color: '#54FF9F'}, 1500);
		};
		$.fn.getCaretPos = function getCaretPos() {
			const input = this.get(0);
			if (!input) { return -1; }
			if ('selectionStart' in input) { return input.selectionStart; }
			else if (document.selection) {
				// IE
				input.focus();
				const sel = document.selection.createRange();
				const selLen = document.selection.createRange().text.length;
				sel.moveStart('character', -input.value.length);
				return sel.text.length - selLen;
			}
			return -1;
		};
	})(jQuery);
}
