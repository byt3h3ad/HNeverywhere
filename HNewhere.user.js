// ==UserScript==
// @name         HNewhere
// @namespace    https://github.com/byt3h3ad/HNeverywhere
// @version      2.0.0
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
	const TRACKING_PARAMS = new Set([
		"utm_source",
		"utm_medium",
		"utm_campaign",
		"utm_term",
		"utm_content",
		"fbclid",
		"gclid",
	]);
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
				if (TRACKING_PARAMS.has(key.toLowerCase())) {
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

		if (rawMatches.length || url === target) {
			return rawMatches.sort(compareStoriesByDiscussion);
		}

		// A campaign parameter, redirect, or canonical URL can make the address in
		// hand differ from the HN submission. Spend the second request only when the
		// direct lookup found nothing.
		return (await search(target)).sort(compareStoriesByDiscussion);
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

	async function init() {
		if (isHiddenSite()) {
			return;
		}

		const stories = await findHN(location.href);

		if (stories.length) {
			createThreadLink(stories);
		}
	}

	init().catch(console.error);
})();
