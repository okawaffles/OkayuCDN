![Commits](https://img.shields.io/github/commit-activity/m/okawaffles/okayucdn/main?style=flat-square)

# A File Upload Server
You create an account. You log in. You upload a file. You send the link. It embeds.
It's *that* easy.

## Why?
I felt like it. I wanted to make something useful. Now my friends can upload files greater than 8MB on discord.

## Should I use it?
Sure, go ahead. It's not intended to be used as a major server and it is quite unoptimized. Just don't pass it off as your own, please.

## How do I set it up?
1. Download the latest release (recommended) or clone the repository (for bugtesting/development)
2. Navigate to the folder. **IMPORTANT**: The server will not run properly if you are not in the correct folder upon starting. (this is actively being worked on)
3. Edit `config.json` to suit your needs. You should change the domain property to fit your domain/IP address.
4. Run `npm i`
5. Run `node .` OR `pm2 start index.js`
6. Optionally, use nginx, etc. to make a reverse proxy.

### To-do
- Add private file uploads

### Notes
- Please do not use OkayuCDN in a commercial environment. It is not intended to be used in commercial environments and I *do not* own the rights to Nekomata Okayu. You are putting yourself at risk if you use this in a commercial environment.
- READ THE LICENSE, PLEASE
