/**
 * NodeManager - Loads and processes nodes from the main app
 * Reuses the existing config-loader logic
 */

export class NodeManager {
  constructor() {
    this.nodes = {};
    this.originalNodes = {}; // Store original unprocessed nodes for re-applying placeholders
    this.config = {};
    this.currentNodeId = 'D1';
    this.trail = [];
  }

  async loadNodes() {
    try {
      // Load configuration
      this.config = await this.loadConfig();
      
      // Load nodes with config placeholders applied
      this.nodes = await this.loadNodesWithConfig();
      
      console.log(`✓ Loaded ${Object.keys(this.nodes).length} nodes`);
      return true;
    } catch (error) {
      console.error('Error loading nodes:', error);
      throw error;
    }
  }

  async loadConfig() {
    try {
      const response = await fetch('./config/config.json', { cache: 'no-store' });
      if (!response.ok) {
        console.log('Using default Soka config');
        return this.getDefaultConfig();
      }
      return await response.json();
    } catch (error) {
      console.log('Config load error, using defaults:', error.message);
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      institution: {
        name: "Soka University of America",
        shortName: "SUA",
        possessive: "Soka's",
        missionUrl: "https://www.soka.edu/about/suas-heritage/mission-and-values",
        missionLinkLabel: "Soka University Mission"
      },
      email: {
        primaryRecipient: "", // Empty by default - must be set via customization
        ccRecipient: ""
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
        }
      },
      values: {
        motto: "philosophers of a renaissance of life",
        value1: "humanism",
        value2: "intercultural dialogue",
        value3: "pacifism",
        value4: "contributive lives"
      },
      resources: {
        integrityPolicyUrl: "https://catalog.soka.edu/academic-honesty"
      }
    };
  }

  async loadNodesWithConfig() {
    try {
      // Load base nodes
      const response = await fetch('./data/nodes-base.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load nodes.json');
      }
      const baseNodes = await response.json();
      
      // Store original nodes for re-applying placeholders later
      this.originalNodes = JSON.parse(JSON.stringify(baseNodes)); // Deep copy
      
      // Apply placeholder replacements
      const processedNodes = {};
      Object.entries(baseNodes).forEach(([id, node]) => {
        processedNodes[id] = {
          ...node,
          title: this.applyPlaceholders(node.title),
          narrative: this.applyPlaceholders(node.narrative),
          pathLabel: this.applyPlaceholders(node.pathLabel),
          resources: node.resources?.map(r => ({
            ...r,
            label: this.applyPlaceholders(r.label),
            why: this.applyPlaceholders(r.why),
            url: this.applyPlaceholders(r.url)
          })) || [],
          choices: node.choices?.map(c => ({
            ...c,
            label: this.applyPlaceholders(c.label)
          })) || []
        };
      });
      
      return processedNodes;
    } catch (error) {
      console.error('Error loading nodes:', error);
      throw error;
    }
  }

  applyPlaceholders(text) {
    if (!text || typeof text !== 'string') return text;
    
    return text
      .replace(/\{\{institution\}\}/g, this.config.institution.name)
      .replace(/\{\{institution_short\}\}/g, this.config.institution.shortName)
      .replace(/\{\{institution_possessive\}\}/g, this.config.institution.possessive)
      .replace(/\{\{mission_label\}\}/g, this.config.institution.missionLinkLabel)
      .replace(/\{\{mission_url\}\}/g, this.config.institution.missionUrl)
      .replace(/\{\{integrity_url\}\}/g, this.config.resources.integrityPolicyUrl)
      .replace(/\{\{research_center\}\}/g, this.config.resources.researchCenterName || 'Research Center')
      .replace(/\{\{research_center_url\}\}/g, this.config.resources.researchCenterUrl || '')
      .replace(/\{\{writing_center\}\}/g, this.config.resources.writingCenterName || 'Writing Center')
      .replace(/\{\{writing_center_url\}\}/g, this.config.resources.writingCenterUrl || '')
      .replace(/\{\{motto\}\}/g, this.config.values.motto)
      .replace(/\{\{value1\}\}/g, this.config.values.value1)
      .replace(/\{\{value2\}\}/g, this.config.values.value2)
      .replace(/\{\{value3\}\}/g, this.config.values.value3)
      .replace(/\{\{value4\}\}/g, this.config.values.value4);
  }

  getNode(nodeId) {
    return this.nodes[nodeId] || null;
  }

  setCurrentNode(nodeId) {
    this.currentNodeId = nodeId;
    this.trail.push(nodeId);
  }

  getCurrentNode() {
    return this.getNode(this.currentNodeId);
  }

  getTrail() {
    return this.trail.join('>');
  }

  getPathwayColor(path) {
    const colors = this.config.branding.pathwayColors;
    switch(path) {
      case 'ignore': return colors.ignore;
      case 'prohibitive': return colors.prohibitive;
      case 'balanced': return colors.balanced;
      case 'embracing': return colors.embracing;
      case 'collaborative': return colors.collaborative;
      default: return '#E5E7EB'; // shared/default
    }
  }

  getPathwayColorHex(path) {
    const color = this.getPathwayColor(path);
    return parseInt(color.replace('#', ''), 16);
  }

  restart() {
    this.currentNodeId = 'D1';
    this.trail = ['D1'];
  }
}

