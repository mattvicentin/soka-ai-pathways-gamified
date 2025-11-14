#!/usr/bin/env node
/**
 * Validate config.json and custom-nodes.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const CONFIG_PATH = path.join(projectRoot, 'config', 'config.json');
const NODES_PATH = path.join(projectRoot, 'data', 'custom-nodes.json');

console.log('🔍 Validating Configuration Files\n');

const errors = [];
const warnings = [];

// Validate hex color
function isValidHex(color) {
  return /^#[0-9A-F]{6}$/i.test(color);
}

// Validate URL
function isValidUrl(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}

// Load and validate config
try {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  
  console.log('Validating config.json...');
  
  // Required fields
  if (!config.institution?.name) errors.push('Missing institution name');
  if (!config.institution?.missionUrl) errors.push('Missing mission URL');
  else if (!isValidUrl(config.institution.missionUrl)) errors.push('Invalid mission URL');
  
  // Colors
  if (!isValidHex(config.branding?.primaryColor)) errors.push('Invalid primary color');
  if (!isValidHex(config.branding?.accentColor)) errors.push('Invalid accent color');
  
  // Optional pathway colors
  Object.entries(config.branding?.pathwayColors || {}).forEach(([path, color]) => {
    if (color && !isValidHex(color)) warnings.push(`Invalid ${path} pathway color`);
  });
  
  // Values
  if (!config.values?.motto) warnings.push('Missing mission motto');
  
  console.log(`  ✓ Checked ${Object.keys(config).length} config sections\n`);
  
} catch (error) {
  errors.push(`Cannot read config.json: ${error.message}`);
}

// Load and validate custom nodes
try {
  if (fs.existsSync(NODES_PATH)) {
    const nodes = JSON.parse(fs.readFileSync(NODES_PATH, 'utf8'));
    
    console.log('Validating custom-nodes.json...');
    
    const nodeCount = Object.keys(nodes).length;
    let resourceCount = 0;
    let choiceCount = 0;
    
    Object.entries(nodes).forEach(([id, node]) => {
      // Validate resources
      if (node.resources) {
        node.resources.forEach((r, i) => {
          if (!r.label) warnings.push(`${id} resource ${i+1}: Missing label`);
          if (!r.url) warnings.push(`${id} resource ${i+1}: Missing URL`);
          else if (!isValidUrl(r.url)) errors.push(`${id} resource ${i+1}: Invalid URL`);
          resourceCount++;
        });
      }
      
      // Validate choices
      if (node.choices) {
        node.choices.forEach((c, i) => {
          if (!c.label) warnings.push(`${id} choice ${i+1}: Missing label`);
          if (!c.to) errors.push(`${id} choice ${i+1}: Missing destination`);
          choiceCount++;
        });
      }
    });
    
    console.log(`  ✓ Validated ${nodeCount} nodes, ${resourceCount} resources, ${choiceCount} choices\n`);
  } else {
    console.log('ℹ️  No custom-nodes.json found (no customizations applied)\n');
  }
  
} catch (error) {
  errors.push(`Cannot read custom-nodes.json: ${error.message}`);
}

// Print results
console.log('='.repeat(80));
console.log('VALIDATION RESULTS');
console.log('='.repeat(80));

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ All validations passed!\n');
  console.log('Files are ready to deploy.\n');
} else {
  if (errors.length > 0) {
    console.log(`\n❌ ERRORS (${errors.length}):\n`);
    errors.forEach(err => console.log(`  • ${err}`));
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):\n`);
    warnings.forEach(warn => console.log(`  • ${warn}`));
  }
  
  console.log('');
}

console.log('='.repeat(80));

process.exit(errors.length > 0 ? 1 : 0);

