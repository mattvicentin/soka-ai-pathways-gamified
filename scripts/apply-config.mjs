#!/usr/bin/env node
/**
 * AI Pathways Explorer - Configuration Generator
 * Reads customization workbook and generates config.json and custom-nodes.json
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const WORKBOOK_PATH = process.argv[2] || path.join(projectRoot, 'customization-kit', 'AI-Explorer-Customization.xlsx');
const OUTPUT_DIR = path.join(projectRoot, 'customization-kit', 'output');
const CONFIG_OUTPUT = path.join(OUTPUT_DIR, 'config.json');
const NODES_OUTPUT = path.join(OUTPUT_DIR, 'custom-nodes.json');
const REPORT_OUTPUT = path.join(OUTPUT_DIR, 'validation-report.txt');

console.log('🚀 AI Pathways Configuration Generator\n');
console.log(`Reading workbook: ${WORKBOOK_PATH}\n`);

// Validation helpers
const validationErrors = [];
const validationWarnings = [];

function validateHexColor(color, fieldName) {
  if (!color) return true; // Optional
  const valid = /^#[0-9A-F]{6}$/i.test(color);
  if (!valid) {
    validationErrors.push(`${fieldName}: Invalid hex color "${color}". Must be format #RRGGBB`);
  }
  return valid;
}

function validateUrl(url, fieldName) {
  if (!url) return true; // Optional
  const valid = url.startsWith('http://') || url.startsWith('https://');
  if (!valid) {
    validationErrors.push(`${fieldName}: Invalid URL "${url}". Must start with http:// or https://`);
  }
  return valid;
}

function validateRequired(value, fieldName) {
  const valid = value && value.toString().trim().length > 0;
  if (!valid) {
    validationErrors.push(`${fieldName}: Required field is empty`);
  }
  return valid;
}

// Read workbook
let workbook;
try {
  workbook = XLSX.readFile(WORKBOOK_PATH);
} catch (error) {
  console.error('❌ Error reading workbook:', error.message);
  console.log('\nUsage: node apply-config.mjs [path-to-workbook.xlsx]');
  process.exit(1);
}

console.log('✓ Workbook loaded successfully\n');

// Helper to get sheet data
function getSheet(name) {
  if (!workbook.Sheets[name]) {
    validationWarnings.push(`Sheet "${name}" not found in workbook`);
    return [];
  }
  return XLSX.utils.sheet_to_json(workbook.Sheets[name]);
}

// Extract Branding
console.log('📊 Processing Branding tab...');
const brandingData = getSheet('Branding');
const branding = brandingData[0] || {};

const config = {
  version: '1.0',
  institution: {
    name: branding['Institution Name'] || 'Soka University of America',
    shortName: branding['Institution Short Name'] || 'SUA',
    missionUrl: branding['Mission Page URL'] || 'https://www.soka.edu/about/suas-heritage/mission-and-values'
  },
  branding: {
    primaryColor: branding['Primary Color'] || '#0048B7',
    accentColor: branding['Accent Color'] || '#FCD43B',
    pathwayColors: {
      ignore: branding['Ignore Pathway Color'] || '#F3F4F6',
      prohibitive: branding['Prohibitive Pathway Color'] || '#001D61',
      balanced: branding['Balanced Pathway Color'] || '#FFE20D',
      embracing: branding['Embracing Pathway Color'] || '#249E6B',
      collaborative: branding['Collaborative Pathway Color'] || '#66B0FF'
    }
  },
  values: {},
  resources: {},
  metadata: {
    siteName: branding['Site Name'] || 'AI Pathways Explorer',
    description: branding['Site Description'] || 'Interactive explorer for AI pedagogy approaches'
  }
};

// Validate branding
validateRequired(config.institution.name, 'Institution Name');
validateUrl(config.institution.missionUrl, 'Mission Page URL');
validateHexColor(config.branding.primaryColor, 'Primary Color');
validateHexColor(config.branding.accentColor, 'Accent Color');

console.log(`  Institution: ${config.institution.name}`);
console.log(`  Colors: ${config.branding.primaryColor} / ${config.branding.accentColor}\n`);

// Extract Values
console.log('💎 Processing Values tab...');
const valuesData = getSheet('Values');
const values = valuesData[0] || {};

config.values = {
  motto: values['Mission Motto'] || 'philosophers of a renaissance of life',
  value1: values['Value 1'] || 'humanism',
  value2: values['Value 2'] || 'intercultural dialogue',
  value3: values['Value 3'] || 'pacifism',
  value4: values['Value 4'] || 'contributive lives'
};

console.log(`  Motto: "${config.values.motto}"`);
console.log(`  Values: ${config.values.value1}, ${config.values.value2}, ${config.values.value3}, ${config.values.value4}\n`);

// Extract Resources
console.log('🔗 Processing Resource Library tab...');
const resourcesData = getSheet('Resource Library');
const resources = resourcesData[0] || {};

config.resources = {
  hasResearchCenter: resources['Has Research Center'] === 'Yes' || resources['Has Research Center'] === true,
  researchCenterName: resources['Research Center Name'] || '',
  researchCenterUrl: resources['Research Center URL'] || '',
  hasWritingCenter: resources['Has Writing Center'] === 'Yes' || resources['Has Writing Center'] === true,
  writingCenterName: resources['Writing Center Name'] || 'Writing Center',
  writingCenterUrl: resources['Writing Center URL'] || '',
  integrityPolicyUrl: resources['Academic Integrity Policy URL'] || '',
  integrityPolicyLabel: resources['Academic Integrity Policy Label'] || 'Academic Honesty Policy'
};

// Enforce required URLs when toggles are enabled
if (config.resources.hasResearchCenter) {
  validateRequired(config.resources.researchCenterName, 'Research Center Name');
  validateRequired(config.resources.researchCenterUrl, 'Research Center URL');
  validateUrl(config.resources.researchCenterUrl, 'Research Center URL');
  console.log(`  Research Center: ${config.resources.researchCenterName}`);
}
if (config.resources.hasWritingCenter) {
  validateRequired(config.resources.writingCenterName, 'Writing Center Name');
  validateRequired(config.resources.writingCenterUrl, 'Writing Center URL');
  validateUrl(config.resources.writingCenterUrl, 'Writing Center URL');
  console.log(`  Writing Center: ${config.resources.writingCenterName}`);
}
console.log();

// Extract Node customizations
console.log('📝 Processing Nodes tab...');
const nodesData = getSheet('Nodes');
const customNodes = {};

let processedNodes = 0;
for (const row of nodesData) {
  const nodeId = row['Node ID'];
  if (!nodeId) continue;

  const customNode = {};
  let hasChanges = false;

  // Check for customizations
  if (row['Title']) {
    customNode.title = row['Title'];
    hasChanges = true;
  }
  if (row['Narrative']) {
    customNode.narrative = row['Narrative'];
    hasChanges = true;
  }
  if (row['Path']) {
    customNode.path = row['Path'];
    hasChanges = true;
  }
  if (row['Path Label']) {
    customNode.pathLabel = row['Path Label'];
    hasChanges = true;
  }

  // Resources
  const resources = [];
  for (let i = 1; i <= 5; i++) {
    const label = row[`Resource ${i} Label`];
    const url = row[`Resource ${i} URL`];
    const why = row[`Resource ${i} Why`];
    
    if (label && url) {
      validateUrl(url, `${nodeId} Resource ${i} URL`);
      resources.push({ label, url, why: why || '' });
    }
  }
  if (resources.length > 0) {
    customNode.resources = resources;
    hasChanges = true;
  }

  // Choices
  const choices = [];
  for (let i = 1; i <= 5; i++) {
    const label = row[`Choice ${i} Label`];
    const to = row[`Choice ${i} To`];
    
    if (label && to) {
      choices.push({ label, to });
    }
  }
  if (choices.length > 0) {
    customNode.choices = choices;
    hasChanges = true;
  }

  if (hasChanges) {
    customNodes[nodeId] = customNode;
    processedNodes++;
  }
}

console.log(`  Processed ${processedNodes} node customizations\n`);

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Write outputs
console.log('💾 Writing generated files...');

fs.writeFileSync(CONFIG_OUTPUT, JSON.stringify(config, null, 2), 'utf8');
console.log(`  ✓ ${CONFIG_OUTPUT}`);

fs.writeFileSync(NODES_OUTPUT, JSON.stringify(customNodes, null, 2), 'utf8');
console.log(`  ✓ ${NODES_OUTPUT}`);

// Validation report
const report = [];
report.push('=' .repeat(80));
report.push('AI PATHWAYS EXPLORER - VALIDATION REPORT');
report.push(new Date().toISOString());
report.push('='.repeat(80));
report.push('');

if (validationErrors.length === 0 && validationWarnings.length === 0) {
  report.push('✅ No errors or warnings found!');
  report.push('');
  report.push('Generated files are ready to deploy.');
} else {
  if (validationErrors.length > 0) {
    report.push(`❌ ERRORS (${validationErrors.length}):`);
    report.push('');
    validationErrors.forEach(err => report.push(`  • ${err}`));
    report.push('');
  }
  
  if (validationWarnings.length > 0) {
    report.push(`⚠️  WARNINGS (${validationWarnings.length}):`);
    report.push('');
    validationWarnings.forEach(warn => report.push(`  • ${warn}`));
    report.push('');
  }
}

report.push('='.repeat(80));
report.push('NEXT STEPS:');
report.push('1. Review validation report above');
report.push('2. Copy generated files to project:');
report.push('   cp customization-kit/output/config.json config/');
report.push('   cp customization-kit/output/custom-nodes.json data/');
report.push('3. Test locally: open index.html in browser');
report.push('4. Commit and push to deploy');
report.push('='.repeat(80));

const reportText = report.join('\n');
fs.writeFileSync(REPORT_OUTPUT, reportText, 'utf8');
console.log(`  ✓ ${REPORT_OUTPUT}\n`);

// Print summary
console.log(reportText);

// Exit with error code if validation failed
if (validationErrors.length > 0) {
  console.log('\n❌ Generation completed with errors. Please fix issues before deploying.\n');
  process.exit(1);
} else {
  console.log('\n✅ Generation completed successfully!\n');
  process.exit(0);
}

