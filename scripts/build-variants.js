// Generates the Night and Light variants from themes/firefly-color-theme.json.
// Edit the dark theme, then run: node scripts/build-variants.js
const fs = require("fs");
const path = require("path");

const themes = path.join(__dirname, "..", "themes");
const source = fs.readFileSync(path.join(themes, "firefly-color-theme.json"), "utf8");

function hexToHsl(hex) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.substr(i, 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("");
}

function luminance(hex) {
  const c = [0, 2, 4].map((i) => parseInt(hex.substr(i, 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function finish(theme, name, type, overrides) {
  theme.name = name;
  theme.type = type;
  Object.assign(theme.colors, overrides);
  return JSON.stringify(theme, null, 2) + "\n";
}

// Night: the dark theme pushed darker for low-light rooms. Warm surfaces drop in
// lightness; text, syntax and accents are dimmed and softened so nothing glares
// against the near-black background. Saturated colors are held to a minimum
// contrast so darker hues like red don't fall behind the rest.
function buildNight() {
  const background = luminance(hslToHex(...hexToHsl(JSON.parse(source).colors["editor.background"].slice(1)).map((v, i) => (i === 2 ? v * 0.58 : v))));
  const night = source.replace(/#([0-9a-f]{6})([0-9a-f]{2})?/g, (match, hex, alpha = "") => {
    if (hex === "000000" || (hex === "ffffff" && alpha)) return match;
    const [h, s, l] = hexToHsl(hex);
    if (l < 0.36) return "#" + hslToHex(h, s, l * (l < 0.25 ? 0.58 : 0.78)) + alpha;
    let out = hslToHex(h, s * 0.85, l * 0.9);
    for (let lift = l * 0.9; s > 0.4 && (luminance(out) + 0.05) / (background + 0.05) < 5.5; lift += 0.005) {
      out = hslToHex(h, s * 0.85, lift);
    }
    return "#" + out + alpha;
  });
  return finish(JSON.parse(night), "Firefly Night", "dark", {});
}

// Light: every dark color mapped to a light counterpart. Syntax colors are
// darker and more saturated versions of the dark hues so they hold contrast on paper.
const LIGHT = {
  // UI surfaces, darkest chrome -> paper
  "131110": "e6ded2", "151311": "ebe4d9", "181614": "efe9e0", "1b1816": "f3eee6",
  "1c1917": "efe9e0", "1d1a18": "f8f4ee", "1e1b19": "f1ece4", "1f1c19": "f0e9df",
  "1f1c1a": "e9e2d7", "211e1b": "fbf8f3", "221f1c": "f2ece3", "25221f": "fdfaf6",
  "272320": "e0d7ca", "282421": "ffffff", "2b2825": "ece5da", "2e2924": "e6dccd",
  "302c29": "e2d9cc", "342e28": "e3d6c3", "36312d": "d9cfc1", "393430": "d6ccbe",
  "3e3731": "ecdcc4", "403a35": "d2c7b8", "413b36": "cfc4b5", "443e39": "c9bdad",
  "4a201c": "fbe0dc", "4a3a1c": "fbefd0", "1f3540": "dcecf3", "4a3828": "f1dcbc",
  "534b45": "b8ab9a", "56504b": "b3a698", "5a4430": "e8cfa8", "5e4530": "f0d9b5",
  "6b4f34": "eed3a8", "6b5139": "e0c294", "6b5646": "b0a08c", "7a5a35": "d9b98a",
  // UI text
  "6e6054": "a89a8a", "7a6a5c": "9a8b7b", "857565": "978877", "8f7f70": "8a7a6a",
  "9a8a7a": "857565", "a8978a": "7d6e60", "c4b4a2": "5e5045", "d4c4b0": "5a4c40",
  "d8cab8": "4a3d32", "e0d2c0": "3a2f26", "e8dccb": "3a2f26", "f0e4d2": "2e241c",
  "fff4e4": "1f1712", "f6e8d4": "3a2d20",
  // Accents and status
  "e8a54b": "c47a1a", "f0b45c": "b86a10", "ffcf85": "9a5500", "b8803a": "c99350",
  "c9822f": "c47a1a", "e09840": "a86210", "b8761f": "f5c66b", "a8412f": "c0503c",
  "b8443a": "c0473c", "b8862f": "e0b040", "8fb35a": "6a9a2a", "e0564e": "d0443a",
  "d9a04a": "d08a1a", "ef6b5f": "d03a2e", "ff6b5f": "d03a2e", "7fb4c9": "2a7aa0",
  // Syntax
  "ec5f57": "c8352d", "a7c66b": "3f7516", "f3c766": "8a5f00", "f39a4f": "ac500e",
  "d995b0": "b0487a", "86c2a6": "247558", "e5c48a": "8a6a2a", "f07c50": "c94e22",
  "f0c9a0": "9a5a30", "dcc3a0": "7a5638", "8c7d6e": "8a7a6a", "b39a80": "8a7258",
  "d0b89c": "7a6656", "b0a090": "857565",
  // Rainbow brackets
  "f070b0": "d0287a", "52a8ff": "1a72d8", "3dd6a3": "0e9a70", "9fdc3c": "5a9a10",
  "ffd23f": "b08800", "ff8c2e": "d86410",
  // Terminal
  "7fa8c9": "2a6aa8", "ff7a6e": "e04a3e", "c0dc85": "5f9a2a", "ffd982": "b8860a",
  "9cc0de": "3a80c0", "ecb0c8": "c05a8e", "a4dcc0": "2a9a78",
};

function buildLight() {
  const unmapped = new Set();
  const mapped = source.replace(/#([0-9a-f]{6})([0-9a-f]{2})?/g, (match, hex, alpha = "") => {
    if (hex === "000000") return "#000000" + ({ "80": "1f", "99": "26" }[alpha] ?? alpha);
    if (hex === "ffffff") return alpha ? "#000000" + alpha : "#1f1712";
    if (hex === "171412" || hex === "8a705a" || hex === "a08268") return match;
    if (!LIGHT[hex]) unmapped.add(hex);
    return "#" + (LIGHT[hex] || hex) + alpha;
  });
  if (unmapped.size) throw new Error("Light theme has no mapping for: " + [...unmapped].join(", "));

  return finish(JSON.parse(mapped), "Firefly Light", "light", {
    "editor.lineHighlightBackground": "#efe8dd",
    "list.hoverBackground": "#ebe4d9",
    "button.foreground": "#ffffff",
    "activityBarBadge.foreground": "#ffffff",
    "statusBarItem.remoteForeground": "#ffffff",
    "statusBar.debuggingForeground": "#ffffff",
    "statusBarItem.errorForeground": "#ffffff",
    "terminal.ansiBlack": "#3a2f26",
    "terminal.ansiWhite": "#6e6054",
    "terminal.ansiBrightWhite": "#a89a8a",
  });
}

fs.writeFileSync(path.join(themes, "firefly-night-color-theme.json"), buildNight());
fs.writeFileSync(path.join(themes, "firefly-light-color-theme.json"), buildLight());
console.log("Built Firefly Night and Firefly Light");
