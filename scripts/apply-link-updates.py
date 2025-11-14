#!/usr/bin/env python3
"""
Apply link updates from repair markdown files to nodes.json
Usage: python3 apply-link-updates.py [--dry-run]
"""

import json
import re
import sys

DRY_RUN = '--dry-run' in sys.argv

# Load current nodes
with open('nodes.json', 'r', encoding='utf-8') as f:
    nodes = json.load(f)

print("📖 Reading repair markdown files...\n")

# ============================================================================
# BALANCED PATHWAY (B1, B2A, B3A, B4)
# ============================================================================

balanced_updates = {
    'B1': [
        {
            'label': 'EDUCAUSE Review (2024) — A Framework for AI Literacy',
            'url': 'https://er.educause.edu/articles/2024/6/a-framework-for-ai-literacy',
            'why': 'Foundational model for curricular framing.'
        },
        {
            'label': 'UNESCO (2023) — Guidance for GenAI in Education',
            'url': 'https://unesdoc.unesco.org/ark:/48223/pf0000386693',
            'why': 'Global ethical principles.'
        },
        {
            'label': 'Soka University Mission Statement',
            'url': 'https://www.soka.edu/about/mission',
            'why': 'Frames AI use as global citizenship.'
        }
    ],
    'B2A': [
        {
            'label': 'EDUCAUSE Review (2024) — Teaching AI Literacy & Ethics',
            'url': 'https://er.educause.edu/articles/2024/10/teaching-ai-literacy-and-ethics',
            'why': 'Classroom practices.'
        },
        {
            'label': 'National Academies (2024) — Toward Human-Centered AI',
            'url': 'https://nap.nationalacademies.org/catalog/27673-toward-human-centered-ai-in-education',
            'why': 'Ethics in educational AI.'
        },
        {
            'label': 'Soka CTLE — Reflection-Based Integrity Assignments',
            'url': 'https://www.soka.edu/academics/undergraduate-programs/writing-center',
            'why': 'Guidance on reflection-based integrity.'
        }
    ],
    'B3A': [
        {
            'label': 'Inside Higher Ed (2025) — Shaping the Future Before It Shapes Us',
            'url': 'https://www.insidehighered.com/opinion/columns/learning-innovation/2025/03/04/ai-and-education-shaping-future-it-shapes-us',
            'why': 'Guidance-based policies.'
        },
        {
            'label': 'Inside Higher Ed (2025) — Students\' Views on AI',
            'url': 'https://www.insidehighered.com/news/students/academics/2025/08/29/survey-college-students-views-ai',
            'why': 'Transparency & self-regulation.'
        },
        {
            'label': 'EDUCAUSE Review (2025) — Developing AI Policies with Trust',
            'url': 'https://er.educause.edu/articles/2025/4/developing-ai-policies-with-transparency-and-trust',
            'why': 'Faculty resource for policy language.'
        }
    ],
    'B4': [
        {
            'label': 'Harvard GSE (2024) — Teaching Reflective Judgment',
            'url': 'https://www.gse.harvard.edu/news/2024/02/teaching-reflective-judgment-ai-era',
            'why': 'Reflection as literacy.'
        },
        {
            'label': 'OECD (2024) — AI & Future of Learning',
            'url': 'https://www.oecd.org/en/publications/ai-and-the-future-of-learning-education-2030.html',
            'why': 'Responsible integration.'
        },
        {
            'label': 'Soka University Mission Statement',
            'url': 'https://www.soka.edu/about/mission',
            'why': 'Connects ethical literacy to contributive lives.'
        }
    ]
}

# ============================================================================
# EMBRACING PATHWAY (E1, E2A, E3A, E4)
# ============================================================================

embracing_updates = {
    'E1': [
        {
            'label': 'TEQSA (2025) — Assessment Redesign',
            'url': 'https://www.teqsa.gov.au/latest-news/articles/assessment-redesign-authentic-learning-age-ai',
            'why': 'Authentic, process-based assessment.'
        },
        {
            'label': 'EDUCAUSE Review (2024) — Beyond Integrity',
            'url': 'https://er.educause.edu/articles/2024/8/beyond-integrity-designing-ai-for-learning',
            'why': 'Integrating AI as learning tool.'
        },
        {
            'label': 'Soka University Mission Statement',
            'url': 'https://www.soka.edu/about/mission',
            'why': 'Links creative redesign to wisdom and global citizenship.'
        }
    ],
    'E2A': [
        {
            'label': 'Inside Higher Ed (2024) — Professors Pioneer AI-Assisted Drafting',
            'url': 'https://www.insidehighered.com/news/faculty-issues/2024/04/22/professors-pioneer-ai-assisted-drafting',
            'why': 'Transparent AI integration.'
        },
        {
            'label': 'Harvard GSE (2024) — Metacognition and AI',
            'url': 'https://www.gse.harvard.edu/news/2024/03/metacognition-and-ai-helping-students-think-about-thinking',
            'why': 'How reflection on process deepens learning.'
        },
        {
            'label': 'UNESCO (2023) — GenAI in Education',
            'url': 'https://unesdoc.unesco.org/ark:/48223/pf0000386693',
            'why': 'Human-centered pedagogy.'
        }
    ],
    'E3A': [
        {
            'label': 'OECD (2024) — 10 Guidelines',
            'url': 'https://www.oecd.org/en/publications/ai-and-the-future-of-learning-education-2030.html',
            'why': 'Assessment reform.'
        },
        {
            'label': 'EDUCAUSE (2025) — Redefining Assessment',
            'url': 'https://er.educause.edu/articles/2025/1/redefining-assessment-authentic-learning',
            'why': 'Reflection-focused rubrics.'
        },
        {
            'label': 'Soka CTLE — Reflective Portfolios & Learning Journals',
            'url': 'https://www.soka.edu/faculty-resources',
            'why': 'Process-focused assessment design.'
        }
    ],
    'E4': [
        {
            'label': 'Inside Higher Ed (2025) — AI-Ready Classroom',
            'url': 'https://www.insidehighered.com/opinion/views/2025/03/17/ai-ready-classroom-faculty-reflections-redesign',
            'why': 'Faculty reflections on redesign.'
        },
        {
            'label': 'EDUCAUSE Review (2025) — Faculty Voices',
            'url': 'https://er.educause.edu/articles/2025/2/faculty-voices-authentic-ai-learning-in-practice',
            'why': 'Authentic learning with AI.'
        },
        {
            'label': 'Soka University Mission Statement',
            'url': 'https://www.soka.edu/about/mission',
            'why': 'Connects authentic learning to wisdom, courage, and compassion.'
        }
    ]
}

# ============================================================================
# COLLABORATIVE PATHWAY (C1, C2A, C3A, C4)
# ============================================================================

collaborative_updates = {
    'C1': [
        {
            'label': 'EDUCAUSE Review (2024) — Culture of AI Dialogue',
            'url': 'https://er.educause.edu/articles/2024/9/building-a-culture-of-ai-dialogue-in-higher-education',
            'why': 'Participatory norms.'
        },
        {
            'label': 'UNESCO (2023) — Guidance for GenAI',
            'url': 'https://unesdoc.unesco.org/ark:/48223/pf0000386693',
            'why': 'Ethical participation.'
        },
        {
            'label': 'Soka University Mission Statement',
            'url': 'https://www.soka.edu/about/suas-heritage/mission-and-values',
            'why': 'Frames education as dialogical and humanistic.'
        }
    ],
    'C2A': [
        {
            'label': 'Inside Higher Ed (2024) — Co-Created Frameworks',
            'url': 'https://www.insidehighered.com/news/faculty-issues/2024/05/10/students-and-faculty-co-create-ai-frameworks',
            'why': 'Collaborative literacy.'
        },
        {
            'label': 'EDUCAUSE (2025) — AI Learning Logs',
            'url': 'https://er.educause.edu/articles/2025/3/ai-learning-logs-reflection-and-transparency-in-practice',
            'why': 'Transparency & reflection.'
        },
        {
            'label': 'Soka CTLE — Co-Designing Classroom Norms',
            'url': 'https://sigs.soka.edu/project_category/global-citizenship-education/',
            'why': 'Faculty-student partnership in course design.'
        }
    ],
    'C3A': [
        {
            'label': 'Harvard GSE — Faculty Learning Communities',
            'url': 'https://www.gse.harvard.edu/news/2024/09/faculty-learning-communities-ai-innovation',
            'why': 'Peer collaboration.'
        },
        {
            'label': 'EDUCAUSE (2025) — Faculty Learning Networks',
            'url': 'https://er.educause.edu/articles/2025/1/faculty-learning-networks-scaling-innovation-in-teaching-with-ai',
            'why': 'Scaling innovation.'
        },
        {
            'label': 'Soka CTLE — Faculty Learning Cluster Program',
            'url': 'https://www.soka.edu/news-events/news/fostering-global-citizens-every-grade-level-sua-alumni-reunite-sigs-education',
            'why': 'Connects faculty experimentation to institutional learning.'
        }
    ],
    'C4': [
        {
            'label': 'Inside Higher Ed (2025) — Dialogue as Curriculum',
            'url': 'https://www.insidehighered.com/opinion/views/2025/04/15/when-dialogue-becomes-curriculum',
            'why': 'Dialogic practice.'
        },
        {
            'label': 'OECD (2024) — Collaborative Teaching Models',
            'url': 'https://www.oecd.org/en/publications/ai-and-the-future-of-learning-education-2030.html',
            'why': 'Equity & trust data.'
        },
        {
            'label': 'Soka University Mission Statement',
            'url': 'https://www.soka.edu/about/suas-heritage/mission-and-values',
            'why': 'Connects dialogue-centered pedagogy to fostering global citizens.'
        }
    ]
}

# Merge all updates
all_updates = {**balanced_updates, **embracing_updates, **collaborative_updates}

# Apply updates
updates_made = 0
for node_id, new_resources in all_updates.items():
    if node_id in nodes:
        old_count = len(nodes[node_id].get('resources', []))
        if not DRY_RUN:
            nodes[node_id]['resources'] = new_resources
        new_count = len(new_resources)
        print(f"✓ {node_id}: {old_count} → {new_count} resources")
        updates_made += 1
    else:
        print(f"⚠️  Node {node_id} not found")

if DRY_RUN:
    print(f"\n🔍 DRY RUN: Would update {updates_made} nodes")
    print("Run without --dry-run to apply changes")
else:
    # Write updated nodes.json
    with open('nodes.json', 'w', encoding='utf-8') as f:
        json.dump(nodes, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Successfully updated {updates_made} nodes")
    print("\n💡 Next steps:")
    print("   1. git diff nodes.json")
    print("   2. Test locally: open index.html")
    print("   3. git add nodes.json && git commit -m 'Update resource links with verified URLs'")
    print("   4. git push origin main")

