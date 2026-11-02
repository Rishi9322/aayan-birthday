# Aayan's Birthday World 🎂

A mobile-first mini game-world: starry intro, cake, photo stack, three games, wish wall and a letter finale.
Vite + vanilla JS, GSAP, canvas-confetti, Three.js (WebGL sky). No backend.

## Run it locally

```bash
npm install
npm run dev        # opens on http://localhost:5173 (and your LAN address, so you can test on your phone)
```

## Edit the content: `src/config.js`

That one file holds the names, age (also the candle count), colours, photo list and captions, quiz questions
and result titles, wish-wall notes, the letter and the music path. Nothing else needs touching.

## Add your photos and videos

1. Drop images into `public/photos/` (jpg or png; HEIC must be converted first).
2. Run `npm run photos`. It makes a 1000px copy (`name.jpg`) and a 480px copy (`name-480.jpg`) of each image.
3. List them in `photos` in `config.js`. Missing files show a "photo coming soon" card, so nothing breaks.
4. Videos: put a small `.mp4` (H.264, under 1 MB ideally) and a poster image next to it, then add
   `{ video: 'photos/clip.mp4', src: 'photos/clip.jpg', ... }`.
5. Edit each `alt` (describe the photo for screen readers) and `caption`. The current ones are placeholders.

The memory game uses the first 6 non-video photos.

## Music

Put a file at `public/audio/music.mp3`. If it is missing, a built-in synth plays a "Happy Birthday" loop.
Sound stays off until the first tap, and the 🔊 button mutes everything.

## Deploy to Netlify in under 5 minutes

1. `npm run build` creates the `dist/` folder.
2. Go to <https://app.netlify.com/drop> and drag the `dist` folder onto the page.
3. Copy the site URL Netlify gives you.
4. Open `index.html` and replace `https://aayan-birthday.netlify.app/og.png` with `https://YOUR-SITE.netlify.app/og.png`
   (WhatsApp needs an absolute URL for the link preview), run `npm run build` again, and drag `dist` onto the same site.
5. Send the link on WhatsApp.

The same `dist/` folder works on Vercel and GitHub Pages (paths are relative).

## Notes

- Wishes typed on the wish wall only float up on that phone. Nothing is sent or saved anywhere.
- The high scores for the balloon game and memory game are saved in the browser (localStorage).
- The microphone (blow out the candles) needs HTTPS or localhost. The tap and swipe fallback always works.
- `prefers-reduced-motion` is respected: heavy animation and the sparkle trail switch off.
