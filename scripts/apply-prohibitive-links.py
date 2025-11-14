#!/usr/bin/env python3
"""
Apply Prohibitive pathway link updates to nodes.json
"""

import json

# Load current nodes
with open('nodes.json', 'r', encoding='utf-8') as f:
    nodes = json.load(f)

print("📖 Applying Prohibitive pathway link updates...\n")

# ============================================================================
# PROHIBITIVE PATHWAY (P1, P2A, P3A, P4)
# ============================================================================

prohibitive_updates = {
    'P1': [
        {
            'label': 'HEPI (2023) — ChatGPT and "AIgiarism"',
            'url': 'https://www.hepi.ac.uk/2023/04/22/artificial-intelligence-chatgpt-and-aigiarism-what-are-the-implications-for-higher-education/',
            'why': 'Institutional and ethical dilemmas of AI bans.'
        },
        {
            'label': 'KQED MindShift (2024) — Why AI Writing Detectors Fail',
            'url': 'https://www.kqed.org/mindshift/60534/why-ai-writing-detectors-fail',
            'why': 'Detection-based policies are unreliable.'
        },
        {
            'label': 'SUA Academic Honesty Policy',
            'url': 'https://catalog.soka.edu/our-mission',
            'why': 'Institutional grounding for integrity.'
        }
    ],
    'P2A': [
        {
            'label': 'TESOL Quarterly (2024) — AI in TESOL',
            'url': 'https://onlinelibrary.wiley.com/journal/15457249',
            'why': 'Equity and ethics in AI translation.'
        },
        {
            'label': 'National Academies (2024) — Toward Human-Centered AI',
            'url': 'https://nap.nationalacademies.org/catalog/27673-toward-human-centered-ai-in-education',
            'why': 'Fairness, language, and inclusion.'
        },
        {
            'label': 'UNESCO (2023) — Guidance for GenAI',
            'url': 'https://unesdoc.unesco.org/ark:/48223/pf0000386693',
            'why': 'Global equity standards for multilingual learning.'
        }
    ],
    'P3A': [
        {
            'label': 'Inside Higher Ed (2024) — False AI Accusations',
            'url': 'https://www.insidehighered.com/news/faculty-issues/2024/02/13/faculty-fallout-false-ai-accusations',
            'why': 'Due-process and trust breakdowns.'
        },
        {
            'label': 'EDUCAUSE Review (2024) — Integrity and Care',
            'url': 'https://er.educause.edu/articles/2024/1/integrity-and-care-rethinking-academic-honesty-in-the-ai-era',
            'why': 'Relational integrity frameworks.'
        },
        {
            'label': 'arXiv (2023) — Contra AI Detection',
            'url': 'https://arxiv.org/abs/2312.05241',
            'why': 'Technical flaws of AI detection tools.'
        }
    ],
    'P4': [
        {
            'label': 'Harvard GSE (2024) — Teaching for Trust',
            'url': 'https://www.gse.harvard.edu/news/2024/02/teaching-trust-age-ai',
            'why': 'Rebuilding trust through ethical pedagogy.'
        },
        {
            'label': 'OECD (2024) — AI & Future of Learning',
            'url': 'https://www.oecd.org/en/publications/ai-and-the-future-of-learning-education-2030.html',
            'why': 'Balancing innovation with integrity.'
        },
        {
            'label': 'SUA Mission & Values',
            'url': 'https://www.soka.edu/about/suas-heritage/mission-and-values',
            'why': 'Connects ethical learning to fostering contributive lives.'
        }
    ]
}

# Apply updates
updates_made = 0
for node_id, new_resources in prohibitive_updates.items():
    if node_id in nodes:
        old_count = len(nodes[node_id].get('resources', []))
        nodes[node_id]['resources'] = new_resources
        new_count = len(new_resources)
        print(f"✓ {node_id}: {old_count} → {new_count} resources")
        updates_made += 1
    else:
        print(f"⚠️  Node {node_id} not found")

# Write updated nodes.json
with open('nodes.json', 'w', encoding='utf-8') as f:
    json.dump(nodes, f, indent=2, ensure_ascii=False)

print(f"\n✅ Successfully updated {updates_made} Prohibitive pathway nodes")
print("\n💡 Next steps:")
print("   1. git diff nodes.json")
print("   2. Test locally: open index.html")
print("   3. git add nodes.json && git commit -m 'Update Prohibitive pathway resource links'")
print("   4. git push origin main")

