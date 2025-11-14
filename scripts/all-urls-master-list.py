#!/usr/bin/env python3
"""
Generate a master list of all unique URLs across all pathways for quick checking
"""

import json
from datetime import datetime

# Load nodes
with open('nodes.json', 'r', encoding='utf-8') as f:
    nodes = json.load(f)

# Collect all URLs with their context
url_data = {}

for node_id, node in nodes.items():
    resources = node.get('resources', [])
    for resource in resources:
        url = resource.get('url', '')
        if url and url not in url_data:
            url_data[url] = {
                'label': resource.get('label', 'N/A'),
                'nodes': []
            }
        if url:
            url_data[url]['nodes'].append(node_id)

# Build output
output = []
output.append('═' * 80)
output.append('  SOKA AI PATHWAYS EXPLORER - MASTER URL LIST')
output.append(f'  Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
output.append(f'  Total Unique URLs: {len(url_data)}')
output.append('═' * 80)
output.append('')
output.append('CHECK EACH URL AND MARK STATUS:')
output.append('')

for idx, (url, data) in enumerate(sorted(url_data.items()), 1):
    output.append(f'[{idx:2d}] {data["label"]}')
    output.append(f'     URL: {url}')
    output.append(f'     Used in nodes: {", ".join(sorted(data["nodes"]))}')
    output.append(f'     Status: [ ] ✓ Working  [ ] 404  [ ] 403  [ ] Other: ________')
    output.append('')

output.append('═' * 80)
output.append('NEXT STEPS:')
output.append('1. Open each URL in browser (Cmd+Click on Mac)')
output.append('2. Mark status checkbox')
output.append('3. For broken links, find replacement URLs')
output.append('4. Update nodes.json with corrected URLs')
output.append('5. Run: git diff nodes.json  (to review changes)')
output.append('6. Commit and push updated links')
output.append('═' * 80)

# Write to file
with open('all-urls-master-list.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output))

print(f'✅ Master URL list generated: all-urls-master-list.txt')
print(f'🔗 Total unique URLs to check: {len(url_data)}')

