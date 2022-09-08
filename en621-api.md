---
title: en621 API documentation
---
# Script API

The javascript API is exposed through the non-configurable, non-writable, frozen object `window.EN621_API`. This object (and by extension, the entire JS API) was first introduced in script version `3.0.0`. There are additionally events dispatched on `document` to indicate changes.

## Callable Methods

### `VERSION`

- Introduced: `v3.0.0`

This is the only non-function property, and contains the version of the script that's currently loaded. You can use this to check for a minimum version in order to ensure certain functionality is available. Please note that this version is in the form of a [semantic versioning v2.0.0 version string](https://semver.org/), **not** a number.

### `hasFlag(flagNameString)`

- Introduced: `v3.0.0`

en621 sets various flags to indicate status and detected features or content. If you want to know whether a certain thing was found on the page, you can call this with the name of the flag. For a list of flags, see the _CSS Classes_ section below, and leave off the `en621-` prefix.

Since this method just checks for specific classes on `document.body`, you don't actually _need_ to use it for anything, it's only a convenience method. But it handles cleaning up the "flags" that you pass, and if you pass a space-delimited set of multiple flags then it will check all of them, returning `true` only if _all_ of them are found.

### `putMessage(content, type, icon, timeout)`

- Introduced: `v3.5.1`

Messages can be shown to the user in the form of small overlay tabs on the upper right side of the screen. This function takes three or four arguments to construct the tab:

- The content of the message is in the form of a string to be interpreted as HTML, an array of content to `.append()`, or a single unit of content to `.append()`. If you want to provide a single string but ensure it's not used as HTML, you can pass a single-element array of it.
- The message "type" is used as a CSS class to style the displayed tab. By default, the only three types are `error`, `warning`, and `help`, but see the _Css Classes_ section below to add your own.
- The icon is a string that will be displayed before the `content`, in a separate element which will be styled according to the `type` passed.
- If desired, a timeout MAY be passed. If it's a valid number greater than zero, it will be treated as the number of SECONDS to keep the notice before automatically removing it. Otherwise (and if nothing is passed) the notice will not time out.

This function returns the tab that was placed on the page, which itself contains the close button, the icon, and the content. The content will be encapsulated in a `span.en621-message-content` element. See _CSS Classes_ for more details.

### `putError(content, timeout)` + `putWarning(content, timeout)` + `putHelp(content, timeout)`

- Introduced: `v3.0.0`

These are convenience wrappers for the above `putMessage` function. They automatically set the type and icon of the message, rather than requiring you to pass them yourself. If you don't want to make a custom message type, it is **strongly advised** that you use these instead, to guard against future changes to the CSS classes, as happened in `v4.0.0`. As wrappers, they return the value of the wrapped `putMessage` function.

### `registerKeybind(keyString, handlerFunc)`

- Introduced: `v3.0.0`

Rather than setting an individual `keydown` handler for every hotkey and thus duplicating all of the event detail checks, en621 defines a _single_ handler that checks an internal map of registered keybinds and their respective handlers. If you intend to define your own keybinds, you can make use of the same dispatch handler by calling this function. The keystring is taken from AutoHotkey, using `^` for control, `!` for alt, and `+` for shift as modifiers. There is no modifier support for the super/meta key, by design - this usually indicates a system or at least global keybind, which these by definition are not.

As an example, the random-post keybind is defined with `!r` for alt-r. Your handler function will be called with three arguments: the event object, the key, and the modifiers it was REGISTERED with. This allows a single handler to handle multiple keybinds if desired. For the modifiers actually pressed, examine the event object. Note that the key itself is always LOWERCASE, even if shift is held down.

At this time, there is no way to unregister a keybind. That may come in a future update.

### `searchString()`

- Introduced: `v3.0.0`

This is only a function to match the others. It returns a static, constant string and ignores all arguments. The returned string is the current search for this page _if_ one was found, or an empty string if not. It exists because I have found three different query parameters so far that must be checked.

### `cleanSearchString()`

- Introduced: `v4.4.0`

This function is like `searchString()` except that the return value (also a constant string) is the "normalised" version of the current search string, if any. In this case, normalisation is done by trimming all excess whitespace, splitting the search string on remaining whitespace, forcing all tags to lowercase, replacing any `rating:(safe|questionable|explicit)` tags with the short form (`rating:(s|q|e)`), removing all duplicates, and sorting the tags in lexical order. The resulting list is then joined with a single space character (`0x20`).

This string may be more useful to examine for the effective search, whereas `searchString()` will give you the exact literal search performed by the user.

### `enablePoolReaderMode()` + `disablePoolReaderMode()` + `togglePoolReaderMode(optionalEvent)`

- Introduced: `v3.0.0`

These functions take no arguments save the toggle and do exactly as the names imply. Obviously, they have no effect if the page is not a pool display page. In this case, they WILL throw an error. Given that the enable/disable functions are asynchronous, this will manifest as a rejected promise. The toggle function simply checks the current status of pool reader and calls (and returns the value of) the appropriate function. Additionally, if it receives an event object, it will prevent the default and stop propagation, allowing it to be used as an event handler directly.

### `addControlTab(...components)`

- Introduced: `v3.5.0`

Similar to notices but intended for a different purpose, _control_ tabs are on the _bottom_ right and do not have a close button or a timeout. The general idea is that they should be permanently present once added. They also do not have an icon, and are not given types. The direct image link toggle is implemented with a control tab, for example.

The argument(s) are treated differently than notice tabs as well. If a single `div` element is passed, it will be used as the tab _directly_. Otherwise - if the argument is not a `div` or if there are multiple arguments - a new `div` will be created and all of the arguments will be passed to `.append()` on that element. In either case, the container is given the appropriate classes, **pre**pended to the control tabs container, and then returned. As a result of being prepended, later tabs are added _above_ existing ones.

If the tab should later be removed, save the return value and call `.remove()` when you want it gone.

### `disableImageTooltips()` + `enableImageTooltips()` + `toggleImageTooltips()`

- Introduced: `v4.3.0`

These functions control whether post previews have tooltips (`title` attributes) or not. When disabled, the original tooltip text is moved into the `data-title` (`element.dataset.title` property) attribute instead, to preserve it for later restoration.

## Events

All events are of the type `CustomEvent` with the event name `en621`. The event object's `detail.name` contains the specific occurance that triggered the event. Some events also have additional details available under `detail.data` as well.

### `pool-reader-state`

- Cancelable: **no**
- Details: _varies_

Sent whenever the state of pool reader mode changes. When toggled, the only detail will be `active` as a boolean. When all posts have finished loading, the only detail will be `loaded` as the value `true`. If pool reader encounters an error (not simply a deleted post, something it can't recover from) the details will be `failed` as `true` and `error` as the error object.

### `user-message`

- Cancelable: **no**
- Details: `content`, `type`, `icon`, `timeout`

Sent when a notice tab is created. The four parameters are the (sanitised) values passed to the message creator function - `timeout` in particular is guaranteed to be a number not less than `0`, allowing an easy `if (timeout)` to check if the message has a timeout.

### `close-message`

- Cancelable: **no**
- Details: `content`, `type`, `icon`, `timeout`, `cause`

Sent when a notice tab is closed. The `cause` indicates why - `click` for the user closing it with the close button, `timeout` if it timed out. The other four parameters are identical to the above event.

### `direct-link-mode`

- Cancelable: **no**
- Details: `active`

Sent when direct-link mode is toggled. The `active` detail indicates whether it was turned on or off.

### `missing-post`

- Cancelable: **no**
- Details: `id`

Sent in pool reader mode while loading posts when a post is marked as deleted. The `id` is the ID of the post that no longer exists.

### `post-loaded`

- Cancelable: **no**
- Details: `id`, `source`, `post`, `count`, `total`

Sent when pool reader mode _finishes_ loading an image into the page. The `id` is the post ID, `post` is the post _URL_, `source` is the _image source_ URL, `count` is the number of posts that have now finished processing (loaded _or_ marked-as-deleted), and `total` is the total number of posts in the pool. This will be sent even when pool reader is not visible, as long as the images are still loading.

### `loaded`

- Cancelable: **no**
- Details: `loadTimeMs`

Sent once en621 finishes its run-once initialisation. At this point, the API object is available and all features not designed to run on-demand are either set up or failed. Individual features have flags (see `hasFlag()` above) to indicate their success/error state, see _CSS Classes_ for details.

### `image-tooltips`

- Cancelable: **no**
- Details: `enabled`

Emitted every time image tooltips are enabled or disabled, regardless of previous state. The `enabled` detail indicates whether post preview tooltips are active, or if they have been stored into the `data-title` attribute.

### `flag-set` and `flag-unset`

- Cancelable: **no**
- Details: `id`, `full`

Emitted every time a flag is set or unset. Flags are implemented as CSS classes on `document.body` and are listed below. This event allows scripts to be informed automatically when the set of active flags changes. The `id` detail is the flag's short name as listed below, while the `full` detail is the CSS class name that can be checked for.

# CSS Classes

CSS classes are all set on `document.body` (the `body` element) for convenience. You can check their existence programmatically via the `hasFlag()` function, or use them in CSS selectors for conditional styling.

## IMPORTANT NOTE

**All CSS classes are prefixed with `en621-` when applied.** This is _not_ shown here to avoid repetitive clutter, and is _not_ required in calls to `hasFlag()`, but if you intend to use pure CSS for custom styling, you ***must*** use the prefix in your selectors.

### `has-direct-links`

This is toggled when the direct-image-links feature is. If it is present, then any posts that en621 found on the page will link to their direct images on the e621 servers, not to their posts. If not, the opposite is true.

### `pool-reader-mode`

Only set on pool view pages. Toggled when pool reader is. If present, pool reader mode is enabled, though it may not be finished loading yet. If not present, pool reader is disabled, though it may still exist (and even be actively loading in the background) on the page.

### `pool-reader-loaded`

Only set on pool view pages. Set when pool reader finishes loading. If this is present, then pool reader exists on the page _and_ has loaded (and thus contains) _every_ non-deleted image in the pool.

### `pool-reader-failed`

Only set on pool view pages. Set when pool reader encounters an _unrecoverable_ error. If this is present, **the state of pool reader on the page is _undefined behaviour_** - it may exist partially loaded, not exist, _partially_ exist, or anything else.

If this flag is present, then `has-error` will also be present.

### `has-quick-source` / `no-quick-source`

Only set on post view pages. If quick-source is active, then double-clicking on the post image will go to the direct link. Only applied when the post is of an _image_, not a video. In the latter case, the `no-quick-source` flag will be set instead, indicating that quick source was intentionally disabled on this page.

### `has-source-link` / `no-source-link`

Only set on post view pages. If source-link is active, the subnav bar (at the top of the page) will have a link on the far right to the direct URL of the post's content. This applies no matter what kind of content the post has - if content was found, the link is added. The `no-source-link` flag is only set if content was found, but a source somehow _couldn't_ be. This should never happen, but I believe in being prepared. Note that this is _not_ considered an unrecoverable error, so the `has-error` flag will **not** be set.

### `has-related-posts` / `has-parent-post` / `has-child-post`

Only set on post view pages. If the post has a parent-relation (it is the child of another post) then `has-parent-post` will be present. If it has one or more child-relations (it is the parent of at least one post) then `has-child-post` will be present. Both _may_ be present at the same time, if both apply. If _either_ is applied, then `has-related-posts` will also be present, to allow for easy checking of there simply _being_ a relation. Additionally, if either (or both) is present, the subnav bar will have a pseudo-link next to the direct content URL link; clicking that pseudo-link will scroll the page to show the related posts.

As a side note, when a post has related posts, a `help` notice will be displayed containing a similar pseudo-link. This was added because the page is auto-scrolled down to the top of the actual content, which means the user must scroll _up_ to check for relations.

### `post-in-pool`

Only set on post view pages. If the post is in _at least one_ pool, this will be present, as will a notice similar to the related-posts notice; this one will scroll _up_ to show the pool(s) the post is in.

### `has-post-rating-link` / `missing-post-rating` / `no-post-rating`

Only set on post view pages. If the post rating was found, a tag will be added at the top of the tag list under its own category listing the rating; this tag operates like any other, using the special meta-tag `rating:*` for search. In this case, `has-post-rating-link` will be applied. If no post rating could be found, `missing-post-rating` will be applied instead. _If_ the post rating could not be found due to an error, rather than simply missing data, `has-error` will also be set. In the event that the normally-present element holding the post rating (far down the sidebar) could not be found, the `no-post-rating` flag will be applied _instead_ of `missing-post-rating`. The "missing" flag indicates that the rating couldn't be _found_, the "no" flag indicates that the post seems to not _have_ a rating.

### `has-search-banner-link` / `no-search-banner`

Only set on post view pages. If you got to the page from a search, the site displays a banner over the post content with the search in question. en621 specifically also turns this into a link to the search page for that search. In this event, the `has-search-banner-link` flag will be set. If you don't have a current-search banner, `no-search-banner` will be set instead.

### `has-autocleaning-searchbox` / `no-autocleaning-searchbox`

Only set if the page has a searchbox. If active, the searchbox will clean itself up on submit and on focus loss, collapsing multiple spaces into one and removing leading/trailing whitespace. If `no-autocleaning-searchbox` is present, it is an unrecoverable error (`has-error` is also present) because this feature only activates if the searchbox was _found_ in the first place.

### `has-flexible-search-box` / `no-flexible-search-box`

Only set if the page has a searchbox. If active, the searchbox expands automatically when hovered and focused, and shrinks back again after. The normal search box is too small to display more than about two tags together, so it expands up to 50% of your screen width. If this fails, it is an unrecoverable error because this feature only activates if the searchbox was actually _found_.

### `loaded`

Set on all en621-affected pages when the script finishes its run-once initialisation. The API object is now available and all applicable features have been set up.

### `has-error`

en621 encountered _an_ error, _somewhere_. This only means that _something_ went wrong (and that particular feature could not recover) and is only present in conjunction with one of the more specific error flags above. Check those to determine the specific error in question.

### `no-image-tooltips`

If present, post preview images do not have tooltips; the previous tooltip content is in the `data-title` attribute accessible through the `element.dataset.title` property.

### `has-last-seen-post`

Version 4.4.0 introduced last-seen tracking for post index pages, implemented as a yellow dashed border around the last post that was seen for the current search. Each time a post search page is loaded, the most recent post on that page is remembered for next time. If the current search has a known last-seen post, it will be highlighted and this flag will be set. At all other times, including on other pages than post searches, this flag will be unset.

