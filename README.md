![Commits](https://img.shields.io/github/commit-activity/m/okawaffles/okayucdn/main?style=flat-square)

# A File Upload Server
You create an account. You log in. You upload a file. You send the link. It embeds.
It's *that* easy.

## Why?
I felt like it. I wanted to make something useful. Now my friends can upload files greater than 8MB on discord.

## Should I use it?
> [!CAUTION]
> Do not use OkayuCDN in a commercial environment. Some images are property of cover corp. Using these without permission could land you in some legal hot water.
Sure, go ahead. It's not intended to be used as a major server and it is quite unoptimized.
Feel free to even customize the logos and name throughout your pages. Note that you must not replace any text strings containing "Powered by OkayuCDN"

## How do I set it up?
> [!IMPORTANT]
> As of March 27th, 2024, the pre-6.0 JS codebase has been discontinued in favor of a cleaner TypeScript-based codebase with many improvements.
> Due to this, there are some extra steps needed
### 6.0+ versions
1. Download the latest release (recommended) or clone the repository (for cutting-edge features)
2. Navigate to the folder
3. Run `npm i` to install all dependencies
4. (if not already installed) install TSC (either `npm i -g typescript`<sup>com. a</sup> or `npm i typescript`<sup>com. b</sup>)
5. Compile the source with either `tsc`<sup>for com. a</sup> or `npx tsc`<sup>for com. b</sup>
6. Edit `config.json` to your liking.
7. Start the server with `node .` (alternatively, you can use some watchdog such as PM2 like `pm2 start . -n "OkayuCDN"`)
8. It is recommended you use a reverse proxy such as NGINX to allow SSL.
### Pre-6.0 versions
1. Download the latest release (recommended) or clone the repository (for bugtesting/development)
2. Navigate to the folder. **IMPORTANT**: The server will not run properly if you are not in the correct folder upon starting. (this is actively being worked on)
3. Edit `config.json` to suit your needs. You should change the domain property to fit your domain/IP address.
4. Run `npm i`
5. Run `node .` OR `pm2 start index.js`
6. Optionally, use nginx, etc. to make a reverse proxy.

## Cool! I want to contribute!
Here's some things you could help me with:
- Testing on devices other than Desktop (or large aspect ratio screens)
- Styling for devices other than Desktop (or large aspect ratio screens)
- Code cleanup/documentation
- Fixing one of the open [issues](https://github.com/okawaffles/OkayuCDN/issues).

## Notes
- Please do not use OkayuCDN in a commercial environment. It is not intended to be used in commercial environments and I *do not* own the rights to Nekomata Okayu. You are putting yourself at risk if you use this in a commercial environment.
- READ THE LICENSE, PLEASE
