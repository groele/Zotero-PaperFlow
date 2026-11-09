declare var db: any;
declare const currentLanguage: string;
declare const ZoteroBridge: any;
declare function escapeHTML(str: any): string;
declare function t(key: string): string;
declare function tf(key: string, vars?: Record<string, any>): string;
declare function openModal(html: string): void;
declare function closeModal(): void;
declare function showGlobalToast(message: string, type?: string, duration?: number): void;

export function renderJournalPortals(): void {
  const w = window as any;
  const toolsRow = document.querySelector('.submission-tools-row') as HTMLElement | null;
  const portalList = document.getElementById('journal-portals-list');
  if (!portalList) return;

  const showPortals = typeof ZoteroBridge !== 'undefined'
    ? ZoteroBridge.getPref('showJournalPortals', true)
    : (db?.settings?.showJournalPortals ?? true);
  if (toolsRow) toolsRow.style.display = showPortals ? '' : 'none';
  if (!showPortals) return;

  w.RFUI.setHTML(portalList, '');
  if (!db.settings) db.settings = {};
  if (!db.settings.journalPortals) {
    db.settings.journalPortals = [
      { id: 'acs', name: 'ACS', url: 'https://publish.acs.org/app/login?code=1000', color: '#002C6C', isDefault: true },
      { id: 'wiley', name: 'Wiley', url: 'https://submission.wiley.com/submission/dashboard', color: '#00A4E4', isDefault: true },
      { id: 'apl', name: 'APL', url: 'https://apl.peerx-press.org/cgi-bin/main.plex', color: '#D22630', isDefault: true },
      { id: 'nature', name: 'Nature', url: 'https://mts-ncomms.nature.com/cgi-bin/main.plex', color: '#B59E50', isDefault: true },
    ];
  }

  const portals = db.settings.journalPortals;
  if (portals.length === 0) {
    w.RFUI.setHTML(portalList, `<p class="empty-state" style="padding: 12px; font-size: 11px;">${escapeHTML(t('portalEmpty'))}</p>`);
    return;
  }

  portals.forEach((portal: any) => {
    const card = document.createElement('div');
    card.className = 'portal-item-card';
    const safeUrl = w.RFUI.isSafeWebUrl(portal.url) ? portal.url : '';
    let domain = '';
    try { domain = new URL(portal.url).hostname; } catch (_) { domain = portal.url; }
    const initial = String(portal.name || '').charAt(0).toUpperCase();
    const portalColor = /^#[0-9a-f]{6}$/i.test(portal.color || '') ? portal.color : 'var(--accent-purple)';
    card.title = `${portal.name} - ${domain}`;

    w.RFUI.setHTML(card, `
      <a class="portal-open" href="${escapeHTML(safeUrl || '#')}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(portal.name)} · ${escapeHTML(domain)}">
      <div class="portal-info">
        <div class="portal-avatar" style="background-color: ${portalColor};">${escapeHTML(initial)}</div>
        <div class="portal-text">
          <span class="portal-name">${escapeHTML(portal.name)}</span>
          <span class="portal-domain" title="${escapeHTML(portal.url)}">${escapeHTML(domain)}</span>
        </div>
      </div>
      </a>
      <div class="portal-actions">
        <button type="button" class="btn-edit-portal" title="${currentLanguage === 'zh' ? '编辑投稿入口' : 'Edit portal'}" aria-label="${currentLanguage === 'zh' ? '编辑' : 'Edit'} ${escapeHTML(portal.name)}">✎</button>
        <button type="button" class="btn-delete-portal" title="${escapeHTML(t('portalDeleteTitle'))}" aria-label="${escapeHTML(t('portalDeleteTitle'))} ${escapeHTML(portal.name)}" data-id="${escapeHTML(portal.id)}">✕</button>
      </div>
    `);

    card.querySelector('.portal-open')?.addEventListener('click', (event) => { if (!safeUrl) event.preventDefault(); });
    card.querySelector('.btn-edit-portal')?.addEventListener('click', () => openJournalPortalEditor(portal));
    card.querySelector('.btn-delete-portal')?.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm(tf('portalDeleteConfirm', { name: portal.name }))) {
        const previous = db.settings.journalPortals;
        try {
          db.settings.journalPortals = previous.filter((p: any) => p.id !== portal.id);
          db = await w.storage.saveAll(db) || db;
          renderJournalPortals();
          showGlobalToast(tf('portalDeletedToast', { name: portal.name }), 'success');
        } catch (error: any) {
          db.settings.journalPortals = previous;
          showGlobalToast(error.message || String(error), 'error');
        }
      }
    });
    portalList.appendChild(card);
  });
}

export function openJournalPortalEditor(portal: any = null): void {
  const w = window as any;
  const editing = Boolean(portal);
  openModal(`
    <div class="modal-header">
      <h2>${editing ? (currentLanguage === 'zh' ? '编辑投稿入口' : 'Edit journal portal') : escapeHTML(t('addPortalTitle'))}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal" aria-label="${escapeHTML(t('cancel'))}">✕</button>
    </div>
    <div class="form-group">
      <label for="portal-name">${escapeHTML(t('portalNameLabel'))}</label>
      <input type="text" id="portal-name" maxlength="60" value="${escapeHTML(portal?.name || '')}" placeholder="${escapeHTML(t('portalNamePlaceholder'))}">
    </div>
    <div class="form-group">
      <label for="portal-url">${escapeHTML(t('portalUrlLabel'))}</label>
      <input type="url" id="portal-url" value="${escapeHTML(portal?.url || '')}" placeholder="https://..." inputmode="url">
    </div>
    <div class="form-group">
      <label for="portal-color">${escapeHTML(t('portalColorLabel'))}</label>
      <div style="display: flex; gap: 12px; align-items: center;">
        <input type="color" id="portal-color" value="${/^#[0-9a-f]{6}$/i.test(portal?.color || '') ? portal.color : '#8b5cf6'}" style="width: 48px; height: 36px; border: none; padding: 0; background: transparent;">
        <span style="font-size: 12px; color: hsl(var(--text-muted));">${escapeHTML(t('portalColorHelp'))}</span>
      </div>
    </div>
    <button type="button" class="btn-primary w-full" id="btn-save-portal" style="margin-top:12px;">${editing ? (currentLanguage === 'zh' ? '保存修改' : 'Save changes') : escapeHTML(t('addPortalButton'))}</button>
  `);

  document.getElementById('btn-save-portal')?.addEventListener('click', async (event: any) => {
    const button = event.currentTarget as HTMLButtonElement;
    const name = ((document.getElementById('portal-name') as HTMLInputElement | null)?.value || '').trim();
    const url = ((document.getElementById('portal-url') as HTMLInputElement | null)?.value || '').trim();
    const color = (document.getElementById('portal-color') as HTMLInputElement | null)?.value || '#8b5cf6';
    if (!name || !url) { showGlobalToast(t('fillAllFields'), 'error'); return; }
    if (!w.RFUI.isSafeWebUrl(url)) { showGlobalToast(t('validUrlRequired'), 'error'); return; }

    const previous = Array.isArray(db.settings?.journalPortals) ? db.settings.journalPortals : [];
    const nextPortal = editing
      ? { ...portal, name, url, color }
      : { id: `portal_${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 11)}`, name, url, color, isDefault: false };
    const next = editing ? previous.map((item: any) => item.id === portal.id ? nextPortal : item) : [...previous, nextPortal];
    button.disabled = true;
    try {
      db.settings.journalPortals = next;
      db = await w.storage.saveAll(db) || db;
      closeModal();
      renderJournalPortals();
      showGlobalToast(editing ? (currentLanguage === 'zh' ? '投稿入口已更新' : 'Portal updated') : tf('portalAddedToast', { name }), 'success');
    } catch (error: any) {
      db.settings.journalPortals = previous;
      showGlobalToast(error.message || String(error), 'error');
    } finally {
      button.disabled = false;
    }
  });
}

export function setupJournalPortalListeners(): void {
  document.getElementById('btn-add-portal')?.addEventListener('click', () => openJournalPortalEditor());
}
