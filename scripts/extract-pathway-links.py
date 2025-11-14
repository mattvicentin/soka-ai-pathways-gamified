#!/usr/bin/env python3
"""
Extract pathway narratives and links for review
Usage: python3 extract-pathway-links.py [pathway]
pathway options: prohibitive, balanced, embracing, collaborative, all
"""

import json
import sys
from datetime import datetime

# Configuration
pathway_arg = sys.argv[1] if len(sys.argv) > 1 else 'prohibitive'
output_file = f'pathway-links-{pathway_arg}.txt'

# Load nodes
with open('nodes.json', 'r', encoding='utf-8') as f:
    nodes = json.load(f)

# Define pathway node IDs
pathway_nodes = {
    'prohibitive': ['P1', 'P2A', 'P3A', 'P4'],
    'balanced': ['B1', 'B2A', 'B3A', 'B4'],
    'embracing': ['E1', 'E2A', 'E3A', 'E4'],
    'collaborative': ['C1', 'C2A', 'C3A', 'C4'],
    'all': list(nodes.keys())
}

# Get the node IDs for the selected pathway
node_ids = pathway_nodes.get(pathway_arg, pathway_nodes['prohibitive'])

# Build output
output = []
output.append('═' * 80)
output.append(f'  SOKA AI PATHWAYS EXPLORER - LINK AUDIT')
output.append(f'  Pathway: {pathway_arg.upper()}')
output.append(f'  Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
output.append('═' * 80)
output.append('')

# Process each node
for index, node_id in enumerate(node_ids, 1):
    node = nodes.get(node_id)
    
    if not node:
        output.append(f'⚠️  NODE {node_id} NOT FOUND')
        output.append('')
        continue
    
    output.append('─' * 80)
    output.append(f'NODE {index}: {node_id}')
    output.append('─' * 80)
    output.append('')
    
    output.append(f'PATH: {node.get("pathLabel", "N/A")}')
    output.append(f'TITLE: {node.get("title", "N/A")}')
    output.append('')
    
    output.append('NARRATIVE:')
    output.append(node.get('narrative', 'N/A'))
    output.append('')
    
    resources = node.get('resources', [])
    if resources:
        output.append(f'RESOURCES ({len(resources)}):')
        output.append('')
        
        for idx, resource in enumerate(resources, 1):
            output.append(f'  [{idx}] {resource.get("label", "N/A")}')
            output.append(f'      URL: {resource.get("url", "N/A")}')
            if resource.get('why'):
                output.append(f'      Why: {resource["why"]}')
            output.append(f'      Status: [ ] Working  [ ] 404  [ ] 403  [ ] Other: ________')
            output.append('')
    else:
        output.append('RESOURCES: None')
        output.append('')
    
    choices = node.get('choices', [])
    if choices:
        output.append('NEXT CHOICES:')
        for choice in choices:
            output.append(f'  → {choice.get("label", "N/A")} (to: {choice.get("to", "N/A")})')
        output.append('')
    
    output.append('')

# Summary statistics
total_resources = 0
unique_urls = set()

for node_id in node_ids:
    node = nodes.get(node_id)
    if node and node.get('resources'):
        total_resources += len(node['resources'])
        for r in node['resources']:
            unique_urls.add(r.get('url', ''))

output.append('═' * 80)
output.append('SUMMARY')
output.append('═' * 80)
output.append(f'Nodes analyzed: {len(node_ids)}')
output.append(f'Total resources: {total_resources}')
output.append(f'Unique URLs: {len(unique_urls)}')
output.append('')
output.append('INSTRUCTIONS:')
output.append('1. Check each URL in a browser')
output.append('2. Mark the status checkboxes')
output.append('3. Update broken links in nodes.json')
output.append('4. Re-run this script to generate updated report')
output.append('')

# Write to file
with open(output_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(output))

print(f'✅ Report generated: {output_file}')
print(f'📊 Analyzed {len(node_ids)} nodes with {total_resources} resources')
print(f'🔗 Found {len(unique_urls)} unique URLs to check')

