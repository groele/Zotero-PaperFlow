/**
 * Zotero PaperFlow - Bridge Item Resolver
 */

export function resolveZoteroItem(zotero: any, itemKey: any, libraryID: any = null): any {
  if (!zotero || !itemKey) return null;
  const key = String(itemKey).trim();
  if (!key) return null;

  if (typeof zotero.ResearchFlow?.findItemByKey === 'function') {
    try {
      const it = zotero.ResearchFlow.findItemByKey(key, libraryID);
      if (it) return it;
    } catch (_) {}
  }

  if (!zotero.Items?.getByLibraryAndKey) return null;

  if (libraryID !== null && libraryID !== undefined) {
    try {
      const it = zotero.Items.getByLibraryAndKey(libraryID, key);
      if (it) return it;
    } catch (_) {}
  }

  const userLibID = zotero.Libraries?.userLibraryID || 1;
  try {
    const it = zotero.Items.getByLibraryAndKey(userLibID, key);
    if (it) return it;
  } catch (_) {}

  try {
    const allLibs = typeof zotero.Libraries?.getAll === 'function' ? zotero.Libraries.getAll() : [];
    for (const lib of allLibs) {
      const libId = lib?.libraryID || lib?.id;
      if (libId && libId !== userLibID) {
        const it = zotero.Items.getByLibraryAndKey(libId, key);
        if (it) return it;
      }
    }
  } catch (_) {}

  return null;
}
