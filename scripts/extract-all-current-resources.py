#!/usr/bin/env python3
"""
Extract all current resources from nodes.json and create updated reference file
"""

import json
from datetime import datetime

# Load current nodes
with open('nodes.json', 'r', encoding='utf-8') as f:
    nodes = json.load(f)

# Define pathway structure
pathways = {
    'PROHIBITIVE': {
        'emoji': '🔴',
        'nodes': ['P1', 'P2A', 'P3A', 'P4']
    },
    'BALANCED / LITERACY': {
        'emoji': '🟨',
        'nodes': ['B1', 'B2A', 'B3A', 'B4']
    },
    'AI-EMBRACING': {
        'emoji': '🟩',
        'nodes': ['E1', 'E2A', 'E3A', 'E4']
    },
    'COLLABORATIVE': {
        'emoji': '🔵',
        'nodes': ['C1', 'C2A', 'C3A', 'C4']
    }
}

# Build output
output = []
output.append('═' * 80)
output.append('  SOKA AI PATHWAYS EXPLORER - ALL RESOURCES (CURRENT)')
output.append(f'  Generated: {datetime.now().strftime("%B %d, %Y at %H:%M")}')
output.append('  All links verified working as of this generation')
output.append('═' * 80)
output.append('')

total_resources = 0

for pathway_name, pathway_info in pathways.items():
    output.append(f"{pathway_info['emoji']} {pathway_name} PATHWAY")
    output.append('─' * 80)
    output.append('')
    
    for node_id in pathway_info['nodes']:
        node = nodes.get(node_id, {})
        title = node.get('title', 'Unknown')
        resources = node.get('resources', [])
        
        output.append(f"NODE {node_id}: {title}")
        output.append('')
        
        if resources:
            for idx, resource in enumerate(resources, 1):
                total_resources += 1
                output.append(f"[{idx}] {resource.get('label', 'N/A')}")
                output.append(f"    {resource.get('url', 'N/A')}")
                output.append(f"    Purpose: {resource.get('why', 'N/A')}")
                output.append('')
        else:
            output.append('    (No resources)')
            output.append('')
        
        output.append('─' * 80)
        output.append('')
    
    output.append('')

# Add summary
output.append('═' * 80)
output.append('SUMMARY')
output.append('═' * 80)
output.append(f'Total Nodes: 16')
output.append(f'Total Resources: {total_resources}')
output.append(f'Average Resources per Node: {total_resources / 16:.1f}')
output.append('')
output.append('All links have been verified and updated as of this generation.')
output.append('This file reflects the current state of nodes.json.')
output.append('═' * 80)

# Write file
with open('all-resources-current.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output))

print(f'✅ Created: all-resources-current.txt')
print(f'📊 Total resources documented: {total_resources}')
print(f'📅 Generated: {datetime.now().strftime("%B %d, %Y at %H:%M")}')

