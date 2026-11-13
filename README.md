# 🌼 Kathgolap (Frangipani) in Words
 
A kathgolap flower written entirely out of words. Glowing words swirl through the dark like fireflies, then fly in one by one and settle into place until the whole flower is formed: white petals, soft yellow, and a pink glow at the heart.
 
It is a single static page, so it runs on **GitHub Pages** with no server and no build step.
 
## Live page
 
After you enable GitHub Pages (steps below), your page will be at:
 
```
https://<your-username>.github.io/<repository-name>/
```
 
## The animation
 
1. **Swirl:** words light up across the screen and orbit in a slow glowing whirlpool, twinkling in white, yellow, pink and green.
2. **Gather:** starting from the heart of the flower, words peel out of the swirl and fly in along curved paths, straightening and shrinking into place. Each one pops with a flash of light when it lands. The petals bloom outward, then the stem and leaves finish it.
3. **Afterglow:** a warm glow breathes behind the finished flower. A band of light sweeps around the petals, ripples spread out from the center, words twinkle, and tiny sparkles drift upward.
Click the flower (or press **R**) to replay everything.
 
## Page extras
 
- A deep plum night sky with twinkling stars and a soft vignette
- A warm light that follows your cursor, plus a gentle 3D tilt on desktop
- When the flower is complete, the title **কাঠগোলাপ** glows in, followed by a subtitle and two buttons
- Soft petals drift down the page after the bloom
- A signature in the bottom-right corner: "Made by Sadnan Ahmed". Each letter of the name flies in from the heart of the flower, a ripple of golden light runs through the letters, a glowing underline draws itself, and a little heart beats beside it
- **Replay** restarts the animation
- **Save image** downloads the finished flower as a PNG
- Respects the "reduce motion" setting on phones and computers
## Features
 
- White petals fading to light yellow, with a soft pink center
- Green stem and leaves, also made of words
- Swirling, glowing words that gather into the flower
- Light sweep, ripple and twinkle effects after it is complete
- Styled page: title, buttons, stars, falling petals (all in `style.css`)
- Replay and Save-as-image buttons
- Sharp on phones and high-resolution screens
- Works on any screen size
- Plain HTML, CSS and JavaScript: no libraries, no server
## Publish on GitHub Pages
 
1. Create a new repository on GitHub (for example `kathgolap`).
2. Upload `index.html`, `style.css`, `script.js` and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to *Deploy from a branch*.
5. Choose the `main` branch and the `/ (root)` folder, then click **Save**.
6. Wait about a minute, then open the link GitHub shows at the top of the Pages screen.
Visitors just open the link and the flower appears.
 
## Use your own words
 
Open `script.js` and find the `WORDS` list near the top:
 
```js
const WORDS = [
  "I LOVE YOU", "Te amo", "ভালোবাসি", ...
];
```
 
Replace or add any text between the quotes. Short words (up to 9 characters) are also used for the larger letters.
 
## Settings
 
All animation settings are at the top of `script.js`. Times are in milliseconds.
 
| Setting          | What it does                                        | Default |
|------------------|-----------------------------------------------------|---------|
| `START_DELAY`    | Blank pause before the animation begins             | `300`   |
| `APPEAR_SPREAD`  | Time over which the words light up and start swirling | `2200` |
| `GATHER_START`   | When words start flying into the flower             | `4000`  |
| `GATHER_SPREAD`  | Time over which all words fly in                    | `6500`  |
| `FLIGHT`         | How long one word takes to fly in                   | `1500`  |
| `FLASH`          | Length of the glow pop when a word lands            | `700`   |
| `GAP`            | Space between words in the petals                   | `3`     |
| `SEED`           | Change for a different word layout                  | `17`    |
| `BG`             | Background color                                    | `#060208` |
| `PETAL_LENGTH`   | Length of each petal                                | `205`   |
| `PETAL_WIDTH`    | Width of each petal                                 | `118`   |
 
To change the flower colors, edit the palettes inside `flowerColor()` in `script.js`: pink for the center, yellow for the throat, then cream and white toward the tips.
 
## Change the look of the page
 
Everything outside the flower lives in `style.css`:
 
- Colors are variables at the top (`--bg`, `--gold`, `--pink`, `--cream`)
- The title and subtitle text are in `index.html` (`<h1>` and `<p class="sub">`)
- The signature is the `<footer id="credit">` block in `index.html`; change the name there. Its animation is in the "Credit" section of `style.css` (`wave` is the light ripple, `beat` is the heart)
- The title's moving shine is the `shine` animation; the star twinkle is `twinkle`; the petal drift is `fall`
- The number of stars and falling petals is set in `script.js` (look for `makeStars` and `spawnPetals`)
## How it works
 
1. The flower is defined as five petal shapes, a stem and two leaves.
2. For every row of pixels, the script finds where the shape exists and fills that span with words that fit.
3. Each word gets a color based on its distance from the center and its position along the petal.
4. Every word has its own swirl orbit, departure time and flight curve, all derived from a fixed seed so the result is always the same.
5. Landed words are painted once onto a hidden layer, so the page stays smooth even on phones.
6. The canvas is transparent, so the CSS background shows through. When the last word lands, the script adds a `bloomed` class to the page and the CSS reveals the title, buttons and falling petals.
## Fonts
 
The flower uses the fonts already on the visitor's device and lets the browser pick a matching font for each script (Bengali, Hindi, Tamil, Telugu, Thai, Arabic, Hebrew, Chinese, Japanese, Korean and more). Modern phones and computers display these correctly.
 
## Project structure
 
```
kathgolap/
├── index.html    page structure and text
├── style.css     look and feel of the page
├── script.js     flower layout and animation
└── README.md
```
 
## License
 
Free to use, modify and share. Add a license of your choice here (for example MIT).
 
---
 
Made with ❤️, HTML, CSS and JavaScript.