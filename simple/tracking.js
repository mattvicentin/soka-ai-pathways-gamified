// User tracking and journey logging
class UserTracker {
  constructor() {
    this.storageKey = 'soka-ai-pathways-user';
    this.journeyKey = 'soka-ai-pathways-journey';
    this.webhookUrl = 'https://script.google.com/macros/s/AKfycbxPlg3R1vvv8Dv2V3GXvmI4lepfRDSKGYENWUy3S3JkLH0YnUnnoXSopynVc1YlUws/exec';
    this.initUser();
  }

  initUser() {
    let user = this.getUser();
    if (!user) {
      // Generate anonymous ID
      user = {
        id: 'anon-' + Math.random().toString(36).substr(2, 9),
        name: null,
        anonymous: true,
        startTime: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    }
    return user;
  }

  getUser() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : null;
  }

  setUserName(name) {
    const user = this.getUser();
    user.name = name.trim();
    user.anonymous = !name.trim();
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  logVisit(nodeId, nodePath, nodeTitle) {
    const journey = this.getJourney();
    const visit = {
      nodeId,
      nodePath,
      nodeTitle,
      timestamp: new Date().toISOString()
    };
    journey.push(visit);
    localStorage.setItem(this.journeyKey, JSON.stringify(journey));
    
    // Send to Google Sheets (async, don't block UI)
    this.sendToSheet(nodeId, nodePath, nodeTitle);
  }

  async sendToSheet(nodeId, nodePath, nodeTitle) {
    const user = this.getUser();
    
    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'visit',
          userId: user.id,
          userName: user.name || 'Anonymous',
          nodeId,
          nodePath,
          nodeTitle,
          sessionStart: user.startTime
        })
      });
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.log('Analytics error (non-critical):', error);
    }
  }

  async submitReflection(protectedVal, riskedVal, learnedVal, nextStepVal) {
    const user = this.getUser();
    
    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'reflection',
          userId: user.id,
          userName: user.name || 'Anonymous',
          protected: protectedVal,
          risked: riskedVal,
          learned: learnedVal,
          nextStep: nextStepVal
        })
      });
      return true;
    } catch (error) {
      console.log('Reflection submission error:', error);
      return false;
    }
  }

  getJourney() {
    const data = localStorage.getItem(this.journeyKey);
    return data ? JSON.parse(data) : [];
  }

  clearJourney() {
    localStorage.removeItem(this.journeyKey);
  }

  resetUser() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.journeyKey);
    this.initUser();
  }

  exportJourney() {
    const user = this.getUser();
    const journey = this.getJourney();
    return {
      user,
      journey,
      exportedAt: new Date().toISOString()
    };
  }

  downloadJourney() {
    const data = this.exportJourney();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soka-ai-pathways-journey-${data.user.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const tracker = new UserTracker();

