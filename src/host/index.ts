/**
 * Zotero PaperFlow - Host Runtime Methods Aggregator
 */
import { hostPrefsStateMethods } from './prefs-state.js';
import { hostMenuMethods } from './menus.js';
import { hostDatabaseRecoveryMethods } from './database-recovery.js';
import { hostDatabaseMergeMethods } from './database-merge.js';
import { hostDatabaseStorageMethods } from './database-storage.js';
import { hostFilePickerMethods } from './file-pickers.js';
import { hostChildNoteMethods } from './child-notes.js';
import { hostWindowUiMethods } from './window-ui.js';
import { hostWindowLifecycleMethods } from './window-lifecycle.js';
import { hostNavigationMethods } from './navigation.js';
import { hostItemPaneMethods } from './item-pane.js';
import { hostShutdownMethods } from './shutdown.js';

export const allHostMethods = {
  ...hostPrefsStateMethods,
  ...hostMenuMethods,
  ...hostDatabaseRecoveryMethods,
  ...hostDatabaseMergeMethods,
  ...hostDatabaseStorageMethods,
  ...hostFilePickerMethods,
  ...hostChildNoteMethods,
  ...hostWindowUiMethods,
  ...hostWindowLifecycleMethods,
  ...hostNavigationMethods,
  ...hostItemPaneMethods,
  ...hostShutdownMethods
};
