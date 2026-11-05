/**
 * Zotero PaperFlow - Core Types and Domain Interfaces
 */

export interface ResearchArea {
  id: string;
  name?: string;
  description?: string;
  color?: string;
  [key: string]: any;
}

export interface ResearchProject {
  id: string;
  title?: string;
  researchAreaId?: string;
  description?: string;
  [key: string]: any;
}

export interface ResearchRecord {
  id: string;
  title?: string;
  type?: string;
  content?: string;
  tags?: string[];
  [key: string]: any;
}

export interface Manuscript {
  id: string;
  title: string;
  status?: string;
  targetJournal?: string;
  currentRound?: number;
  zoteroItemKey?: string;
  zoteroItemUri?: string;
  citekey?: string;
  dateAdded?: string;
  dateModified?: string;
  [key: string]: any;
}

export interface ReviewPoint {
  id: string;
  reviewerId?: string;
  reviewerName?: string;
  comment?: string;
  response?: string;
  status?: 'pending' | 'in_progress' | 'done' | string;
  actionTaken?: string;
  changesLocation?: string;
  [key: string]: any;
}

export interface Submission {
  id: string;
  manuscriptId: string;
  round: number;
  journal: string;
  dateSubmitted?: string;
  decisionDate?: string;
  status?: string;
  decision?: string;
  reviewPoints?: ReviewPoint[];
  [key: string]: any;
}

export interface Task {
  id: string;
  title: string;
  manuscriptId?: string;
  status?: string;
  dueDate?: string;
  [key: string]: any;
}

export interface ResearchFlowDatabase {
  schemaVersion: number;
  revision: number;
  researchAreas: ResearchArea[];
  projects: ResearchProject[];
  researchRecords: ResearchRecord[];
  manuscripts: Manuscript[];
  submissions: Submission[];
  tasks: Task[];
  settings?: Record<string, any>;
  [key: string]: any;
}

export interface UiState {
  activeTab?: string;
  viewMode?: string;
  selectedManuscriptId?: string | null;
  [key: string]: any;
}
