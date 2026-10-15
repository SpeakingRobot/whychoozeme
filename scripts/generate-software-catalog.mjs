import { readFileSync, writeFileSync } from 'node:fs';

const source = JSON.parse(readFileSync('node_modules/simple-icons/data/simple-icons.json', 'utf8'));
// Products without a Simple Icons glyph still appear in search. Their official
// site supplies a favicon, and freelancers can add any further missing tool.
const additional = [
  ['Adobe Photoshop','https://www.adobe.com'], ['Adobe Illustrator','https://www.adobe.com'],
  ['Adobe InDesign','https://www.adobe.com'], ['Adobe Lightroom','https://www.adobe.com'],
  ['Adobe Premiere Pro','https://www.adobe.com'], ['Adobe After Effects','https://www.adobe.com'],
  ['Adobe Acrobat','https://www.adobe.com'], ['Adobe Audition','https://www.adobe.com'],
  ['Adobe Animate','https://www.adobe.com'], ['Adobe XD','https://www.adobe.com'],
  ['Canva','https://www.canva.com'], ['CapCut','https://www.capcut.com'],
  ['Final Cut Pro','https://www.apple.com'], ['Logic Pro','https://www.apple.com'],
  ['GarageBand','https://www.apple.com'], ['iMovie','https://www.apple.com'],
  ['Keynote','https://www.apple.com'], ['Numbers','https://www.apple.com'],
  ['Pages','https://www.apple.com'], ['Procreate','https://procreate.com'],
  ['Microsoft Word','https://www.microsoft.com'], ['Microsoft Excel','https://www.microsoft.com'],
  ['Microsoft PowerPoint','https://www.microsoft.com'], ['Microsoft Outlook','https://www.microsoft.com'],
  ['Microsoft Teams','https://www.microsoft.com'], ['Microsoft Access','https://www.microsoft.com'],
  ['Microsoft OneNote','https://www.microsoft.com'], ['Microsoft Project','https://www.microsoft.com'],
  ['Microsoft Visio','https://www.microsoft.com'], ['Microsoft Power BI','https://www.microsoft.com'],
  ['Google Docs','https://docs.google.com'], ['Google Sheets','https://sheets.google.com'],
  ['Google Slides','https://slides.google.com'], ['Google Drive','https://drive.google.com'],
  ['Google Forms','https://forms.google.com'], ['Google Meet','https://meet.google.com'],
  ['Google Analytics','https://analytics.google.com'], ['Sketch','https://www.sketch.com'],
  ['Affinity Designer','https://affinity.serif.com'], ['Affinity Photo','https://affinity.serif.com'],
  ['Affinity Publisher','https://affinity.serif.com'], ['AutoCAD','https://www.autodesk.com'],
  ['Revit','https://www.autodesk.com'], ['Maya','https://www.autodesk.com'],
  ['3ds Max','https://www.autodesk.com'], ['Fusion 360','https://www.autodesk.com'],
  ['SketchUp','https://www.sketchup.com'], ['Rhino 3D','https://www.rhino3d.com'],
  ['Cinema 4D','https://www.maxon.net'], ['ZBrush','https://www.maxon.net'],
  ['FL Studio','https://www.image-line.com'], ['Ableton Live','https://www.ableton.com'],
  ['Cubase','https://www.steinberg.net'], ['Reaper','https://www.reaper.fm'],
  ['DaVinci Resolve Studio','https://www.blackmagicdesign.com'],
  ['InShot','https://inshot.com'], ['Filmora','https://filmora.wondershare.com'],
  ['Webflow Designer','https://webflow.com'], ['Framer','https://www.framer.com'],
  ['Elementor','https://elementor.com'], ['Shopify Admin','https://www.shopify.com'],
  ['Wix Studio','https://www.wix.com'], ['Squarespace','https://www.squarespace.com'],
  ['Unity Editor','https://unity.com'], ['Unreal Engine','https://www.unrealengine.com'],
  ['Godot Editor','https://godotengine.org'], ['Tableau Desktop','https://www.tableau.com'],
  ['QuickBooks','https://quickbooks.intuit.com'], ['TallyPrime','https://tallysolutions.com'],
  ['Zoho Books','https://www.zoho.com'], ['SAP ERP','https://www.sap.com'],
];
const catalog = source.map(({ title, slug }) => ({ name: title, slug }));
const known = new Set(catalog.map(item => item.name.toLowerCase()));
for (const [name, website] of additional) if (!known.has(name.toLowerCase())) catalog.push({ name, website });
catalog.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync('src/softwareCatalog.json', `${JSON.stringify(catalog)}\n`);
console.log(`Generated ${catalog.length} searchable software and tool brands.`);
