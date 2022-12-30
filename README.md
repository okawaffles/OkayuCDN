![Boot Test](https://github.com/okawaffles/OkayuCDNv3/actions/workflows/node.js.yml/badge.svg)
![Commits](https://img.shields.io/github/commit-activity/m/okawaffles/okayucdn/main?style=flat-square)

# A File Upload Server
You create an account. You log in. You upload a file. You send the link. It embeds.
It's *that* easy.

## Why?
I felt like it. I wanted to make something useful. Now my friends can upload files greater than 8MB on discord.

## Should I use it?
Sure, go ahead. It's not intended to be used as a major server and it is quite unoptimized. Just don't pass it off as your own, please.

## How do I set it up?
*Note that the domain is hard-coded, so you will need to manually change it inside of the .ejs files. (config option to be added in 5.1.0 or 5.2.0)*
1. Download the latest release (recommended) or clone the repository (for bugtesting/development)
2. Navigate to the folder. **IMPORTANT**: The server will not run properly if you are not in the correct folder upon starting.
3. Run `npm ci`
4. Run `node .` OR `pm2 start index.js`
5. Optionally, use nginx, etc. to make a reverse proxy.

### To-do
- Allow the domain to be changed via server config.

### Notes
- Please do not use OkayuCDN in a commercial environment. It is not intended to be used in commercial environments and I *do not* own the rights to Nekomata Okayu. You are putting yourself at risk if you use this in a commercial environment.
- READ THE LICENSE, PLEASE
