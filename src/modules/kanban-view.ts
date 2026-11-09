import { deleteManuscript, updateKanbanEmptyColumns } from './kanban-view/status-helpers';
import { renderKanban } from './kanban-view/board-renderer';
import { bindAddManuscriptButton, openManuscriptModal } from './kanban-view/manuscript-modal';

declare const module: any;

bindAddManuscriptButton();

const exportedApi = {
  renderKanban,
  deleteManuscript,
  openManuscriptModal,
  updateKanbanEmptyColumns,
};

const g = (typeof globalThis !== 'undefined' ? globalThis : window) as any;
Object.assign(g, exportedApi);

if (typeof window !== 'undefined') {
  Object.assign(window as any, exportedApi);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ...(module.exports || {}),
    ...exportedApi,
  };
}
