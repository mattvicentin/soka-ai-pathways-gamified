#!/usr/bin/env python3
"""
Generate Nodes tab CSV from nodes-base.json
"""

import json
import csv
import os

# Paths
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
nodes_path = os.path.join(project_root, 'data', 'nodes-base.json')
output_path = os.path.join(project_root, 'customization-kit', '04-Nodes.csv')

# Load nodes
with open(nodes_path, 'r', encoding='utf-8') as f:
    nodes = json.load(f)

# CSV headers
headers = [
    'Node ID', 'Title', 'Path', 'Path Label', 'Narrative',
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
]

# Generate rows
rows = [headers]

for node_id, node in nodes.items():
    row = [
        node_id,
        node.get('title', ''),
        node.get('path', ''),
        node.get('pathLabel', ''),
        node.get('narrative', '')
    ]
    
    # Resources (up to 5)
    resources = node.get('resources', [])
    for i in range(5):
        if i < len(resources):
            r = resources[i]
            row.extend([
                r.get('label', ''),
                r.get('url', ''),
                r.get('why', '')
            ])
        else:
            row.extend(['', '', ''])
    
    # Choices (up to 5)
    choices = node.get('choices', [])
    for i in range(5):
        if i < len(choices):
            c = choices[i]
            row.extend([
                c.get('label', ''),
                c.get('to', '')
            ])
        else:
            row.extend(['', ''])
    
    rows.append(row)

# Write CSV
with open(output_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f'✅ Generated {output_path}')
print(f'📊 {len(rows) - 1} nodes exported')


