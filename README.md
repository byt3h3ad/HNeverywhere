```
▄▄▄   ▄▄▄ ▄▄▄    ▄▄▄               ▄▄                      
███   ███ ████▄  ███               ██                      
█████████ ███▀██▄███ ▄█▀█▄ ██   ██ ████▄ ▄█▀█▄ ████▄ ▄█▀█▄ 
███▀▀▀███ ███  ▀████ ██▄█▀ ██ █ ██ ██ ██ ██▄█▀ ██ ▀▀ ██▄█▀ 
███   ███ ███    ███ ▀█▄▄▄  ██▀██  ██ ██ ▀█▄▄▄ ██    ▀█▄▄▄ 

A userscript that opens Hacker News discussions for the page you are reading.



## What it does

- **Finds the discussion:** HNewhere checks each eligible public page against Hacker News.
- **Opens the real thread:** When a submission exists, an orange **HN** link appears in the lower-right corner. Click it to open a matching HN submission in a new tab; your article stays where it is.
- **Does not render HN itself:** There is no sidebar, embedded comment tree, annotation layer, queue, or local UI state. Hacker News remains the source of truth for reading and participating in a discussion.

## What it can see

It runs on eligible public pages, so this matters: there is no backend, analytics,
telemetry, or local storage. It queries Algolia's Hacker News search API with the
current URL, falling back to a normalized form only when that direct lookup finds
no matching submission. Webmail, banking, auth flows, cloud consoles, and other
sensitive pages are excluded outright; Hacker News itself is excluded too.

Full detail in [SECURITY.md](SECURITY.md).

## Install

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [Userscripts (Safari)](https://apps.apple.com/us/app/userscripts/id1463298887)

2. [Install HNewhere](https://raw.githubusercontent.com/byt3h3ad/HNeverywhere/refs/heads/main/HNewhere.user.js)
3. Browse the web as usual. If HNewhere finds a discussion for the current page, the orange **HN** link opens a matching thread in a new tab.

## Contributing

Bug reports and pull requests are welcome. Please report anything security-sensitive privately via [SECURITY.md](SECURITY.md). HNewhere is a single file with no
build step or dependencies: edit `HNewhere.user.js`, load it in your userscript
manager, and what you see is what users install. Release history is in
[CHANGELOG.md](CHANGELOG.md).

## License

MIT
