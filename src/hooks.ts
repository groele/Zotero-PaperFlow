/**
 * Zotero PaperFlow - Lifecycle Hooks
 */

import { addon } from './addon';

export async function onStartup(ctx?: any): Promise<void> {
  await addon.init(ctx);
}

export async function onShutdown(): Promise<void> {
  await addon.shutdown();
}

export async function onMainWindowLoad(win: any): Promise<void> {
  await addon.onMainWindowLoad(win);
}

export async function onMainWindowUnload(win: any): Promise<void> {
  await addon.onMainWindowUnload(win);
}

export const hooks = {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload
};

export default hooks;
