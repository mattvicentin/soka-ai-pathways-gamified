#!/usr/bin/env python3
"""
Generate clean text files for each pathway with narratives and current links
"""

import json
from datetime import datetime

# Load current nodes
with open('nodes.json', 'r', encoding='utf-8') as f:
    nodes = json.load(f)

# Define pathways
pathways = {
    'prohibitive': {
        'name': 'Prohibitive',
        'emoji': '🔴',
        'description': 'Upholding integrity through AI restrictions',
        'nodes': ['P1', 'P2A', 'P3A', 'P4']
    },
    'balanced': {
        'name': 'Balanced / Literacy',
        'emoji': '🟨',
        'description': 'Teaching ethical and reflective AI use',
        'nodes': ['B1', 'B2A', 'B2B', 'B3A', 'B4']
    },
    'embracing': {
        'name': 'AI-Embracing',
        'emoji': '🟩',
        'description': 'Redesigning for creativity and metacognition',
        'nodes': ['E1', 'E2A', 'E3A', 'E3B', 'E4']
    },
    'collaborative': {
        'name': 'Collaborative',
        'emoji': '🔵',
        'description': 'Co-learning through dialogue and experimentation',
        'nodes': ['C1', 'C2A', 'C2B', 'C3A', 'C4']
    }
}

# Generate a file for each pathway
for pathway_key, pathway_info in pathways.items():
    output = []
    
    # Header
    output.append('═' * 80)
    output.append(f"  {pathway_info['emoji']} SOKA AI PATHWAYS EXPLORER")
    output.append(f"  Pathway: {pathway_info['name'].upper()}")
    output.append(f"  {pathway_info['description']}")
    output.append(f"  Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')}")
    output.append('═' * 80)
    output.append('')
    
    # Process each node
    for node_id in pathway_info['nodes']:
        node = nodes.get(node_id)
        
        if not node:
            output.append(f"⚠️  NODE {node_id} NOT FOUND IN nodes.json")
            output.append('')
            continue
        
        output.append('─' * 80)
        output.append(f"NODE {node_id}: {node.get('title', 'Untitled')}")
        output.append('─' * 80)
        output.append('')
        
        # Narrative
        output.append('NARRATIVE:')
        output.append('')
        output.append(node.get('narrative', 'No narrative available'))
        output.append('')
        output.append('')
        
        # Resources
        resources = node.get('resources', [])
        if resources:
            output.append(f"RESOURCES ({len(resources)}):")
            output.append('')
            for idx, resource in enumerate(resources, 1):
                output.append(f"[{idx}] {resource.get('label', 'N/A')}")
                output.append(f"    {resource.get('url', 'N/A')}")
                output.append(f"    Purpose: {resource.get('why', 'N/A')}")
                output.append('')
        else:
            output.append('RESOURCES: None')
            output.append('')
        
        # Choices
        choices = node.get('choices', [])
        if choices:
            output.append('NEXT CHOICES:')
            for choice in choices:
                output.append(f"  → {choice.get('label', 'N/A')} (goes to: {choice.get('to', 'N/A')})")
            output.append('')
        
        output.append('')
    
    # Summary
    total_resources = sum(len(nodes.get(nid, {}).get('resources', [])) for nid in pathway_info['nodes'] if nid in nodes)
    output.append('═' * 80)
    output.append('PATHWAY SUMMARY')
    output.append('═' * 80)
    output.append(f"Total Nodes: {len([n for n in pathway_info['nodes'] if n in nodes])}")
    output.append(f"Total Resources: {total_resources}")
    output.append('')
    output.append('NOTE: Please verify all links are working before using in workshop.')
    output.append('═' * 80)
    
    # Write file
    filename = f'current-{pathway_key}-pathway.txt'
    with open(filename, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output))
    
    print(f'✅ Created: {filename} ({len([n for n in pathway_info["nodes"] if n in nodes])} nodes, {total_resources} resources)')

print(f'\n📁 All pathway files generated successfully!')

