/**
 * Zotero PaperFlow Storage - Constants and Default Database Schema
 */

export const SYNC_CREDENTIALS_KEY = 'researchflow_sync_credentials';
export const SYNC_SECRET_KEYS = new Set(['token', 'password', 'accesstoken', 'refreshtoken', 'clientsecret', 'authorization']);

export const DEFAULT_DB: any = {
  schemaVersion: 7,
  lastUpdated: 0,
  updatedAt: null,
  revision: 0,
  deviceId: '',
  researchAreas: [],
  projects: [],
  researchRecords: [],
  manuscripts: [],
  submissions: [],
  tasks: [],
  deletedEntities: {
    researchAreas: [],
    projects: [],
    researchRecords: [],
    manuscripts: [],
    submissions: [],
    tasks: []
  },
  settings: {
    syncProviders: {
      metadata: { provider: 'local', config: {}, autoSync: true }
    },
    profile: {
      displayName: '',
      chineseName: '',
      englishName: '',
      affiliation: '',
      orcid: '',
      language: 'en',
      theme: 'system'
    },
    journalPortals: [
      { id: 'acs', name: 'ACS', url: 'https://publish.acs.org/app/login?code=1000', color: '#002C6C', isDefault: true },
      { id: 'wiley', name: 'Wiley', url: 'https://submission.wiley.com/submission/dashboard', color: '#00A4E4', isDefault: true },
      { id: 'apl', name: 'APL', url: 'https://apl.peerx-press.org/cgi-bin/main.plex', color: '#D22630', isDefault: true },
      { id: 'nature', name: 'Nature', url: 'https://mts-ncomms.nature.com/cgi-bin/main.plex', color: '#B59E50', isDefault: true }
    ]
  }
};
