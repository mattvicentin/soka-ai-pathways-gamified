#!/usr/bin/env node
/**
 * Extract pathway narratives and links for review
 * Usage: node extract-pathway-links.js [pathway]
 * pathway options: prohibitive, balanced, embracing, collaborative, all
 */

const fs = require('fs');
const path = require('path');

// Configuration
const pathwayArg = process.argv[2] || 'prohibitive';
const outputFile = `pathway-links-${pathwayArg}.txt`;

// Load nodes
const nodesData = fs.readFileSync('nodes.json', 'utf8');
const nodes = JSON.parse(nodesData);

// Define pathway node IDs
const pathwayNodes = {
  prohibitive: ['P1', 'P2A', 'P3A', 'P4'],
  balanced: ['B1', 'B2A', 'B3A', 'B4'],
  embracing: ['E1', 'E2A', 'E3A', 'E4'],
  collaborative: ['C1', 'C2A', 'C3A', 'C4'],
  all: Object.keys(nodes)
};

// Get the node IDs for the selected pathway
const nodeIds = pathwayNodes[pathwayArg] || pathwayNodes.prohibitive;

// Build output
let output = '';
output += '═'.repeat(80) + '\n';
output += `  SOKA AI PATHWAYS EXPLORER - LINK AUDIT\n`;
output += `  Pathway: ${pathwayArg.toUpperCase()}\n`;
output += `  Generated: ${new Date().toLocaleString()}\n`;
output += '═'.repeat(80) + '\n\n';

// Process each node
nodeIds.forEach((nodeId, index) => {
  const node = nodes[nodeId];
  
  if (!node) {
    output += `⚠️  NODE ${nodeId} NOT FOUND\n\n`;
    return;
  }

  output += '─'.repeat(80) + '\n';
  output += `NODE ${index + 1}: ${nodeId}\n`;
  output += '─'.repeat(80) + '\n\n';
  
  output += `PATH: ${node.pathLabel || 'N/A'}\n`;
  output += `TITLE: ${node.title}\n\n`;
  
  output += `NARRATIVE:\n`;
  output += node.narrative + '\n\n';
  
  if (node.resources && node.resources.length > 0) {
    output += `RESOURCES (${node.resources.length}):\n\n`;
    
    node.resources.forEach((resource, idx) => {
      output += `  [${idx + 1}] ${resource.label}\n`;
      output += `      URL: ${resource.url}\n`;
      if (resource.why) {
        output += `      Why: ${resource.why}\n`;
      }
      output += `      Status: [ ] Working  [ ] 404  [ ] 403  [ ] Other: ________\n`;
      output += '\n';
    });
  } else {
    output += `RESOURCES: None\n\n`;
  }
  
  if (node.choices && node.choices.length > 0) {
    output += `NEXT CHOICES:\n`;
    node.choices.forEach((choice, idx) => {
      output += `  → ${choice.label} (to: ${choice.to})\n`;
    });
    output += '\n';
  }
  
  output += '\n';
});

// Summary statistics
let totalResources = 0;
let uniqueUrls = new Set();

nodeIds.forEach(nodeId => {
  const node = nodes[nodeId];
  if (node && node.resources) {
    totalResources += node.resources.length;
    node.resources.forEach(r => uniqueUrls.add(r.url));
  }
});

output += '═'.repeat(80) + '\n';
output += `SUMMARY\n`;
output += '═'.repeat(80) + '\n';
output += `Nodes analyzed: ${nodeIds.length}\n`;
output += `Total resources: ${totalResources}\n`;
output += `Unique URLs: ${uniqueUrls.size}\n`;
output += '\n';
output += 'INSTRUCTIONS:\n';
output += '1. Check each URL in a browser\n';
output += '2. Mark the status checkboxes\n';
output += '3. Update broken links in nodes.json\n';
output += '4. Re-run this script to generate updated report\n';
output += '\n';

// Write to file
fs.writeFileSync(outputFile, output, 'utf8');
console.log(`✅ Report generated: ${outputFile}`);
console.log(`📊 Analyzed ${nodeIds.length} nodes with ${totalResources} resources`);
console.log(`🔗 Found ${uniqueUrls.size} unique URLs to check`);

