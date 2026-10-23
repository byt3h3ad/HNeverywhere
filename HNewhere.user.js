// ==UserScript==
// @name         HNewhere
// @namespace    https://github.com/byt3h3ad/HNeverywhere
// @version      2.1.0
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/byt3h3ad/HNeverywhere/main/HNewhere.user.js
// @downloadURL  https://raw.githubusercontent.com/byt3h3ad/HNeverywhere/main/HNewhere.user.js
// @homepageURL  https://github.com/byt3h3ad/HNeverywhere
// @supportURL   https://github.com/byt3h3ad/HNeverywhere/issues
// @description  Open Hacker News discussions for the page you are reading
// @include      http://*
// @include      https://*
// @exclude      http://localhost/*
// @exclude      https://localhost/*
// @exclude      https://www.google.com/*
// @exclude      https://www.google.*/*
// @exclude      https://chatgpt.com/*
// @exclude      https://claude.ai/*
// @exclude      https://x.com/
// @exclude      https://*.google.com/*
// @exclude      https://accounts.google.com/*
// @exclude      https://mail.google.com/*
// @exclude      https://mail.*.*/*
// @exclude      https://*.bank.com/*
// @exclude      https://*.googleusercontent.com/*
// @exclude      https://*.doubleclick.net/*
// @exclude      https://*.facebook.com/*
// @exclude      https://*.twitter.com/*
// @exclude      https://*.linkedin.com/*
// @exclude      https://*.youtube.com/
// @include      https://*.youtube.com/watch?v=*
// @exclude      https://outlook.*/*
// @exclude      https://*.slack.com/*
// @exclude      https://*.notion.so/*
// @exclude      https://*.figma.com/*
// @exclude      https://*.atlassian.net/*
// @exclude      https://*.paypal.com/*
// @exclude      https://*.stripe.com/*
// @exclude      https://console.aws.amazon.com/*
// @exclude      https://portal.azure.com/*
// @exclude      https://console.cloud.google.com/*
// @exclude      https://*.netflix.com/*
// @exclude      https://web.whatsapp.com/*
// @exclude      https://*.instagram.com/*
// @exclude      *://127.0.0.1/*
// @exclude      *://*/*.pdf
// @exclude      https://news.ycombinator.com/*
// @grant        GM.xmlHttpRequest
// @connect      hn.algolia.com
// @run-at       document-end
// @noframes
// ==/UserScript==

(function () {
	"use strict";

	const HN_ORIGIN = "https://news.ycombinator.com";
	const BUTTON_ID = "hnewhere-thread-link";
	const TRACKING_PARAMS = new Set(["fbclid", "gclid"]);
	const TRACKING_PATTERNS = [/^utm_/, /^syn-/];
	const ARCHIVE_HOSTS = new Set([
		"archive.is",
		"archive.today",
		"archive.ph",
		"archive.li",
		"archive.vn",
		"archive.md",
		"archive.fo",
		"web.archive.org",
	]);

	function isTrackingParam(key) {
		const name = key.toLowerCase();

		return (
			TRACKING_PARAMS.has(name) ||
			TRACKING_PATTERNS.some((pattern) => pattern.test(name))
		);
	}
	const HOST_ALIASES = new Map([
		["x.com", "twitter.com"],
		["www.x.com", "twitter.com"],
		["mobile.x.com", "twitter.com"],
		["www.twitter.com", "twitter.com"],
		["mobile.twitter.com", "twitter.com"],
	]);
	const HIDDEN_HOST_PATTERNS = [
		/^(mail|inbox|webmail|email|accounts?|login|signin|auth|sso|idp|oauth)\./,
		/(^|\.)(chatgpt\.com|claude\.ai)$/,
		/(^|\.)(gmail|outlook|hotmail|fastmail|proton|okta|onelogin|duosecurity|auth0|clerk|workos)\.(com|me|mail)$/,
		/(^|\.)(bank(ing)?|chase|bankofamerica|wellsfargo|citibank|capitalone|usbank|hsbc|barclays|lloydsbank|natwest|santander|monzo|revolut|americanexpress|amex|discover|schwab|fidelity|vanguard|etrade|robinhood|coinbase|paypal|venmo|wise|stripe|squareup|plaid)\.(com|co\.uk)$/,
		/^(console|dashboard|admin|manage)\./,
		/(^|\.)(console\.(aws\.amazon|cloud\.google)|portal\.azure|docs\.google|drive\.google|sheets\.google|slides\.google|calendar\.google|keep\.google|notion|coda|airtable|figma|miro|canva|linear|asana|monday|clickup|trello|basecamp|atlassian)\.(com|net|so|io|app)$/,
		/(^|\.)(slack|discord|zoom|teams|messenger|web\.(whatsapp|telegram))\.(com|us|org)$/,
		/(^|\.)(instagram|tiktok|snapchat|threads|netflix|hulu|disneyplus|max|primevideo|spotify|tidal)\.(com|net)$/,
		/(^|\.)(duckduckgo|bing|baidu|yandex|ecosia|startpage|qwant)\.com$/,
		/^search\./,
	];
	const HIDDEN_PATH_PATTERNS = [
		/^\/(login|log-in|signin|sign-in|signup|sign-up|register|logout|log-out|sign-out)(\/|$)/,
		/^\/(auth|oauth|oauth2|sso|saml|password|reset-password|forgot|forgot-password|verify|2fa|mfa)(\/|$)/,
		/^\/(checkout|cart|basket|payment|payments|billing|invoice|invoices|subscribe|upgrade)(\/|$)/,
		/^\/(admin|wp-admin|dashboard|settings|preferences|account|accounts|my-account|profile\/edit)(\/|$)/,
		/^\/(search|results|compose|inbox|messages|dm|chat)(\/|$)/,
	];

	function normalizeURL(url) {
		try {
			const parsed = new URL(url);

			for (const key of [...parsed.searchParams.keys()]) {
				if (isTrackingParam(key)) {
					parsed.searchParams.delete(key);
				}
			}

			const host = parsed.hostname.toLowerCase();
			return (
				(HOST_ALIASES.get(host) || host) +
				parsed.pathname.replace(/\/$/, "") +
				parsed.search
			);
		} catch {
			return "";
		}
	}

	function isPrivateHostname(hostname) {
		return (
			hostname === "localhost" ||
			/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) ||
			hostname.includes(":") ||
			!hostname.includes(".") ||
			/\.(local|internal|test|localhost|lan|invalid|example)$/.test(hostname) ||
			hostname.endsWith(".home.arpa")
		);
	}

	function isHiddenSite(url = location.href) {
		try {
			const parsed = new URL(url);
			const hostname = parsed.hostname.toLowerCase();

			return (
				(parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
				isPrivateHostname(hostname) ||
				HIDDEN_HOST_PATTERNS.some((pattern) => pattern.test(hostname)) ||
				HIDDEN_PATH_PATTERNS.some((pattern) =>
					pattern.test(parsed.pathname.toLowerCase()),
				)
			);
		} catch {
			return true;
		}
	}

	function canonicalHint() {
		return (
			document.querySelector('link[rel~="canonical" i]')?.href ||
			document.querySelector('meta[property="og:url" i]')?.content ||
			""
		);
	}

	// Trust the canonical URL only when it names this same page; then drop query
	// parameters it does not carry (session ids, referrers, unknown trackers).
	function canonicalPageURL(href, hint) {
		if (!hint) {
			return href;
		}

		try {
			const page = new URL(href);
			const named = new URL(hint, href);
			const bare = (path) => path.replace(/\/+$/, "");

			if (
				named.hostname.toLowerCase() !== page.hostname.toLowerCase() ||
				bare(named.pathname) !== bare(page.pathname)
			) {
				return href;
			}

			for (const [key, value] of named.searchParams) {
				if (page.searchParams.get(key) !== value) {
					return href;
				}
			}

			for (const key of [...page.searchParams.keys()]) {
				if (!named.searchParams.has(key)) {
					page.searchParams.delete(key);
				}
			}

			return page.href;
		} catch {
			return href;
		}
	}

	function archivedOriginalURL(href) {
		try {
			const here = new URL(href);

			if (!ARCHIVE_HOSTS.has(here.hostname.toLowerCase().replace(/^www\./, ""))) {
				return null;
			}

			let path = here.pathname;

			try {
				path = decodeURIComponent(path);
			} catch {}

			const found = path.match(/\/(https?:\/{1,2}.+)$/i);

			if (!found) {
				return null;
			}

			const original = new URL(
				found[1].replace(/^(https?:)\/(?!\/)/i, "$1//") + here.search,
			);

			return ARCHIVE_HOSTS.has(original.hostname.toLowerCase()) ||
				isHiddenSite(original.href)
				? null
				: original.href;
		} catch {
			return null;
		}
	}

	function pageAddresses() {
		const here = canonicalPageURL(location.href, canonicalHint());
		const original = archivedOriginalURL(location.href);

		return original && normalizeURL(original) !== normalizeURL(here)
			? [here, original]
			: [here];
	}

	function request(url) {
		return new Promise((resolve) => {
			GM.xmlHttpRequest({
				method: "GET",
				url,
				timeout: 10000,
				onload(response) {
					try {
						resolve(JSON.parse(response.responseText));
					} catch {
						resolve(null);
					}
				},
				onerror: () => resolve(null),
				ontimeout: () => resolve(null),
			});
		});
	}

	function compareStoriesByDiscussion(left, right) {
		return (
			(right.num_comments || 0) - (left.num_comments || 0) ||
			(right.points || 0) - (left.points || 0) ||
			(right.created_at_i || 0) - (left.created_at_i || 0)
		);
	}

	async function findHN(url) {
		const target = normalizeURL(url);

		if (!target) {
			return [];
		}

		const search = async (query) => {
			const result = await request(
				"https://hn.algolia.com/api/v1/search?tags=story&restrictSearchableAttributes=url&hitsPerPage=20&query=" +
					encodeURIComponent(query),
			);

			return (result?.hits || []).filter(
				(story) => normalizeURL(story.url) === target,
			);
		};
		const rawMatches = await search(url);

		if (rawMatches.length) {
			return rawMatches;
		}

		// A campaign parameter, redirect, or canonical URL can make the address in
		// hand differ from the HN submission, so retry with the normalized form.
		return search(target);
	}

	// Remembers lookups for the life of the tab only: nothing is persisted, and
	// revisiting a URL (back/forward, repeated replaceState) costs no requests.
	const lookups = new Map();

	function findAllCached(urls) {
		const key = urls.map(normalizeURL).join("\n");

		if (!lookups.has(key)) {
			lookups.set(key, findAll(urls));
		}

		return lookups.get(key);
	}

	async function findAll(urls) {
		const found = new Map();

		for (const stories of await Promise.all(urls.map(findHN))) {
			for (const story of stories) {
				found.set(story.objectID, story);
			}
		}

		return [...found.values()].sort(compareStoriesByDiscussion);
	}

	function createThreadLink(stories) {
		const story = stories[0];
		const id = String(story?.objectID || "");

		if (!id || document.getElementById(BUTTON_ID)) {
			return;
		}

		const link = document.createElement("a");
		const label = "Open Hacker News discussion";

		link.id = BUTTON_ID;
		link.href = `${HN_ORIGIN}/item?id=${encodeURIComponent(id)}`;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		link.textContent = "HN";
		link.title = label;
		link.setAttribute("aria-label", label);
		link.style.cssText = `
			position:fixed;
			right:20px;
			bottom:20px;
			z-index:2147483646;
			display:grid;
			place-items:center;
			width:44px;
			height:44px;
			box-sizing:border-box;
			border-radius:50%;
			background:#ff6600;
			color:#fff;
			box-shadow:0 1px 4px rgba(0,0,0,.25);
			font:700 13px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
			text-align:center;
			text-decoration:none;
		`;
		link.addEventListener("mouseenter", () => {
			link.style.transform = "scale(1.06)";
		});
		link.addEventListener("mouseleave", () => {
			link.style.transform = "";
		});
		document.body.appendChild(link);
	}

	const SETTLE_MS = 250;
	const POLL_MS = 400;
	const BACKSTOP_POLL_MS = 2000;
	let run = 0;
	let shownHref = "";
	let timer = 0;

	function removeThreadLink() {
		document.getElementById(BUTTON_ID)?.remove();
	}

	async function refresh() {
		const id = ++run;

		removeThreadLink();

		if (isHiddenSite()) {
			return;
		}

		const stories = await findAllCached(pageAddresses());

		// A newer navigation superseded this lookup.
		if (id === run && stories.length) {
			createThreadLink(stories);
		}
	}

	// Userscript managers isolate this script from the page, so wrapping
	// history.pushState here would not see the page's own calls. Poll the URL
	// instead; the Navigation API only makes detection faster where available.
	function checkNavigation() {
		if (location.href === shownHref) {
			return;
		}

		const changed = normalizeURL(location.href) !== normalizeURL(shownHref);

		shownHref = location.href;

		if (!changed) {
			return;
		}

		clearTimeout(timer);
		timer = setTimeout(() => refresh().catch(console.error), SETTLE_MS);
	}

	function init() {
		shownHref = location.href;
		refresh().catch(console.error);
		window.addEventListener("popstate", checkNavigation);
		// Navigation events are untested across every manager's sandbox, so a slow
		// poll stays as a backstop; without the API it polls faster.
		if (window.navigation) {
			window.navigation.addEventListener("currententrychange", checkNavigation);
		}

		setInterval(checkNavigation, window.navigation ? BACKSTOP_POLL_MS : POLL_MS);
	}

	init();
})();
