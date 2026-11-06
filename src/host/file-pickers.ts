/**
 * Zotero PaperFlow - Host File Pickers & Exporters
 */

declare var Zotero: any;
declare var Services: any;
declare var ChromeUtils: any;
declare var IOUtils: any;

export const hostFilePickerMethods = {
  async saveShareImageFile(this: any, pngBytes: any, fileName: string, language = 'en', window = null) {
    if (this._shareImageSavePending) return { success: false, error: 'An image save is already in progress.' };
    this._shareImageSavePending = true;
    try {
      const bytes = new Uint8Array(pngBytes);
      const signature = [137, 80, 78, 71, 13, 10, 26, 10];
      if (bytes.length < 8 || bytes.length > 64 * 1024 * 1024 || !signature.every((value, index) => bytes[index] === value)) {
        throw new Error('Invalid PNG image.');
      }
      const { FilePicker } = ChromeUtils.importESModule('chrome://zotero/content/modules/filePicker.mjs');
      const fp = new FilePicker();
      const win = window || Zotero.getMainWindow?.() || Services.wm?.getMostRecentWindow('navigator:browser');
      if (!win?.browsingContext) throw new Error('Zotero window is unavailable.');
      fp.init(win, language === 'zh' ? '另存为 Zotero PaperFlow 图片' : 'Save Zotero PaperFlow image as', fp.modeSave);
      fp.defaultExtension = 'png';
      fp.appendFilter('PNG (*.png)', '*.png');
      const safeName = String(fileName || 'researchflow-journey.png').replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').slice(0, 140).replace(/[. ]+$/g, '');
      fp.defaultString = /\.png$/i.test(safeName) ? safeName : `${safeName || 'researchflow-journey'}.png`;
      const result = await fp.show();
      if (result !== fp.returnOK && result !== fp.returnReplace) return { success: false, cancelled: true };
      const filePath = fp.file;
      if (!filePath) throw new Error('No save path was selected.');
      await IOUtils.write(filePath, bytes);
      return { success: true, filePath };
    } catch (error: any) {
      Zotero.logError?.('[PaperFlow] saveShareImageFile error: ' + error);
      return { success: false, error: String(error?.message || error) };
    } finally {
      this._shareImageSavePending = false;
    }
  },

  async exportDatabaseFile(this: any, window = null) {
    try {
      const { FilePicker } = ChromeUtils.importESModule('chrome://zotero/content/modules/filePicker.mjs');
      const fp = new FilePicker();
      const win = Zotero.getMainWindow?.() || window || Services.wm?.getMostRecentWindow('navigator:browser');
      if (!win?.browsingContext) throw new Error('Zotero 主窗口不可用');
      fp.init(win, '导出 ResearchFlow 数据库', fp.modeSave);
      fp.defaultExtension = 'json';
      fp.appendFilter('JSON Files (*.json)', '*.json');
      const dateStr = new Date().toISOString().split('T')[0];
      fp.defaultString = `researchflow-export-${dateStr}.json`;

      const res = await fp.show();
      if (res === fp.returnOK || res === fp.returnReplace) {
        const filePath = fp.file;
        const data = await this.loadDatabase();
        const jsonStr = JSON.stringify(data, null, 2);
        await IOUtils.writeUTF8(filePath, jsonStr);
        this.showToast('导出成功', `数据库已保存至：${filePath}`, 'success');
        return { success: true, filePath };
      }
    } catch (err: any) {
      Zotero.logError?.('[PaperFlow] exportDatabaseFile error: ' + err);
      this.showToast('导出失败', String(err?.message || err), 'error');
      return { success: false, error: err?.message };
    }
    return { success: false, cancelled: true };
  },

  async importDatabaseFile(this: any, mode = 'merge', window = null) {
    try {
      const { FilePicker } = ChromeUtils.importESModule('chrome://zotero/content/modules/filePicker.mjs');
      const fp = new FilePicker();
      const win = Zotero.getMainWindow?.() || window || Services.wm?.getMostRecentWindow('navigator:browser');
      if (!win?.browsingContext) throw new Error('Zotero 主窗口不可用');
      fp.init(win, '选择 ResearchFlow JSON 备份文件导入', fp.modeOpen);
      fp.defaultExtension = 'json';
      fp.appendFilter('JSON Files (*.json)', '*.json');

      const res = await fp.show();
      if (res === fp.returnOK) {
        const filePath = fp.file;
        const rawText = await IOUtils.readUTF8(filePath);
        let importedJson;
        try {
          importedJson = JSON.parse(rawText);
        } catch (pe) {
          throw new Error('所选文件不是合法的 JSON 格式备份');
        }
        const saved = await this.importDatabase(importedJson, mode);
        this.showToast('导入成功', `已从 ${filePath} 导入数据库`, 'success');
        return { success: true, data: saved };
      }
    } catch (err: any) {
      Zotero.logError?.('[PaperFlow] importDatabaseFile error: ' + err);
      this.showToast('导入失败', String(err?.message || err), 'error');
      return { success: false, error: err?.message };
    }
    return { success: false, cancelled: true };
  },

  async exportDiagnosticsFile(this: any, report = null, window = null) {
    try {
      const { FilePicker } = ChromeUtils.importESModule('chrome://zotero/content/modules/filePicker.mjs');
      const fp = new FilePicker();
      const win = Zotero.getMainWindow?.() || window || Services.wm?.getMostRecentWindow('navigator:browser');
      if (!win?.browsingContext) throw new Error('Zotero 主窗口不可用');
      fp.init(win, '导出 ResearchFlow 诊断报告', fp.modeSave);
      fp.defaultExtension = 'json';
      fp.appendFilter('JSON Files (*.json)', '*.json');
      const dateStr = new Date().toISOString().slice(0, 10);
      fp.defaultString = `researchflow-diagnostics-${dateStr}.json`;

      const res = await fp.show();
      if (res === fp.returnOK || res === fp.returnReplace) {
        const filePath = fp.file;
        const jsonStr = JSON.stringify(report || {}, null, 2);
        await IOUtils.writeUTF8(filePath, jsonStr);
        this.showToast('导出成功', `诊断信息已保存至：${filePath}`, 'success');
        return { success: true, filePath };
      }
    } catch (err: any) {
      Zotero.logError?.('[PaperFlow] exportDiagnosticsFile error: ' + err);
      this.showToast('导出失败', String(err?.message || err), 'error');
      return { success: false, error: err?.message };
    }
    return { success: false, cancelled: true };
  }
};
