# Security Policy

## Supported versions

HNewhere is distributed as a single userscript that auto-updates from `main`.
Only the latest release is supported — there are no maintenance branches, and a
fix ships as a version bump that existing installs pick up automatically.

| Version | Supported |
| ------- | --------- |
| 2.0.0   | Yes       |
| < 2.0.0 | No        |

## Reporting a vulnerability

Please report privately rather than opening a public issue, using
[GitHub's private vulnerability reporting](https://github.com/byt3h3ad/HNeverywhere/security/advisories/new)
on this repository.

Include what you need to reproduce it: the page or page type, your browser and
userscript manager, and the behavior you observed. A proof of concept helps but
is not required to report something.

This is a small project maintained by one person. Expect an acknowledgement
within about a week. If a fix is warranted it will ship as a version bump, and
you will be credited in the changelog unless you would rather not be.

## What this script can do

Worth stating plainly, because the match pattern is broad by necessity:

- **It runs on eligible public `http` and `https` pages** you visit, injected by
your userscript manager.
- **It can make cross-origin requests** through `GM.xmlHttpRequest`, restricted
by the `@connect` header to `hn.algolia.com`. It searches the current page URL,
falling back to its normalized form only when the direct lookup finds no match.
- **It opens a link only when you click it.** The orange `HN` link points to the
matching Hacker News item page in a new tab. No action is taken with your HN
account and the script never reads credentials or cookies.
- **There is no backend, analytics, or telemetry.** No one but you and Hacker
News' search provider sees which pages are looked up.

## Design decisions that limit the blast radius

- **Sensitive sites are excluded** in both the userscript header and at runtime.
`isHiddenSite()` blocks private and single-label hostnames, plus common webmail,
banking, auth, cloud-console, document-editing, chat, payment, and search
surfaces. A blocked page makes no lookup and renders nothing.
- **Hacker News itself is excluded.** HNewhere does not run on
`news.ycombinator.com`; it opens an ordinary browser link there after an
explicit click.
- **The rendered surface is one inert link.** It creates no embedded content,
comment HTML, forms, storage state, or shadow-DOM UI.
- **`@noframes`** keeps it out of iframes.

## Out of scope

- Vulnerabilities in your userscript manager, browser, Algolia, or Hacker News
itself — please report those to their maintainers.
- The script's ability to read the URL of an eligible page. That is inherent to
looking up that page's Hacker News discussion. If you do not want a page looked
up, narrow the `@include` rules in your userscript manager.
