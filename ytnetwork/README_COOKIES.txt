ytnetwork cookie setup

Place a Netscape-format cookies.txt file in /storage/emulated/0/Download/.
Run ./setup_cookies.sh from the ytnetwork directory.
The backend automatically loads ytnetwork/cookies.txt into every yt-dlp request.

The backend also checks YTDLP_COOKIES, ~/cookies.txt, ~/.config/yt-dlp/cookies.txt, /storage/emulated/0/Download/cookies.txt, /sdcard/Download/cookies.txt, and /storage/emulated/0/cookies.txt.

Check the active cookie configuration at /api/cookies/status.

Do not publish cookies.txt or commit it to Git.
