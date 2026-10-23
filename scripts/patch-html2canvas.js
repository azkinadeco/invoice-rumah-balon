const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '..', 'node_modules', 'html2canvas', 'dist', 'html2canvas.js'),
  path.join(__dirname, '..', 'node_modules', 'html2canvas', 'dist', 'html2canvas.esm.js'),
];

files.forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('lab: colorFallback')) {
      content = content.replace(
        /var SUPPORTED_COLOR_FUNCTIONS = \{([\s\S]*?)\};/,
        `var colorFallback = function () { return 0; };\nvar SUPPORTED_COLOR_FUNCTIONS = {\n    hsl: hsl,\n    hsla: hsl,\n    rgb: rgb,\n    rgba: rgb,\n    lab: colorFallback,\n    oklab: colorFallback,\n    lch: colorFallback,\n    oklch: colorFallback,\n    color: colorFallback,\n    'color-mix': colorFallback\n};`
      );
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patch-html2canvas] Successfully patched ${filePath}`);
    }
  }
});
