#!/usr/bin/env node
/**
 * Generate Nodes tab CSV from nodes-base.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const nodesPath = path.join(projectRoot, 'data', 'nodes-base.json');
const outputPath = path.join(projectRoot, 'customization-kit', '04-Nodes.csv');

const nodes = JSON.parse(fs.readFileSync(nodesPath, 'utf8'));

// CSV header
const headers = [
  'Node ID',
  'Title',
  'Path',
  'Path Label',
  'Narrative',
  'Resource 1 Label', 'Resource 1 URL', 'Resource 1 Why',
  'Resource 2 Label', 'Resource 2 URL', 'Resource 2 Why',
  'Resource 3 Label', 'Resource 3 URL', 'Resource 3 Why',
  'Resource 4 Label', 'Resource 4 URL', 'Resource 4 Why',
  'Resource 5 Label', 'Resource 5 URL', 'Resource 5 Why',
  'Choice 1 Label', 'Choice 1 To',
  'Choice 2 Label', 'Choice 2 To',
  'Choice 3 Label', 'Choice 3 To',
  'Choice 4 Label', 'Choice 4 To',
  'Choice 5 Label', 'Choice 5 To'
];

const rows = [headers];

// Process each node
Object.entries(nodes).forEach(([id, node]) => {
  const row = [
    id,
    node.title || '',
    node.path || '',
    node.pathLabel || '',
    node.narrative || ''
  ];
  
  // Resources (up to 5)
  for (let i = 0; i < 5; i++) {
    const resource = node.resources?.[i];
    row.push(
      resource?.label || '',
      resource?.url || '',
      resource?.why || ''
    );
  }
  
  // Choices (up to 5)
  for (let i = 0; i < 5; i++) {
    const choice = node.choices?.[i];
    row.push(
      choice?.label || '',
      choice?.to || ''
    );
  }
  
  rows.push(row);
});

// Escape CSV fields
function escapeCSV(field) {
  if (field === null || field === undefined) return '';
  const str = field.toString();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Write CSV
const csv = rows.map(row => row.map(escapeCSV).join(',')).join('\n');
fs.writeFileSync(outputPath, csv, 'utf8');

console.log(`✅ Generated ${outputPath}`);
console.log(`📊 ${rows.length - 1} nodes exported\n`);


