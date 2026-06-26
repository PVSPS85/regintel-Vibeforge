const fs = require('fs');
const path = require('path');

const TARGET_DIRS = [
  path.join(__dirname, 'frontend/src/pages'),
  path.join(__dirname, 'frontend/src/components')
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // 1. Primary Backgrounds: True White (#ffffff).
  // Some places might have bg-white, that's equivalent. 
  // But let's replace them for containers if needed.
  // The user requested white for primary background, #f3f3f5 for accent panels.

  // Primary Buttons & Brand Accents: Deep dark color (#030213) with white text.
  content = content.replace(/bg-blue-[567]00/g, 'bg-[#030213]');
  content = content.replace(/bg-indigo-[567]00/g, 'bg-[#030213]');
  
  content = content.replace(/text-blue-[567]00/g, 'text-[#030213]');
  content = content.replace(/text-indigo-[567]00/g, 'text-[#030213]');
  
  content = content.replace(/hover:bg-blue-[567]00/g, 'hover:bg-gray-900');
  content = content.replace(/hover:bg-indigo-[567]00/g, 'hover:bg-gray-900');
  
  content = content.replace(/ring-blue-[567]00/g, 'ring-[#030213]');
  content = content.replace(/ring-indigo-[567]00/g, 'ring-[#030213]');
  
  content = content.replace(/border-blue-[567]00/g, 'border-[#030213]');
  content = content.replace(/border-indigo-[567]00/g, 'border-[#030213]');

  // Accent Panels/Containers: Light gray (#f3f3f5) or soft borders (rgba(0, 0, 0, 0.1)).
  content = content.replace(/bg-gray-50\b/g, 'bg-[#f3f3f5]');
  // Make sure not to break bg-gray-500 etc. by using word boundary \b.
  // Replace border-gray-100 and border-gray-200 with soft border
  content = content.replace(/border-gray-100\b/g, 'border-[rgba(0,0,0,0.1)]');
  content = content.replace(/border-gray-200\b/g, 'border-[rgba(0,0,0,0.1)]');
  
  // Also fix /50 opacities on gray-50
  content = content.replace(/bg-gray-50\/50/g, 'bg-[#f3f3f5]/50');
  content = content.replace(/bg-gray-50\/30/g, 'bg-[#f3f3f5]/30');
  content = content.replace(/bg-gray-50\/80/g, 'bg-[#f3f3f5]/80');

  // Input Fields: Transparent or light gray backgrounds (#f3f3f5) with rounded-md corners.
  // And general rounded-xl / rounded-2xl to rounded-md.
  content = content.replace(/rounded-xl\b/g, 'rounded-md');
  content = content.replace(/rounded-2xl\b/g, 'rounded-md');
  content = content.replace(/rounded-lg\b/g, 'rounded-md');
  
  // Specific input styling overrides
  content = content.replace(/focus:ring-blue-50/g, 'focus:ring-gray-100');
  content = content.replace(/focus:border-blue-500/g, 'focus:border-[#030213]');
  
  // Some light blue/indigo backgrounds
  content = content.replace(/bg-blue-50\b/g, 'bg-[#f3f3f5]');
  content = content.replace(/bg-indigo-50\b/g, 'bg-[#f3f3f5]');
  content = content.replace(/text-blue-700/g, 'text-[#030213]');
  content = content.replace(/text-indigo-700/g, 'text-[#030213]');
  content = content.replace(/border-blue-100/g, 'border-[rgba(0,0,0,0.1)]');
  content = content.replace(/border-indigo-100/g, 'border-[rgba(0,0,0,0.1)]');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated:', filePath);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      processFile(fullPath);
    }
  }
}

TARGET_DIRS.forEach(d => {
  if (fs.existsSync(d)) {
    traverse(d);
  }
});

console.log('Done.');
