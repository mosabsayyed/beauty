---
trigger: always_on
---

to run the browser for testing use this 
DISPLAY=:0 google-chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --disable-gpu --headless=new > /tmp/chrome.log 2>&1 &