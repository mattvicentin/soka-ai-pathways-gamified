#!/usr/bin/env python3
"""
Convert nodes.json to use template placeholders
Run from repository root
"""

import json
import sys
import re

# Load nodes
with open('nodes.json') as f:
    content = f.read()

# IMPORTANT: Order matters - do specific phrases before general ones

# Institution references
content = content.replace('Soka University of America', '{{institution}}')
content = content.replace("Soka's", '{{institution_possessive}}')
content = content.replace('Soka education', '{{institution_short}} education')
content = content.replace('Soka University Mission', '{{mission_label}}')

# Possessive forms (after Soka's replacement)
content = content.replace("SUA's", "{{institution_short}}'s")
content = content.replace("{{institution_short}}'s vision", "{{institution_possessive}} vision")

# Mission/values - specific to general
content = content.replace('philosophers of a renaissance of life', '{{motto}}')

# Values - do phrases before individual words
content = content.replace('leaders of humanism', 'leaders of {{value1}}')
content = content.replace('fostering leaders of culture in the community, humanism', 'fostering leaders of culture in the community, {{value1}}')
content = content.replace('leaders of pacifism', 'leaders of {{value3}}')
content = content.replace('pacifism and humanism', '{{value3}} and {{value1}}')

# Then individual value words (these may appear in different contexts)
content = content.replace('humanism', '{{value1}}')
content = content.replace('intercultural dialogue', '{{value2}}')
content = content.replace('pacifism', '{{value3}}')
content = content.replace('contributive lives', '{{value4}}')

# Institutional resources
content = content.replace('Pacific Basin Research Center', '{{research_center}}')
content = content.replace('{{writing_center}} to host', '{{writing_center}} to host')  # Already done
content = content.replace('Writing Center', '{{writing_center}}')

# Verify JSON is still valid
try:
    nodes = json.loads(content)
    print(f'✓ Valid JSON with {len(nodes)} nodes')
    
    # Count placeholders
    placeholder_count = len(re.findall(r'\{\{[^}]+\}\}', content))
    print(f'✓ Added {placeholder_count} placeholders')
    
    # Save
    with open('nodes.json', 'w') as f:
        f.write(content)
    print('✓ Updated nodes.json with placeholders')
    
except json.JSONDecodeError as e:
    print(f'❌ JSON error: {e}')
    print('Not saving - manual fix needed')
    sys.exit(1)

