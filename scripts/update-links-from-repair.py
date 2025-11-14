#!/usr/bin/env python3
"""
Update nodes.json with corrected links from pathway repair markdown files
"""

import json
import re

# Load current nodes
with open('nodes.json', 'r', encoding='utf-8') as f:
    nodes = json.load(f)

# Parse repair markdown files
def parse_repair_markdown(filepath):
    """Extract links from a repair markdown file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all node sections
    node_pattern = r'## 🧭 Node ([A-Z0-9]+) —[^\n]*\n\*([^\*]+)\*\n\n(.*?)(?=\n---|\n## |$)'
    matches = re.findall(node_pattern, content, re.DOTALL)
    
    resources_by_node = {}
    
    for node_id, description, resources_section in matches:
        resources = []
        
        # Extract each resource
        resource_pattern = r'-\s+\*\*([^\*]+)\*\*\s+—\s+\[([^\]]+)\]\(([^\)]+)\)\s+\*([^\*]+)\*'
        resource_matches = re.findall(resource_pattern, resources_section)
        
        for source, label, url, why in resource_matches:
            resources.append({
                'label': f'{source} — {label}',
                'url': url.strip(),
                'why': why.strip()
            })
        
        if resources:
            resources_by_node[node_id] = resources
    
    return resources_by_node

# Parse all repair files
print("📖 Parsing repair markdown files...")

pathways = {
    'Prohibitive': 'Prohibitive_Pathway_Link_Repair.md',
    'Balanced': 'Balanced_Pathway_Link_Repair.md',
    'Embracing': 'Embracing_Pathway_Link_Repair.md',
    'Collaborative': 'Collaborative_Pathway_Link_Repair.md'
}

all_updates = {}
for pathway_name, filepath in pathways.items():
    try:
        updates = parse_repair_markdown(filepath)
        all_updates.update(updates)
        print(f"✓ Parsed {pathway_name}: {len(updates)} nodes")
    except Exception as e:
        print(f"⚠️  Error parsing {filepath}: {e}")

# Show what will be updated
print(f"\n📊 Summary: {len(all_updates)} nodes will be updated")
print("\nNodes to update:", sorted(all_updates.keys()))

# Ask for confirmation
print("\n" + "="*80)
response = input("Update nodes.json with these links? (yes/no): ").strip().lower()

if response == 'yes':
    updates_made = 0
    for node_id, new_resources in all_updates.items():
        if node_id in nodes:
            old_count = len(nodes[node_id].get('resources', []))
            nodes[node_id]['resources'] = new_resources
            new_count = len(new_resources)
            print(f"✓ Updated {node_id}: {old_count} → {new_count} resources")
            updates_made += 1
        else:
            print(f"⚠️  Node {node_id} not found in nodes.json")
    
    # Write updated nodes.json
    with open('nodes.json', 'w', encoding='utf-8') as f:
        json.dump(nodes, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Successfully updated {updates_made} nodes in nodes.json")
    print("💡 Next steps:")
    print("   1. Review changes: git diff nodes.json")
    print("   2. Test locally: open index.html")
    print("   3. Commit: git add nodes.json && git commit -m 'Fix broken resource links'")
    print("   4. Push: git push origin main")
else:
    print("❌ Update cancelled")

