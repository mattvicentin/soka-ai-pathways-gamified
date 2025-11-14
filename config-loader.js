/**
 * Configuration loader with graceful fallbacks
 */

const DEFAULT_CONFIG = {
  institution: {
    name: "Soka University of America",
    shortName: "SUA",
    possessive: "Soka's",
    missionUrl: "https://www.soka.edu/about/suas-heritage/mission-and-values",
    missionLinkLabel: "Soka University Mission"
  },
  branding: {
    primaryColor: "#0048B7",
    accentColor: "#FCD43B",
    pathwayColors: {
      ignore: "#F3F4F6",
      prohibitive: "#001D61",
      balanced: "#FFE20D",
      embracing: "#249E6B",
      collaborative: "#66B0FF"
    },
    fonts: {
      heading: "Playfair Display",
      body: "Inter",
      fallback: "Arial"
    }
  },
  values: {
    motto: "philosophers of a renaissance of life",
    value1: "humanism",
    value2: "intercultural dialogue",
    value3: "pacifism",
    value4: "contributive lives",
    principles: [
      "leaders of culture in the community",
      "leaders of humanism in society",
      "leaders of pacifism in the world",
      "creative coexistence of nature and humanity"
    ]
  },
  resources: {
    hasResearchCenter: true,
    researchCenterName: "Pacific Basin Research Center",
    researchCenterUrl: "https://www.soka.edu/academics/research/pacific-basin-research-center/about",
    hasWritingCenter: true,
    writingCenterName: "Writing Center",
    writingCenterUrl: "https://catalog.soka.edu/university-writing-center",
    integrityPolicyUrl: "https://catalog.soka.edu/academic-honesty",
    integrityPolicyLabel: "SUA Academic Honesty Policy",
    instituteUrl: "https://sigs.soka.edu/"
  },
  metadata: {
    siteName: "Soka AI Pathways Explorer",
    description: "Choose-your-own-path explorer for AI in the classroom at Soka University of America",
    workshopYear: 2025
  }
};

export async function loadConfig() {
  try {
    const response = await fetch('./config/config.json', { cache: 'no-store' });
    if (!response.ok) {
      console.log('ℹ️  No custom config found, using Soka defaults');
      return DEFAULT_CONFIG;
    }
    const config = await response.json();
    // Merge with defaults to ensure all fields exist
    return mergeWithDefaults(config, DEFAULT_CONFIG);
  } catch (error) {
    console.log('ℹ️  Error loading config, using Soka defaults:', error.message);
    return DEFAULT_CONFIG;
  }
}

function applyPlaceholders(text, config) {
  if (!text || typeof text !== 'string') return text;
  
  return text
    // Institution
    .replace(/\{\{institution\}\}/g, config.institution.name)
    .replace(/\{\{institution_short\}\}/g, config.institution.shortName)
    .replace(/\{\{institution_possessive\}\}/g, config.institution.possessive)
    .replace(/\{\{mission_label\}\}/g, config.institution.missionLinkLabel)
    // URLs
    .replace(/\{\{mission_url\}\}/g, config.institution.missionUrl)
    .replace(/\{\{integrity_url\}\}/g, config.resources.integrityPolicyUrl)
    .replace(/\{\{research_center_url\}\}/g, config.resources.researchCenterUrl || '')
    .replace(/\{\{writing_center_url\}\}/g, config.resources.writingCenterUrl || '')
    .replace(/\{\{institution_institute_url\}\}/g, config.resources.instituteUrl || 'https://sigs.soka.edu/')
    // Values
    .replace(/\{\{motto\}\}/g, config.values.motto)
    .replace(/\{\{value1\}\}/g, config.values.value1)
    .replace(/\{\{value2\}\}/g, config.values.value2)
    .replace(/\{\{value3\}\}/g, config.values.value3)
    .replace(/\{\{value4\}\}/g, config.values.value4)
    // Resources
    .replace(/\{\{research_center\}\}/g, config.resources.researchCenterName || 'Research Center')
    .replace(/\{\{writing_center\}\}/g, config.resources.writingCenterName || 'Writing Center');
}

export async function loadNodesWithConfig() {
  try {
    // Load config first
    const config = await loadConfig();
    
    // Load base nodes template
    const baseResponse = await fetch('./data/nodes-base.json', { cache: 'no-store' });
    if (!baseResponse.ok) {
      throw new Error('Failed to load base nodes');
    }
    const baseNodes = await baseResponse.json();
    
    // Try to load customizations (optional)
    let customNodes = {};
    try {
      const customResponse = await fetch('./data/custom-nodes.json', { cache: 'no-store' });
      if (customResponse.ok) {
        customNodes = await customResponse.json();
        console.log(`ℹ️  Loaded ${Object.keys(customNodes).length} node customizations`);
      }
    } catch {
      // No custom nodes, that's fine
      console.log('ℹ️  No custom nodes found, using base content');
    }
    
    // Merge: custom overrides base, preserving base defaults for missing fields
    const mergedNodes = {};
    Object.entries(baseNodes).forEach(([id, baseNode]) => {
      let node;
      if (customNodes[id]) {
        // Merge custom with base
        node = {
          id: baseNode.id,
          path: customNodes[id].path || baseNode.path,
          pathLabel: customNodes[id].pathLabel || baseNode.pathLabel,
          title: customNodes[id].title || baseNode.title,
          narrative: customNodes[id].narrative || baseNode.narrative,
          resources: customNodes[id].resources || baseNode.resources || [],
          choices: customNodes[id].choices || baseNode.choices || []
        };
      } else {
        // No customization, use base as-is
        node = { ...baseNode };
      }
      
      // Apply placeholder replacements to text fields
      node.title = applyPlaceholders(node.title, config);
      node.narrative = applyPlaceholders(node.narrative, config);
      node.pathLabel = applyPlaceholders(node.pathLabel, config);
      
      // Apply to resources
      if (node.resources) {
        node.resources = node.resources.map(r => ({
          ...r,
          label: applyPlaceholders(r.label, config),
          why: applyPlaceholders(r.why, config)
        }));
      }
      
      // Apply to choices
      if (node.choices) {
        node.choices = node.choices.map(c => ({
          ...c,
          label: applyPlaceholders(c.label, config)
        }));
      }
      
      mergedNodes[id] = node;
    });
    
    return mergedNodes;
  } catch (error) {
    console.error('Error loading nodes:', error);
    throw error;
  }
}

function mergeWithDefaults(config, defaults) {
  const merged = JSON.parse(JSON.stringify(defaults)); // Deep clone
  
  // Merge each section
  if (config.institution) {
    merged.institution = { ...merged.institution, ...config.institution };
  }
  if (config.branding) {
    merged.branding = {
      ...merged.branding,
      ...config.branding,
      pathwayColors: { ...merged.branding.pathwayColors, ...config.branding.pathwayColors }
    };
  }
  if (config.values) {
    merged.values = { ...merged.values, ...config.values };
  }
  if (config.resources) {
    merged.resources = { ...merged.resources, ...config.resources };
  }
  if (config.metadata) {
    merged.metadata = { ...merged.metadata, ...config.metadata };
  }
  
  return merged;
}

export function applyColorsToDOM(config) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', config.branding.primaryColor);
  root.style.setProperty('--color-accent', config.branding.accentColor);
  root.style.setProperty('--color-ignore', config.branding.pathwayColors.ignore);
  root.style.setProperty('--color-prohibitive', config.branding.pathwayColors.prohibitive);
  root.style.setProperty('--color-balanced', config.branding.pathwayColors.balanced);
  root.style.setProperty('--color-embracing', config.branding.pathwayColors.embracing);
  root.style.setProperty('--color-collaborative', config.branding.pathwayColors.collaborative);
}

