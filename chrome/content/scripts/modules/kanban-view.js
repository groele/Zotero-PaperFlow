/**
 * ----------------------------------------------------------------------------------
 * ⚡ AUTO-GENERATED BUNDLE BY ESBUILD - DO NOT EDIT DIRECTLY
 * ----------------------------------------------------------------------------------
 * Source authority: `src/` TypeScript modules (100% strictly <= 360 lines).
 * Target runtime: Gecko 153+ / Firefox 140+ (minify: false for Error Console audit)
 * ----------------------------------------------------------------------------------
 */
"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // src/modules/kanban-view/status-helpers.ts
  async function deleteManuscript(manuscriptId) {
    if (!manuscriptId) return false;
    const man = (db.manuscripts || []).find((item) => item.id === manuscriptId);
    if (!man) return false;
    const title = man.title || (currentLanguage === "zh" ? "该稿件" : "this manuscript");
    const linkedSubmissions = (db.submissions || []).filter((sub) => sub.manuscriptId === manuscriptId);
    let confirmMessage = (typeof tf === "function" ? tf("confirmDeleteManuscript") : null) || t("confirmDeleteManuscript") || (currentLanguage === "zh" ? `确定要删除稿件《${title}》吗？` : `Are you sure you want to delete manuscript "${title}"?`);
    if (linkedSubmissions.length > 0) {
      const subNotice = currentLanguage === "zh" ? `

注意：此操作将同步删除关联的 ${linkedSubmissions.length} 个投稿跟踪记录。` : `

Note: This will also remove ${linkedSubmissions.length} associated submission tracking record(s).`;
      confirmMessage += subNotice;
    }
    if (typeof confirm === "function" && !confirm(confirmMessage)) return false;
    try {
      const win = typeof window !== "undefined" ? window : globalThis;
      for (const sub of linkedSubmissions) {
        if (typeof win.storage?.recordEntityDeletion === "function") {
          win.storage.recordEntityDeletion(db, "submissions", sub.id);
        } else {
          db.submissions = (db.submissions || []).filter((s) => s.id !== sub.id);
        }
        if (typeof selectedSubmissionId !== "undefined" && selectedSubmissionId === sub.id) {
          selectedSubmissionId = null;
        }
        if (win.selectedSubmissionId === sub.id) {
          win.selectedSubmissionId = null;
        }
      }
      if (typeof win.storage?.recordEntityDeletion === "function") {
        win.storage.recordEntityDeletion(db, "manuscripts", manuscriptId);
      } else {
        db.manuscripts = (db.manuscripts || []).filter((m) => m.id !== manuscriptId);
      }
      if (typeof win.storage?.saveAll === "function") {
        await win.storage.saveAll(db);
      }
      if (typeof win.renderKanban === "function") win.renderKanban();
      if (typeof win.renderDashboard === "function") win.renderDashboard();
      if (typeof win.renderSubmissions === "function") win.renderSubmissions();
      const subDetailPanel = document.getElementById("submission-detail-panel");
      const activeSel = typeof selectedSubmissionId !== "undefined" ? selectedSubmissionId : win.selectedSubmissionId;
      if (subDetailPanel && (!activeSel || linkedSubmissions.some((s) => s.id === activeSel))) {
        win.RFUI?.setHTML?.(subDetailPanel, `
        <div class="empty-state">
          <svg class="svg-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <h3>${escapeHTML(t("submissionEmptyDetail") || (currentLanguage === "zh" ? "请选择一个投稿记录查看详情" : "Select a submission to view details"))}</h3>
        </div>
      `);
      }
      const toastMsg = t("manuscriptDeletedToast") || (currentLanguage === "zh" ? "稿件已成功删除。" : "Manuscript deleted successfully.");
      if (typeof showGlobalToast === "function") {
        showGlobalToast(toastMsg, "success");
      }
      return true;
    } catch (error) {
      console.error("Delete manuscript failed:", error);
      if (typeof showGlobalToast === "function") {
        showGlobalToast(error.message || (currentLanguage === "zh" ? "删除稿件失败" : "Failed to delete manuscript"), "error");
      }
      return false;
    }
  }
  function updateKanbanEmptyColumns() {
    const board = document.querySelector(".kanban-board");
    const button = document.getElementById("btn-toggle-empty-kanban");
    const showEmpty = Boolean(window.showEmptyKanbanColumns);
    board?.classList.toggle("show-empty-columns", showEmpty);
    if (button) {
      button.setAttribute("aria-pressed", String(showEmpty));
      button.textContent = t(showEmpty ? "kanbanHideEmpty" : "kanbanShowEmpty");
    }
  }
  function initializeKanbanEmptyColumnsMode() {
    const button = document.getElementById("btn-toggle-empty-kanban");
    if (button && !button.dataset.bound) {
      button.dataset.bound = "true";
      button.addEventListener("click", () => {
        const g = window;
        g.showEmptyKanbanColumns = !g.showEmptyKanbanColumns;
        updateKanbanEmptyColumns();
        const rf2 = typeof window.RFPlatform !== "undefined" ? window.RFPlatform : typeof RFPlatform !== "undefined" ? RFPlatform : null;
        rf2?.storage?.local?.set?.({ researchflow_kanban_show_empty: g.showEmptyKanbanColumns });
      });
    }
    const rf = typeof window.RFPlatform !== "undefined" ? window.RFPlatform : typeof RFPlatform !== "undefined" ? RFPlatform : null;
    rf?.storage?.local?.get?.(["researchflow_kanban_show_empty"], (result) => {
      window.showEmptyKanbanColumns = result?.researchflow_kanban_show_empty !== false;
      updateKanbanEmptyColumns();
    });
  }
  var init_status_helpers = __esm({
    "src/modules/kanban-view/status-helpers.ts"() {
      "use strict";
    }
  });

  // src/modules/kanban-view/zotero-drawer.ts
  function bindZoteroReadingAssetsDrawer(state) {
    const w = window;
    document.getElementById("btn-zotero-toggle-annos")?.addEventListener("click", async () => {
      const panel = document.getElementById("man-zotero-annotations-panel");
      if (!panel || !state.currentZoteroItemKey || typeof ZoteroBridge === "undefined") return;
      if (panel.style.display !== "none") {
        panel.style.display = "none";
        return;
      }
      panel.style.display = "flex";
      w.RFUI.setHTML(panel, '<div style="font-size:11px; color:#64748b; padding:8px; text-align:center;">⏳ 正在读取 Zotero 研读资产库 (PDF划线、独立笔记、分类标签)...</div>');
      const assets = typeof ZoteroBridge.getReadingAssets === "function" ? await ZoteroBridge.getReadingAssets(state.currentZoteroItemKey, state.currentZoteroLibraryID) : { annotations: await ZoteroBridge.getAnnotations(state.currentZoteroItemKey, state.currentZoteroLibraryID), notes: [], collections: [], tags: [] };
      const annos = assets.annotations || [];
      const notes = assets.notes || [];
      const collections = assets.collections || [];
      const tags = assets.tags || [];
      w.RFUI.setHTML(panel, `
      <div class="zotero-drawer-tabs">
        <button type="button" class="zotero-drawer-tab active" data-tab="annos">🖍️ PDF 批注 <span class="zotero-drawer-badge">${annos.length}</span></button>
        <button type="button" class="zotero-drawer-tab" data-tab="notes">📝 独立笔记 <span class="zotero-drawer-badge">${notes.length}</span></button>
        <button type="button" class="zotero-drawer-tab" data-tab="meta">📁 分类与标签 <span class="zotero-drawer-badge">${collections.length + tags.length}</span></button>
      </div>
      <div id="zotero-tab-content-annos" class="zotero-drawer-section"></div>
      <div id="zotero-tab-content-notes" class="zotero-drawer-section" style="display:none;"></div>
      <div id="zotero-tab-content-meta" class="zotero-drawer-section" style="display:none;"></div>
    `);
      panel.querySelectorAll(".zotero-drawer-tab").forEach((tabBtn) => {
        tabBtn.addEventListener("click", (e) => {
          e.preventDefault();
          panel.querySelectorAll(".zotero-drawer-tab").forEach((b) => b.classList.remove("active"));
          tabBtn.classList.add("active");
          const targetTab = tabBtn.dataset.tab;
          const secAnnos = panel.querySelector("#zotero-tab-content-annos");
          const secNotes = panel.querySelector("#zotero-tab-content-notes");
          const secMeta = panel.querySelector("#zotero-tab-content-meta");
          if (secAnnos) secAnnos.style.display = targetTab === "annos" ? "flex" : "none";
          if (secNotes) secNotes.style.display = targetTab === "notes" ? "flex" : "none";
          if (secMeta) secMeta.style.display = targetTab === "meta" ? "flex" : "none";
        });
      });
      populateZoteroAnnosTab(panel, annos, state);
      populateZoteroNotesTab(panel, notes, state);
      populateZoteroMetaTab(panel, collections, tags);
    });
  }
  function populateZoteroAnnosTab(panel, annos, state) {
    const w = window;
    const annosContainer = panel.querySelector("#zotero-tab-content-annos");
    if (!annosContainer) return;
    if (annos.length === 0) {
      w.RFUI.setHTML(annosContainer, '<div style="font-size:11px; color:#64748b; padding:8px; text-align:center;">该文献 PDF 暂无高亮划线。您可在 Zotero 阅读器中选中文字添加高亮与批注。</div>');
      return;
    }
    if (annos.length > 1) {
      const batchBar = document.createElement("div");
      batchBar.className = "zotero-batch-toolbar";
      w.RFUI.setHTML(batchBar, `
      <span>共检测到 <strong>${annos.length}</strong> 条 PDF 批注划线</span>
      <button type="button" class="btn-secondary" id="btn-batch-insert-annos" style="font-size:10px; padding:2px 8px; color:var(--text-accent, #e11d48); font-weight:600; cursor:pointer;">➕ 全部汇入研读草稿</button>
    `);
      batchBar.querySelector("#btn-batch-insert-annos")?.addEventListener("click", () => {
        const absBox = document.getElementById("man-abstract");
        if (absBox) {
          const allQuotes = annos.filter((a) => a.text || a.comment).map((a) => `> "${a.text || a.comment}" (第 ${a.page} 页)`).join("\n\n");
          absBox.value = `${absBox.value}

【Zotero PDF 研读摘录汇编】
${allQuotes}`.trim();
          showGlobalToast(`已将全部 ${annos.length} 条批注汇入草稿！`, "success");
        }
      });
      annosContainer.appendChild(batchBar);
    }
    annos.forEach((a) => {
      const itemEl = document.createElement("div");
      itemEl.className = "zotero-annotation-item";
      w.RFUI.setHTML(itemEl, `
      <div class="zotero-annotation-head">
        <span style="font-weight:600; color:${a.color || "#e11d48"};">● 第 ${a.page} 页 ${a.type === "note" ? "独立批注" : "高亮划线"}</span>
        <span>${a.date ? new Date(a.date).toLocaleDateString() : ""}</span>
      </div>
      ${a.text ? `<div class="zotero-annotation-body" style="border-left-color:${a.color || "#ffd400"};">${escapeHTML(a.text)}</div>` : ""}
      ${a.comment ? `<div class="zotero-annotation-comment">💡 批注：${escapeHTML(a.comment)}</div>` : ""}
      <div class="zotero-annotation-actions">
        <button type="button" class="btn-secondary btn-quote-insert" style="font-size:10px; padding:2px 6px;">➕ 插入草稿</button>
        <button type="button" class="btn-secondary btn-quote-jump" style="font-size:10px; padding:2px 6px;">📖 原文第 ${a.page} 页</button>
      </div>
    `);
      itemEl.querySelector(".btn-quote-insert")?.addEventListener("click", () => {
        const absBox = document.getElementById("man-abstract");
        if (absBox) {
          absBox.value = `${absBox.value}

> "${a.text || a.comment}" (第 ${a.page} 页)`.trim();
          showGlobalToast("已将划线批注插入到研读草稿中", "success");
        }
      });
      itemEl.querySelector(".btn-quote-jump")?.addEventListener("click", () => {
        if (state.currentZoteroItemKey && typeof ZoteroBridge !== "undefined") {
          ZoteroBridge.openPdf(state.currentZoteroItemKey, a.pageIndex + 1, state.currentZoteroLibraryID);
        }
      });
      annosContainer.appendChild(itemEl);
    });
  }
  function populateZoteroNotesTab(panel, notes, state) {
    const w = window;
    const notesContainer = panel.querySelector("#zotero-tab-content-notes");
    if (!notesContainer) return;
    if (notes.length === 0) {
      w.RFUI.setHTML(notesContainer, '<div style="font-size:11px; color:#64748b; padding:8px; text-align:center;">该文献在 Zotero 中暂无独立文献笔记。您可在 Zotero 中为该条目添加子笔记记录研读心得。</div>');
      return;
    }
    notes.forEach((n) => {
      const noteEl = document.createElement("div");
      noteEl.className = "zotero-note-item";
      w.RFUI.setHTML(noteEl, `
      <div class="zotero-note-head">
        <span>📝 ${escapeHTML(n.title || "Zotero 笔记")}</span>
        <span style="font-size:10px; color:#64748b; font-weight:normal;">${n.date ? new Date(n.date).toLocaleDateString() : ""}</span>
      </div>
      <div class="zotero-note-body">${escapeHTML(n.snippet || "")}</div>
      <div class="zotero-note-actions">
        <button type="button" class="btn-secondary btn-insert-note" style="font-size:10px; padding:2px 6px;">➕ 插入草稿</button>
        <button type="button" class="btn-secondary btn-locate-note" style="font-size:10px; padding:2px 6px;">🔗 定位笔记</button>
      </div>
    `);
      noteEl.querySelector(".btn-insert-note")?.addEventListener("click", () => {
        const absBox = document.getElementById("man-abstract");
        if (absBox) {
          absBox.value = `${absBox.value}

【Zotero 研读笔记摘记】
${n.snippet || ""}`.trim();
          showGlobalToast("已将文献笔记插入到研读草稿中", "success");
        }
      });
      noteEl.querySelector(".btn-locate-note")?.addEventListener("click", () => {
        if (typeof ZoteroBridge !== "undefined") ZoteroBridge.selectItemInZotero(n.key, state.currentZoteroLibraryID);
      });
      notesContainer.appendChild(noteEl);
    });
  }
  function populateZoteroMetaTab(panel, collections, tags) {
    const w = window;
    const metaContainer = panel.querySelector("#zotero-tab-content-meta");
    if (!metaContainer) return;
    w.RFUI.setHTML(metaContainer, "");
    if (collections.length > 0) {
      const colSection = document.createElement("div");
      w.RFUI.setHTML(colSection, `<strong style="font-size:11px; color:hsl(var(--text-secondary)); display:block; margin-bottom:4px;">📁 所属 Zotero 知识库分类：</strong>`);
      const pillsWrap = document.createElement("div");
      pillsWrap.style.cssText = "display:flex; flex-wrap:wrap; gap:6px;";
      collections.forEach((col) => {
        const pill = document.createElement("span");
        pill.className = "zotero-collection-pill";
        pill.textContent = `📁 ${col.path || col.name}`;
        pillsWrap.appendChild(pill);
      });
      colSection.appendChild(pillsWrap);
      metaContainer.appendChild(colSection);
    }
    if (tags.length > 0) {
      const tagSection = document.createElement("div");
      tagSection.style.marginTop = "6px";
      w.RFUI.setHTML(tagSection, `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <strong style="font-size:11px; color:hsl(var(--text-secondary));">🏷️ Zotero 文献标签：</strong>
        <button type="button" class="btn-secondary" id="btn-extract-tags-to-notes" style="font-size:10px; padding:2px 6px;">➕ 提取为主题标签</button>
      </div>
    `);
      const tagsWrap = document.createElement("div");
      tagsWrap.style.cssText = "display:flex; flex-wrap:wrap; gap:4px;";
      tags.forEach((tg) => {
        const tagPill = document.createElement("span");
        tagPill.className = "zotero-tag-pill";
        tagPill.textContent = `#${tg}`;
        tagsWrap.appendChild(tagPill);
      });
      tagSection.appendChild(tagsWrap);
      tagSection.querySelector("#btn-extract-tags-to-notes")?.addEventListener("click", () => {
        const absBox = document.getElementById("man-abstract");
        if (absBox) {
          absBox.value = `${absBox.value}

【主题关键词】：${tags.join(", ")}`.trim();
          showGlobalToast(`已将 ${tags.length} 个标签添加至研读草稿！`, "success");
        }
      });
      metaContainer.appendChild(tagSection);
    }
    if (collections.length === 0 && tags.length === 0) {
      w.RFUI.setHTML(metaContainer, '<div style="font-size:11px; color:#64748b; padding:8px; text-align:center;">该文献暂未分配分类目录与标签。</div>');
    }
  }
  function bindZoteroLiveSearchDropdown(applyItemToForm) {
    const w = window;
    const searchInput = document.getElementById("ipt-zotero-live-search");
    const dropdown = document.getElementById("zotero-search-results-dropdown");
    let searchTimer = null;
    if (!searchInput || !dropdown) return;
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim();
      clearTimeout(searchTimer);
      if (query.length < 2) {
        dropdown.style.display = "none";
        w.RFUI.setHTML(dropdown, "");
        return;
      }
      searchTimer = setTimeout(async () => {
        w.RFUI.setHTML(dropdown, `<div class="zotero-search-empty">🔍 ${escapeHTML(currentLanguage === "zh" ? "检索中..." : "Searching...")}</div>`);
        dropdown.style.display = "block";
        const results = typeof ZoteroBridge !== "undefined" ? await ZoteroBridge.searchLibrary(query, 10) : [];
        if (!results || results.length === 0) {
          w.RFUI.setHTML(dropdown, `<div class="zotero-search-empty">${escapeHTML(currentLanguage === "zh" ? "未找到匹配的 Zotero 文献" : "No matching Zotero items found")}</div>`);
          return;
        }
        w.RFUI.setHTML(dropdown, "");
        results.forEach((res) => {
          const itemEl = document.createElement("div");
          itemEl.className = "zotero-search-result-item";
          w.RFUI.setHTML(itemEl, `
          <div class="zotero-search-result-title">${escapeHTML(res.title || "无标题文献")}</div>
          <div class="zotero-search-result-meta">${escapeHTML(res.authors || "")} ${res.year ? `· ${escapeHTML(res.year)}` : ""} ${res.publication ? `· ${escapeHTML(res.publication)}` : ""}</div>
        `);
          itemEl.addEventListener("click", () => {
            applyItemToForm(res);
            dropdown.style.display = "none";
            searchInput.value = "";
          });
          dropdown.appendChild(itemEl);
        });
      }, 220);
    });
    if (activeManuscriptDropdownOutsideClick) {
      document.removeEventListener("click", activeManuscriptDropdownOutsideClick);
      activeManuscriptDropdownOutsideClick = null;
    }
    activeManuscriptDropdownOutsideClick = (e) => {
      if (!searchInput.contains?.(e.target) && !dropdown.contains?.(e.target)) {
        dropdown.style.display = "none";
      }
    };
    document.addEventListener("click", activeManuscriptDropdownOutsideClick);
    if (typeof registerModalCleanup === "function") {
      registerModalCleanup(() => {
        if (activeManuscriptDropdownOutsideClick) {
          document.removeEventListener("click", activeManuscriptDropdownOutsideClick);
          activeManuscriptDropdownOutsideClick = null;
        }
      });
    }
  }
  var activeManuscriptDropdownOutsideClick;
  var init_zotero_drawer = __esm({
    "src/modules/kanban-view/zotero-drawer.ts"() {
      "use strict";
      activeManuscriptDropdownOutsideClick = null;
    }
  });

  // src/modules/kanban-view/zotero-modal-binder.ts
  function setupZoteroModalBindings(state) {
    const w = window;
    const updateZoteroBindUI = (item) => {
      const statusEl = document.getElementById("zotero-bind-status");
      const pdfBtn = document.getElementById("btn-zotero-open-pdf");
      const syncBtn = document.getElementById("btn-zotero-sync-note");
      const locateBtn = document.getElementById("btn-zotero-locate");
      const unlinkBtn = document.getElementById("btn-zotero-unlink");
      const bibBtn = document.getElementById("btn-zotero-copy-bib");
      const apaBtn = document.getElementById("btn-zotero-copy-apa");
      const annoBtn = document.getElementById("btn-zotero-toggle-annos");
      const searchContainer = document.getElementById("zotero-search-container");
      if (item && item.key) {
        state.currentZoteroItemKey = item.key;
        state.currentZoteroLibraryID = item.libraryID ?? null;
        state.currentZoteroUri = item.zoteroUri;
        state.currentPdfUri = item.pdfUri;
        state.currentCiteKey = item.citekey || "";
        state.currentBibtex = item.bibtex || "";
        state.currentCitationApa = item.citationApa || "";
        state.currentRelatedItems = item.relatedItems || [];
        if (statusEl) {
          w.RFUI.setHTML(statusEl, `<span style="color:#059669; font-weight:600; display:inline-flex; align-items:center; gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>已关联: ${escapeHTML((item.title || "").slice(0, 22))}…</span>`);
          if (state.currentCiteKey) {
            const citeEl = document.createElement("span");
            citeEl.className = "zotero-citekey-badge";
            citeEl.textContent = `[@${state.currentCiteKey}]`;
            citeEl.title = "点击复制 Citation Key";
            citeEl.addEventListener("click", (e) => {
              e.stopPropagation();
              if (typeof ZoteroBridge !== "undefined") ZoteroBridge.copyText(`[@${state.currentCiteKey}]`, `已复制 Citation Key: [@${state.currentCiteKey}]`);
            });
            statusEl.appendChild(citeEl);
          }
        }
        if (pdfBtn) pdfBtn.style.display = item.pdfUri ? "" : "none";
        if (syncBtn) syncBtn.style.display = "";
        if (locateBtn) locateBtn.style.display = "";
        if (unlinkBtn) unlinkBtn.style.display = "";
        if (bibBtn) bibBtn.style.display = state.currentBibtex ? "" : "none";
        if (apaBtn) apaBtn.style.display = state.currentCitationApa ? "" : "none";
        if (annoBtn) annoBtn.style.display = "";
        if (searchContainer) searchContainer.style.display = "none";
        const relPanel = document.getElementById("man-zotero-related-panel");
        const relChips = document.getElementById("man-zotero-related-chips");
        if (relPanel && relChips && Array.isArray(item.relatedItems) && item.relatedItems.length > 0) {
          w.RFUI.setHTML(relChips, "");
          item.relatedItems.forEach((r) => {
            const chip = document.createElement("span");
            chip.className = "zotero-related-chip";
            chip.textContent = `${(r.title || "").slice(0, 16)}… (${r.year || ""})`;
            chip.title = `${r.title} - ${r.authors} (点击在文献库定位)`;
            chip.addEventListener("click", () => {
              if (typeof ZoteroBridge !== "undefined") ZoteroBridge.selectItemInZotero(r.key);
            });
            relChips.appendChild(chip);
          });
          relPanel.style.display = "block";
        } else if (relPanel) relPanel.style.display = "none";
      } else {
        state.currentZoteroItemKey = null;
        state.currentZoteroLibraryID = null;
        state.currentZoteroUri = null;
        state.currentPdfUri = null;
        state.currentCiteKey = "";
        state.currentBibtex = "";
        state.currentCitationApa = "";
        state.currentRelatedItems = [];
        if (statusEl) w.RFUI.setHTML(statusEl, `<span style="color:#64748b; font-weight:500; display:inline-flex; align-items:center; gap:6px;">${escapeHTML(currentLanguage === "zh" ? "未绑定 Zotero 文献条目 (点击可搜索关联)" : "No Zotero item linked (Click to search)")}</span>`);
        [pdfBtn, syncBtn, locateBtn, unlinkBtn, bibBtn, apaBtn, annoBtn].forEach((b) => {
          if (b) b.style.display = "none";
        });
        if (searchContainer) searchContainer.style.display = "block";
        const relPanel = document.getElementById("man-zotero-related-panel");
        if (relPanel) relPanel.style.display = "none";
        const annoPanel = document.getElementById("man-zotero-annotations-panel");
        if (annoPanel) annoPanel.style.display = "none";
      }
    };
    const applyItemToForm = (item) => {
      if (!item) return;
      if (item.title) document.getElementById("man-title").value = item.title;
      if (item.publication) document.getElementById("man-journal").value = item.publication;
      if (item.authors) document.getElementById("man-authors").value = item.authors;
      if (item.doi) document.getElementById("man-doi").value = item.doi;
      if (item.url) document.getElementById("man-article-url").value = item.url;
      if (item.abstract) document.getElementById("man-abstract").value = item.abstract;
      updateZoteroBindUI(item);
      showGlobalToast(`已关联并填充文献《${(item.title || "").slice(0, 18)}…》元数据`, "success");
      if (typeof ZoteroBridge !== "undefined") ZoteroBridge.showNativeToast("文献已关联", item.title, "success");
    };
    setTimeout(async () => {
      try {
        if (typeof ZoteroBridge !== "undefined" && !state.currentZoteroItemKey && ZoteroBridge.getPref("autoLinkSelectedPaper", true)) {
          const activeItem = await ZoteroBridge.getActiveItem();
          const banner = document.getElementById("zotero-active-item-banner");
          const textEl = document.getElementById("zotero-active-item-text");
          if (activeItem?.title && banner && textEl) {
            w.RFUI.setHTML(textEl, `📌 <strong>检测到 Zotero 选中文献：</strong>《${escapeHTML(activeItem.title)}》`);
            banner.style.display = "flex";
            document.getElementById("btn-zotero-quick-bind-active")?.addEventListener("click", () => {
              applyItemToForm(activeItem);
              banner.style.display = "none";
            });
          }
        }
      } catch (_) {
      }
    }, 60);
    document.getElementById("zotero-bind-status")?.addEventListener("click", () => {
      const sc = document.getElementById("zotero-search-container");
      if (sc) {
        sc.style.display = "block";
        document.getElementById("ipt-zotero-live-search")?.focus();
      }
    });
    document.getElementById("btn-zotero-toggle-search")?.addEventListener("click", () => {
      const sc = document.getElementById("zotero-search-container");
      if (sc) {
        sc.style.display = sc.style.display === "none" ? "block" : "none";
        if (sc.style.display === "block") document.getElementById("ipt-zotero-live-search")?.focus();
      }
    });
    document.getElementById("zotero-modal-citekey")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (state.currentCiteKey && typeof ZoteroBridge !== "undefined") ZoteroBridge.copyText(`[@${state.currentCiteKey}]`, `已复制 Citation Key: [@${state.currentCiteKey}]`);
    });
    document.getElementById("btn-zotero-copy-bib")?.addEventListener("click", () => {
      if (state.currentBibtex && typeof ZoteroBridge !== "undefined") ZoteroBridge.copyText(state.currentBibtex, "已复制 BibTeX 引用条目");
    });
    document.getElementById("btn-zotero-copy-apa")?.addEventListener("click", () => {
      if (state.currentCitationApa && typeof ZoteroBridge !== "undefined") ZoteroBridge.copyText(state.currentCitationApa, "已复制标准引用 (APA)");
    });
    bindZoteroReadingAssetsDrawer(state);
    bindZoteroLiveSearchDropdown(applyItemToForm);
    document.getElementById("btn-zotero-fetch-active")?.addEventListener("click", async () => {
      const activeItem = typeof ZoteroBridge !== "undefined" ? await ZoteroBridge.getActiveItem() : null;
      if (activeItem) applyItemToForm(activeItem);
      else showGlobalToast("未在 Zotero 中检测到选中条目，请在文献库中单击选中目标论文。", "warning");
    });
    document.getElementById("btn-zotero-open-pdf")?.addEventListener("click", () => {
      if (state.currentZoteroItemKey && typeof ZoteroBridge !== "undefined") ZoteroBridge.openPdf(state.currentZoteroItemKey, null, state.currentZoteroLibraryID);
    });
    document.getElementById("btn-zotero-sync-note")?.addEventListener("click", async () => {
      if (state.currentZoteroItemKey && typeof ZoteroBridge !== "undefined") {
        const ok = await ZoteroBridge.syncNote(state.currentZoteroItemKey, state.currentZoteroLibraryID);
        showGlobalToast(ok ? "已同步审稿进展至 Zotero 云端笔记！" : "同步失败，请检查条目是否存在", ok ? "success" : "error");
      }
    });
    document.getElementById("btn-zotero-locate")?.addEventListener("click", () => {
      if (state.currentZoteroItemKey && typeof ZoteroBridge !== "undefined") ZoteroBridge.selectItemInZotero(state.currentZoteroItemKey, state.currentZoteroLibraryID);
    });
    document.getElementById("btn-zotero-unlink")?.addEventListener("click", () => {
      updateZoteroBindUI(null);
      showGlobalToast("已解除 Zotero 文献绑定", "info");
    });
  }
  var init_zotero_modal_binder = __esm({
    "src/modules/kanban-view/zotero-modal-binder.ts"() {
      "use strict";
      init_zotero_drawer();
    }
  });

  // src/modules/kanban-view/manuscript-modal.ts
  function bindAddManuscriptButton() {
    document.getElementById("btn-add-manuscript")?.addEventListener("click", () => {
      openManuscriptModal(null);
    });
  }
  function openManuscriptModal(man = null, prefill = null) {
    const w = window;
    const isEdit = !!man;
    const initialTitle = isEdit ? man.title : prefill?.title;
    const initialJournal = isEdit ? man.targetJournals?.[0] : prefill?.publication;
    const initialAbstract = isEdit ? man.abstract : prefill?.abstract;
    const initialAuthors = isEdit ? Array.isArray(man.authors) ? man.authors.join("; ") : man.authors : Array.isArray(prefill?.authorList) && prefill.authorList.length ? prefill.authorList.join("; ") : prefill?.authors;
    const initialDoi = isEdit ? man.doi : prefill?.doi;
    const initialArticleUrl = isEdit ? man.articleUrl : prefill?.articleUrl || prefill?.pdfUrl;
    const initialStatus = isEdit ? man.status : prefill?.status || (prefill?.isCapturedPublication ? "published" : "idea");
    const state = {
      currentZoteroItemKey: isEdit ? man.zoteroItemKey || null : prefill?.zoteroItemKey || null,
      currentZoteroLibraryID: isEdit ? man.zoteroLibraryID ?? null : prefill?.zoteroLibraryID ?? null,
      currentZoteroUri: isEdit ? man.zoteroUri || null : prefill?.zoteroUri || null,
      currentPdfUri: isEdit ? man.pdfUri || null : prefill?.pdfUri || null,
      currentCiteKey: isEdit ? man.citekey || "" : prefill?.citekey || "",
      currentBibtex: isEdit ? man.bibtex || "" : prefill?.bibtex || "",
      currentCitationApa: isEdit ? man.citationApa || "" : prefill?.citationApa || "",
      currentRelatedItems: isEdit ? man.relatedItems || [] : prefill?.relatedItems || []
    };
    const isZoteroEnv = Boolean(typeof ZoteroBridge !== "undefined" && ZoteroBridge.isZotero || typeof window !== "undefined" && (w.Zotero || w.parent?.Zotero));
    const zoteroActionBarHtml = isZoteroEnv ? `
    <div class="zotero-modal-action-bar" id="zotero-modal-hub" style="background:var(--material-background, rgba(0,0,0,0.02)); border:1px solid var(--border-color); border-radius:8px; padding:10px 14px; margin-bottom:14px; display:flex; flex-direction:column; gap:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
        <div id="zotero-bind-status" style="font-size:12px; display:flex; align-items:center; gap:8px; cursor:pointer;" title="点击检索或关联 Zotero 文献库">
          ${state.currentZoteroItemKey ? `<span style="color:#059669; font-weight:600; display:inline-flex; align-items:center; gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>已关联 Zotero 文献条目</span>` : `<span style="color:#64748b; font-weight:500; display:inline-flex; align-items:center; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>${escapeHTML(currentLanguage === "zh" ? "未绑定 Zotero 文献条目 (点击可搜索关联)" : "No Zotero item linked (Click to search)")}</span>`}
          <span id="zotero-modal-citekey" class="zotero-citekey-badge" style="${state.currentCiteKey ? "" : "display:none;"}" title="点击复制 Citation Key">[@${escapeHTML(state.currentCiteKey)}]</span>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
          <button type="button" class="btn-secondary" id="btn-zotero-fetch-active" style="padding:4px 9px; font-size:11px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;" title="读取 Zotero 当前选中的文献条目并自动填充各字段">📥 从当前选中导入</button>
          <button type="button" class="btn-secondary" id="btn-zotero-toggle-search" style="padding:4px 9px; font-size:11px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;" title="在 Zotero 文献库中按关键词检索文献">🔍 检索文献库</button>
          <button type="button" class="btn-secondary" id="btn-zotero-copy-bib" style="padding:4px 8px; font-size:11px; color:#475569; ${state.currentBibtex ? "" : "display:none;"}" title="复制 BibTeX 引用条目">📋 BibTeX</button>
          <button type="button" class="btn-secondary" id="btn-zotero-copy-apa" style="padding:4px 8px; font-size:11px; color:#475569; ${state.currentCitationApa ? "" : "display:none;"}" title="复制标准引用 (APA)">📋 引用</button>
          <button type="button" class="btn-secondary" id="btn-zotero-toggle-annos" style="padding:4px 8px; font-size:11px; color:#d97706; ${state.currentZoteroItemKey ? "" : "display:none;"}" title="查看并引用 Zotero 研读资产库">📑 研读资产</button>
          <button type="button" class="btn-secondary" id="btn-zotero-open-pdf" style="padding:4px 8px; font-size:11px; color:#059669; ${state.currentZoteroItemKey ? "" : "display:none;"}" title="在 Zotero 阅读器中打开 PDF">📖 原文 PDF</button>
          <button type="button" class="btn-secondary" id="btn-zotero-sync-note" style="padding:4px 8px; font-size:11px; color:#e11d48; border-color:rgba(225,29,72,0.3); font-weight:500; ${state.currentZoteroItemKey ? "" : "display:none;"}" title="同步稿件进展至 Zotero 云笔记">📝 同步笔记</button>
          <button type="button" class="btn-secondary" id="btn-zotero-locate" style="padding:4px 8px; font-size:11px; ${state.currentZoteroItemKey ? "" : "display:none;"}" title="${escapeHTML(currentLanguage === "zh" ? "在 Zotero 文献库中定位该条目" : "Locate item in Zotero library")}">🔗 ${escapeHTML(currentLanguage === "zh" ? "定位" : "Locate")}</button>
          <button type="button" class="btn-secondary" id="btn-zotero-unlink" style="padding:4px 8px; font-size:11px; color:#ef4444; ${state.currentZoteroItemKey ? "" : "display:none;"}" title="${escapeHTML(currentLanguage === "zh" ? "解除与 Zotero 文献的绑定" : "Unlink from Zotero item")}">✕ ${escapeHTML(currentLanguage === "zh" ? "解绑" : "Unlink")}</button>
        </div>
      </div>
      <div id="zotero-active-item-banner" style="display:none; background:rgba(37, 99, 235, 0.08); border:1px solid rgba(37, 99, 235, 0.25); border-radius:6px; padding:7px 10px; font-size:11.5px; color:#1d4ed8; justify-content:space-between; align-items:center;">
        <span id="zotero-active-item-text" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:78%;"></span>
        <button type="button" class="btn-primary" id="btn-zotero-quick-bind-active" style="padding:3px 9px; font-size:11px; cursor:pointer; flex-shrink:0;">⚡ 一键关联填入</button>
      </div>
      <div id="zotero-search-container" style="position:relative; width:100%; display:${state.currentZoteroItemKey ? "none" : "block"};">
        <input type="text" id="ipt-zotero-live-search" placeholder="${escapeHTML(currentLanguage === "zh" ? "🔍 检索 Zotero 10 文献库 (输入标题/作者/DOI/年份) 快速关联并填充..." : "🔍 Search Zotero 10 library (title/author/DOI/year) to link...")}" style="font-size:12px; padding:7px 10px; width:100%; box-sizing:border-box; background:var(--input-bg); color:hsl(var(--text-primary)); border:1px solid var(--input-border); border-radius:6px; outline:none;">
        <div id="zotero-search-results-dropdown" class="zotero-search-dropdown" style="display:none;"></div>
      </div>
      <div id="man-zotero-annotations-panel" class="zotero-annotations-panel" style="display:none;"></div>
      <div id="man-zotero-related-panel" style="display:none; font-size:11px; color:hsl(var(--text-secondary));">
        <strong>🔗 Zotero 关联文献网络：</strong>
        <div id="man-zotero-related-chips" class="zotero-related-chips"></div>
      </div>
    </div>
  ` : "";
    openModal(`
    <div class="modal-header">
      <h2>${escapeHTML(isEdit ? t("editManuscriptMetadata") : t("addNewManuscriptTitle"))}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal" title="关闭">✕</button>
    </div>
    ${buildAcademicCaptureSummary(prefill)}
    ${zoteroActionBarHtml}
    <div class="form-group">
      <label>${escapeHTML(t("manuscriptTitleLabel"))}</label>
      <input type="text" id="man-title" value="${escapeHTML(initialTitle || "")}" placeholder="${escapeHTML(t("paperTitlePlaceholder"))}">
    </div>
    <div class="grid-cols-2">
      <div class="form-group">
        <label>${escapeHTML(t("writingStatus"))}</label>
        <select id="man-status">
          <option value="planning" ${initialStatus === "planning" ? "selected" : ""}>${escapeHTML(t("statusPlanning"))}</option>
          <option value="idea" ${initialStatus === "idea" ? "selected" : ""}>${escapeHTML(t("statusIdea"))}</option>
          <option value="outline" ${initialStatus === "outline" ? "selected" : ""}>${escapeHTML(t("statusOutline"))}</option>
          <option value="in_progress" ${initialStatus === "in_progress" ? "selected" : ""}>${escapeHTML(t("statusInProgress"))}</option>
          <option value="figure_preparation" ${initialStatus === "figure_preparation" ? "selected" : ""}>${escapeHTML(t("statusFiguresPrep"))}</option>
          <option value="drafting" ${initialStatus === "drafting" ? "selected" : ""}>${escapeHTML(t("statusDrafting"))}</option>
          <option value="internal_review" ${initialStatus === "internal_review" ? "selected" : ""}>${escapeHTML(t("statusInternalReview"))}</option>
          <option value="submitted" ${initialStatus === "submitted" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("submitted"))}</option>
          <option value="under_review" ${initialStatus === "under_review" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("under_review"))}</option>
          <option value="revision" ${initialStatus === "revision" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("revision"))}</option>
          <option value="accepted" ${initialStatus === "accepted" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("accepted"))}</option>
          <option value="published" ${initialStatus === "published" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("published"))}</option>
          <option value="rejected" ${initialStatus === "rejected" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("rejected"))}</option>
        </select>
      </div>
      <div class="form-group">
        <label>${escapeHTML(t("targetJournalInput"))}</label>
        <input type="text" id="man-journal" value="${escapeHTML(initialJournal || "")}" placeholder="${escapeHTML(t("targetJournalPlaceholder"))}">
      </div>
    </div>
    <div class="form-group">
      <label>${escapeHTML(t("authorsLabel"))}</label>
      <input type="text" id="man-authors" value="${escapeHTML(initialAuthors || "")}" placeholder="A. Researcher; B. Scientist">
    </div>
    <div class="grid-cols-2">
      <div class="form-group">
        <label>${escapeHTML(t("doiLabel"))}</label>
        <input type="text" id="man-doi" value="${escapeHTML(initialDoi || "")}" placeholder="10.xxxx/xxxxx">
      </div>
      <div class="form-group">
        <label>${escapeHTML(t("scholarSourcePage"))}</label>
        <input type="url" id="man-article-url" value="${escapeHTML(initialArticleUrl || "")}" placeholder="https://…">
      </div>
    </div>
    <div class="form-group">
      <label>${escapeHTML(t("abstractDraft"))}</label>
      <textarea id="man-abstract" placeholder="${escapeHTML(t("abstractPlaceholder"))}">${escapeHTML(initialAbstract || "")}</textarea>
    </div>
    <div class="modal-footer" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        ${isEdit ? `<button type="button" class="btn-danger" id="btn-modal-delete-man" style="cursor:pointer; padding:6px 14px;">${escapeHTML(t("deleteManuscript") || (currentLanguage === "zh" ? "删除稿件" : "Delete Manuscript"))}</button>` : ""}
      </div>
      <div style="display:flex; gap:8px;">
        <button type="button" class="btn-secondary" id="btn-cancel-man">${escapeHTML(t("cancel") || "取消")}</button>
        <button type="button" class="btn-primary" id="btn-submit-man" style="min-width:120px;">${escapeHTML(isEdit ? t("saveChanges") : t("createManuscript"))}</button>
      </div>
    </div>
  `);
    document.getElementById("btn-cancel-man")?.addEventListener("click", closeModal);
    document.getElementById("btn-modal-delete-man")?.addEventListener("click", () => {
      closeModal();
      deleteManuscript(man.id);
    });
    if (isZoteroEnv) {
      setupZoteroModalBindings(state);
    }
    document.getElementById("btn-submit-man")?.addEventListener("click", async () => {
      const title = (document.getElementById("man-title")?.value || "").trim();
      const status = document.getElementById("man-status")?.value || "idea";
      const journal = (document.getElementById("man-journal")?.value || "").trim();
      const authors = splitAcademicAuthors(document.getElementById("man-authors")?.value || "");
      const doi = normalizeDoi(document.getElementById("man-doi")?.value || "");
      const articleUrl = (document.getElementById("man-article-url")?.value || "").trim();
      const abstract = (document.getElementById("man-abstract")?.value || "").trim();
      if (!title) {
        alert(t("manuscriptTitleRequired"));
        return;
      }
      const duplicate = !isEdit && prefill ? findAcademicManuscriptMatch({ title, doi, articleUrl }) : null;
      if (duplicate && !confirm(t("academicDuplicateConfirm"))) return;
      const targetManuscript = isEdit ? man : duplicate;
      if (targetManuscript) {
        try {
          validateLinkedManuscriptStatus(targetManuscript, status);
        } catch (error) {
          showGlobalToast(error.message, "error");
          return;
        }
        targetManuscript.title = title;
        setManuscriptStatus(targetManuscript, status);
        targetManuscript.targetJournals = journal ? [journal] : [];
        targetManuscript.abstract = abstract;
        targetManuscript.authors = authors;
        targetManuscript.firstAuthor = authors[0] || targetManuscript.firstAuthor || null;
        targetManuscript.doi = doi || null;
        targetManuscript.articleUrl = articleUrl || null;
        targetManuscript.zoteroItemKey = state.currentZoteroItemKey;
        targetManuscript.zoteroLibraryID = state.currentZoteroLibraryID;
        targetManuscript.zoteroUri = state.currentZoteroUri;
        targetManuscript.pdfUri = state.currentPdfUri;
        targetManuscript.citekey = state.currentCiteKey || targetManuscript.citekey || null;
        targetManuscript.bibtex = state.currentBibtex || targetManuscript.bibtex || null;
        targetManuscript.citationApa = state.currentCitationApa || targetManuscript.citationApa || null;
        if (prefill) targetManuscript.academicCaptureProvenance = academicCaptureProvenance(prefill);
        targetManuscript.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        syncLinkedSubmissionsFromManuscript(targetManuscript);
      } else {
        db.manuscripts.push({
          id: "man_" + Math.random().toString(36).substring(2, 9),
          userId: "user",
          title,
          shortTitle: null,
          manuscriptType: "article",
          status,
          abstract,
          keywords: [],
          authors,
          firstAuthor: authors[0] || null,
          correspondingAuthors: [],
          targetJournals: journal ? [journal] : [],
          doi: doi || null,
          articleUrl: articleUrl || null,
          zoteroItemKey: state.currentZoteroItemKey || null,
          zoteroLibraryID: state.currentZoteroLibraryID || null,
          zoteroUri: state.currentZoteroUri || null,
          pdfUri: state.currentPdfUri || null,
          citekey: state.currentCiteKey || null,
          bibtex: state.currentBibtex || null,
          citationApa: state.currentCitationApa || null,
          academicCaptureProvenance: academicCaptureProvenance(prefill),
          currentVersion: "1.0",
          plannedFigures: [],
          notes: null,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      await w.storage.saveAll(db);
      if (state.currentZoteroItemKey && typeof ZoteroBridge !== "undefined" && ZoteroBridge.isZotero) {
        ZoteroBridge.syncStatusTag(state.currentZoteroItemKey, status, state.currentZoteroLibraryID);
        if (ZoteroBridge.getPref("autoAddToPipelineCollection", true)) {
          ZoteroBridge.addToPipelineCollection(state.currentZoteroItemKey, state.currentZoteroLibraryID);
        }
        if (ZoteroBridge.getPref("autoSyncChildNotes", true)) {
          ZoteroBridge.syncNote(state.currentZoteroItemKey, state.currentZoteroLibraryID);
        }
      }
      closeModal();
      renderKanban();
      renderDashboard();
      renderSubmissions();
      showGlobalToast(duplicate ? t("academicDuplicateUpdated") : prefill ? t("academicCaptureSaved") : "Manuscripts updated!", "success");
    });
  }
  var init_manuscript_modal = __esm({
    "src/modules/kanban-view/manuscript-modal.ts"() {
      "use strict";
      init_status_helpers();
      init_board_renderer();
      init_zotero_modal_binder();
    }
  });

  // src/modules/kanban-view/card-builder.ts
  function buildKanbanCard(m, linkedSubmission, onReRender, removeDropPlaceholders) {
    const w = window;
    const currentJournal = linkedSubmission?.targetJournal || linkedSubmission?.journalName || m.targetJournals?.[0] || (currentLanguage === "zh" ? "待定" : "TBD");
    const card = document.createElement("div");
    card.className = `glass-card kanban-card kanban-status-${normalizeKanbanStatusClass(m.status)}`;
    card.setAttribute("draggable", "true");
    card.setAttribute("data-id", m.id);
    card.setAttribute("data-manuscript-id", m.id);
    const zoteroRowHtml = m.zoteroItemKey ? `
    <div class="kanban-zotero-row">
      <span class="zotero-card-badge" data-item-key="${escapeHTML(m.zoteroItemKey)}" title="在 Zotero 文献库中选中此条目">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H6.4l5.6 6v2H2v-2h7.6L4 5V3z"/></svg>
        Zotero
      </span>
      ${m.citekey ? `<span class="zotero-citekey-badge" id="badge-citekey-${m.id}" data-citekey="${escapeHTML(m.citekey)}" title="点击复制 Citation Key">[@${escapeHTML(m.citekey)}]</span>` : ""}
      ${m.pdfUri ? `<span class="zotero-pdf-badge" data-item-key="${escapeHTML(m.zoteroItemKey)}" title="在 Zotero PDF 阅读器中打开">📖 PDF</span>` : ""}
      ${m.annotationCount ? `<span class="zotero-anno-badge" title="包含 ${m.annotationCount} 条 Zotero PDF 高亮批注">📑 ${m.annotationCount}</span>` : ""}
      <span class="zotero-sync-note-badge" id="badge-sync-note-${m.id}" data-item-key="${escapeHTML(m.zoteroItemKey)}" title="同步审稿进展至 Zotero 云端笔记">📝 同步</span>
    </div>` : "";
    const pendingLinkBtnHtml = w._pendingZoteroLinkItem ? `<button class="btn-primary" style="padding: 2px 8px; font-size:10px; height: 24px; background:#e11d48; border-color:#be123c;" id="btn-link-this-${m.id}">🔗 ${currentLanguage === "zh" ? "关联此文献" : "Link Item"}</button>` : "";
    const targetJournalLabel = currentLanguage === "zh" ? "目标期刊" : "Target";
    const editLabel = currentLanguage === "zh" ? "编辑" : "Edit";
    const deleteLabel = currentLanguage === "zh" ? "删除" : "Delete";
    w.RFUI.setHTML(card, `
    <div class="kanban-card-title-row">
      <h4 title="${escapeHTML(m.title)}">${escapeHTML(m.title)}</h4>
    </div>
    <div class="kanban-card-meta-row">
      <span class="kanban-status-pill">${escapeHTML(getManuscriptStatusLabel(m.status))}</span>
      ${linkedSubmission?.externalManuscriptId ? `<span class="badge badge-purple" style="font-size:10px; padding:1px 5px; border-radius:3px;" title="Manuscript ID: ${escapeHTML(linkedSubmission.externalManuscriptId)}">ID: ${escapeHTML(linkedSubmission.externalManuscriptId)}</span>` : ""}
      <p>${targetJournalLabel}: <strong>${escapeHTML(currentJournal)}</strong></p>
    </div>
    ${zoteroRowHtml}
    <div class="kanban-card-controls">
      <select class="kanban-card-select" id="sel-man-status-${m.id}" aria-label="${escapeHTML(t("status"))}: ${escapeHTML(m.title)}">
        <option value="planning" ${m.status === "planning" ? "selected" : ""}>${escapeHTML(t("statusPlanning"))}</option>
        <option value="idea" ${m.status === "idea" ? "selected" : ""}>${escapeHTML(t("statusIdea"))}</option>
        <option value="outline" ${m.status === "outline" ? "selected" : ""}>${escapeHTML(t("statusOutline"))}</option>
        <option value="in_progress" ${m.status === "in_progress" ? "selected" : ""}>${escapeHTML(t("statusInProgress"))}</option>
        <option value="figure_preparation" ${m.status === "figure_preparation" ? "selected" : ""}>${escapeHTML(t("statusFiguresPrep"))}</option>
        <option value="drafting" ${m.status === "drafting" ? "selected" : ""}>${escapeHTML(t("statusDrafting"))}</option>
        <option value="internal_review" ${m.status === "internal_review" ? "selected" : ""}>${escapeHTML(t("statusInternalReview"))}</option>
        <option value="submitted" ${m.status === "submitted" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("submitted"))}</option>
        <option value="under_review" ${m.status === "under_review" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("under_review"))}</option>
        <option value="revision" ${m.status === "revision" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("revision"))}</option>
        <option value="accepted" ${m.status === "accepted" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("accepted"))}</option>
        <option value="published" ${m.status === "published" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("published"))}</option>
        <option value="rejected" ${m.status === "rejected" ? "selected" : ""}>${escapeHTML(getSubmissionStatusLabel("rejected"))}</option>
      </select>
      <div class="kanban-card-actions">
        ${pendingLinkBtnHtml}
        ${linkedSubmission ? `<button type="button" class="btn-secondary btn-open-linked-submission" data-sub-id="${escapeHTML(linkedSubmission.id)}" aria-label="${escapeHTML(t("openSubmissionDetails"))}: ${escapeHTML(m.title)}">${escapeHTML(t("openSubmissionDetails"))}</button>` : ""}
        <button type="button" class="btn-secondary btn-edit-manuscript" id="btn-edit-man-${m.id}">${editLabel}</button>
        <button type="button" class="btn-secondary btn-delete-manuscript" id="btn-delete-man-${m.id}" title="${escapeHTML(deleteLabel)}">${deleteLabel}</button>
      </div>
    </div>
  `);
    card.addEventListener("dragstart", (e) => {
      card.classList.add("dragging");
      e.dataTransfer?.setData("text/plain", m.id);
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      removeDropPlaceholders();
    });
    card.querySelector(".btn-open-linked-submission")?.addEventListener("click", (event) => {
      event.stopPropagation();
      navigateToSubmissionDetails(event.currentTarget.dataset.subId);
    });
    card.querySelector(`#sel-man-status-${m.id}`)?.addEventListener("change", async (e) => {
      const boardEl = document.querySelector(".kanban-board");
      const beforeRects = w.RFUI?.captureElementRects?.(boardEl, ".kanban-card[data-manuscript-id]", "data-manuscript-id");
      try {
        const result = await persistManuscriptStatusChange(m, e.target.value);
        if (m.zoteroItemKey && typeof ZoteroBridge !== "undefined") {
          ZoteroBridge.syncStatusTag(m.zoteroItemKey, e.target.value, m.zoteroLibraryID);
          if (ZoteroBridge.getPref("autoAddToPipelineCollection", true)) {
            ZoteroBridge.addToPipelineCollection(m.zoteroItemKey, m.zoteroLibraryID);
          }
          if (ZoteroBridge.getPref("autoSyncChildNotes", true)) {
            ZoteroBridge.syncNote(m.zoteroItemKey, m.zoteroLibraryID);
          }
        }
        onReRender();
        w.RFUI?.playFlipAnimation?.(boardEl, ".kanban-card[data-manuscript-id]", "data-manuscript-id", beforeRects, {
          duration: 280,
          highlightKey: m.id,
          highlightClass: "kanban-card-landed"
        });
        renderDashboard();
        renderSubmissions();
        showGlobalToast(t("manuscriptStatusUpdated"), "success");
        if (result.shouldCelebrate && (typeof ZoteroBridge === "undefined" || ZoteroBridge.getPref("enableAcceptanceCelebration", true))) {
          showAcceptanceCelebration({ title: result.manuscript.title, manuscriptId: result.manuscript.id });
        }
      } catch (error) {
        console.error("Manuscript status save failed:", error);
        onReRender();
        showGlobalToast(error.message || t("autoSaveFailed"), "error");
      }
    });
    card.addEventListener("click", (e) => {
      if (e.target.closest?.("button, select, a, input, textarea, .zotero-card-badge, .zotero-pdf-badge, .zotero-citekey-badge")) return;
      if (m.zoteroItemKey && typeof ZoteroBridge !== "undefined" && ZoteroBridge.getPref("locateOnManuscriptClick", true)) {
        ZoteroBridge.selectItemInZotero(m.zoteroItemKey, m.zoteroLibraryID);
      }
    });
    card.querySelector(`#btn-edit-man-${m.id}`)?.addEventListener("click", () => openManuscriptModal(m));
    card.querySelector(`#btn-delete-man-${m.id}`)?.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteManuscript(m.id);
    });
    bindKanbanCardBadges(card, m, onReRender);
    return card;
  }
  function bindKanbanCardBadges(card, m, onReRender) {
    const w = window;
    card.querySelector(`#btn-link-this-${m.id}`)?.addEventListener("click", async (e) => {
      e.stopPropagation();
      const pItem = w._pendingZoteroLinkItem;
      if (!pItem) return;
      m.zoteroItemKey = pItem.key;
      m.zoteroLibraryID = pItem.libraryID ?? null;
      m.zoteroUri = pItem.zoteroUri;
      m.pdfUri = pItem.pdfUri;
      if (!m.doi && pItem.doi) m.doi = pItem.doi;
      m.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      await w.storage.saveAll(db);
      w._pendingZoteroLinkItem = null;
      onReRender();
      showGlobalToast(`已将文献《${(pItem.title || "").slice(0, 18)}…》成功关联到稿件！`, "success");
      if (typeof ZoteroBridge !== "undefined" && ZoteroBridge.isZotero && ZoteroBridge.getPref("autoSyncChildNotes", true)) {
        ZoteroBridge.syncNote(m.zoteroItemKey, m.zoteroLibraryID);
      }
    });
    card.querySelector(".zotero-card-badge")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = e.currentTarget.dataset.itemKey;
      if (key && typeof ZoteroBridge !== "undefined") {
        ZoteroBridge.selectItemInZotero(key, m.zoteroLibraryID);
      }
    });
    card.querySelector(".zotero-pdf-badge")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = e.currentTarget.dataset.itemKey;
      if (key && typeof ZoteroBridge !== "undefined") {
        ZoteroBridge.openPdf(key, m.zoteroLibraryID);
      }
    });
    card.querySelector(".zotero-citekey-badge")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const ck = e.currentTarget.dataset.citekey;
      if (ck) {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(`\\cite{${ck}}`);
        }
        showGlobalToast(`已复制引文命令：\\cite{${ck}}`, "info");
      }
    });
    card.querySelector(".zotero-sync-note-badge")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      const key = e.currentTarget.dataset.itemKey;
      if (key && typeof ZoteroBridge !== "undefined") {
        const ok = await ZoteroBridge.syncNote(key, m.zoteroLibraryID);
        showGlobalToast(ok ? "已成功将审稿时间线同步至 Zotero 笔记！" : "同步失败，请检查条目是否存在", ok ? "success" : "error");
      }
    });
  }
  var init_card_builder = __esm({
    "src/modules/kanban-view/card-builder.ts"() {
      "use strict";
      init_status_helpers();
      init_manuscript_modal();
    }
  });

  // src/modules/kanban-view/board-renderer.ts
  function removeKanbanDropPlaceholders() {
    document.querySelectorAll(".kanban-drop-placeholder").forEach((el) => el.remove());
  }
  function renderKanban() {
    const w = window;
    if (w.RFUI?.isViewDeferred?.("view-manuscripts")) return;
    const columns = ["idea", "drafting", "submitted", "accepted"];
    columns.forEach((col) => {
      w.RFUI.setHTML(document.getElementById(`cards-${col}`), "");
    });
    const viewSection = document.getElementById("view-manuscripts");
    let banner = document.getElementById("zotero-link-banner");
    if (w._pendingZoteroLinkItem && viewSection) {
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "zotero-link-banner";
        banner.className = "zotero-link-banner";
        const board = viewSection.querySelector(".kanban-board");
        if (board) viewSection.insertBefore(banner, board);
        else viewSection.prepend(banner);
      }
      const pItem = w._pendingZoteroLinkItem;
      w.RFUI.setHTML(banner, `
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:20px;">📎</span>
        <div>
          <div style="font-weight:600; color:hsl(var(--text-primary));">正在关联 Zotero 文献：${escapeHTML(pItem.title || "无标题文献")}</div>
          <div style="font-size:11px; color:hsl(var(--text-secondary));">${escapeHTML(pItem.authors || "")} ${pItem.year ? `· ${escapeHTML(pItem.year)}` : ""} ${pItem.publication ? `· ${escapeHTML(pItem.publication)}` : ""}</div>
        </div>
      </div>
      <button class="btn-secondary" id="btn-cancel-zotero-link" style="padding:4px 10px; font-size:12px;">取消关联</button>
    `);
      document.getElementById("btn-cancel-zotero-link")?.addEventListener("click", () => {
        w._pendingZoteroLinkItem = null;
        renderKanban();
      });
    } else if (banner) {
      banner.remove();
    }
    const mCount = { idea: 0, drafting: 0, submitted: 0, accepted: 0 };
    let visibleManuscripts = db.manuscripts || [];
    if (w._activeZoteroCollectionFilter && w._activeZoteroCollectionItemKeys) {
      visibleManuscripts = visibleManuscripts.filter(
        (m) => m.zoteroItemKey && w._activeZoteroCollectionItemKeys.has(m.zoteroItemKey)
      );
    }
    visibleManuscripts.forEach((m) => {
      let col = "idea";
      if (m.status === "planning" || m.status === "outline" || m.status === "idea" || m.status === "data_collection") col = "idea";
      else if (m.status === "in_progress" || m.status === "drafting" || m.status === "figure_preparation" || m.status === "internal_review" || m.status === "rejected") col = "drafting";
      else if (m.status === "submitted" || m.status === "under_review" || m.status === "revision") col = "submitted";
      else if (m.status === "accepted" || m.status === "published") col = "accepted";
      mCount[col]++;
      const linkedSubmission = w.RFCore.getCurrentSubmission(db, m.id);
      const card = buildKanbanCard(m, linkedSubmission, renderKanban, removeKanbanDropPlaceholders);
      document.getElementById(`cards-${col}`)?.appendChild(card);
    });
    bindKanbanColumnsAndPlaceholders(columns, mCount, visibleManuscripts.length);
  }
  function bindKanbanColumnsAndPlaceholders(columns, mCount, totalVisible) {
    const w = window;
    const collapseEmpty = typeof ZoteroBridge !== "undefined" ? ZoteroBridge.getPref("collapseEmptyKanbanStages", false) : false;
    const emptyHints = {
      idea: { icon: "🎯", text: currentLanguage === "zh" ? "暂无规划手稿" : "No planned manuscripts", sub: currentLanguage === "zh" ? "可拖拽手稿至此阶段" : "Drag manuscripts here" },
      drafting: { icon: "⏳", text: currentLanguage === "zh" ? "暂无进行中手稿" : "No active drafts", sub: currentLanguage === "zh" ? "可拖拽手稿至此阶段" : "Drag manuscripts here" },
      submitted: { icon: "🚀", text: currentLanguage === "zh" ? "暂无已投稿件" : "No submissions", sub: currentLanguage === "zh" ? "可拖拽手稿至此阶段" : "Drag manuscripts here" },
      accepted: { icon: "🎉", text: currentLanguage === "zh" ? "暂无已接收手稿" : "No accepted papers", sub: currentLanguage === "zh" ? "可拖拽手稿至此阶段" : "Drag manuscripts here" }
    };
    columns.forEach((col) => {
      const countEl = document.getElementById(`count-${col}`);
      if (countEl) countEl.textContent = String(mCount[col]);
      const colEl = document.querySelector(`.kanban-col[data-status="${col}"]`);
      if (colEl) {
        colEl.classList.toggle("is-empty", mCount[col] === 0);
        colEl.classList.toggle("is-collapsed-empty", collapseEmpty && mCount[col] === 0);
      }
      const colCardsContainer = document.getElementById(`cards-${col}`);
      if (!colCardsContainer) return;
      if (mCount[col] === 0) {
        const hint = emptyHints[col] || { icon: "📥", text: currentLanguage === "zh" ? "暂无条目" : "No items", sub: "" };
        w.RFUI.setHTML(colCardsContainer, `
        <div class="kanban-empty-placeholder">
          <span class="empty-icon">${hint.icon}</span>
          <span class="empty-text">${escapeHTML(hint.text)}</span>
          <span class="empty-subtext">${escapeHTML(hint.sub)}</span>
        </div>
      `);
      }
      if (!colCardsContainer.dataset.dragBound) {
        colCardsContainer.dataset.dragBound = "true";
        colCardsContainer.addEventListener("dragover", (e) => {
          e.preventDefault();
          colCardsContainer.classList.add("drag-over");
          if (!colCardsContainer.querySelector?.(".kanban-drop-placeholder")) {
            removeKanbanDropPlaceholders();
            const ph = document.createElement("div");
            ph.className = "kanban-drop-placeholder";
            colCardsContainer.appendChild(ph);
          }
        });
        colCardsContainer.addEventListener("dragleave", (e) => {
          if (e.relatedTarget && colCardsContainer.contains?.(e.relatedTarget)) return;
          colCardsContainer.classList.remove("drag-over");
          colCardsContainer.querySelector?.(".kanban-drop-placeholder")?.remove();
        });
        colCardsContainer.addEventListener("drop", async (e) => {
          e.preventDefault();
          colCardsContainer.classList.remove("drag-over");
          removeKanbanDropPlaceholders();
          const manuscriptId = e.dataTransfer?.getData("text/plain");
          const man = (db.manuscripts || []).find((x) => x.id === manuscriptId);
          if (!man) return;
          const newStatus = col === "idea" ? "planning" : col === "drafting" ? "in_progress" : col;
          const boardEl = document.querySelector(".kanban-board");
          const beforeRects = w.RFUI?.captureElementRects?.(boardEl, ".kanban-card[data-manuscript-id]", "data-manuscript-id");
          try {
            const result = await persistManuscriptStatusChange(man, newStatus);
            renderKanban();
            w.RFUI?.playFlipAnimation?.(boardEl, ".kanban-card[data-manuscript-id]", "data-manuscript-id", beforeRects, {
              duration: 280,
              highlightKey: man.id,
              highlightClass: "kanban-card-landed"
            });
            renderDashboard();
            renderSubmissions();
            showGlobalToast(tf("manuscriptStatusUpdatedTo", { status: getManuscriptStatusLabel(newStatus) }), "success");
            if (result.shouldCelebrate) {
              showAcceptanceCelebration({ title: result.manuscript.title, manuscriptId: result.manuscript.id });
            }
          } catch (error) {
            console.error("Manuscript status drop save failed:", error);
            renderKanban();
            showGlobalToast(error.message || t("autoSaveFailed"), "error");
          }
        });
      }
    });
    document.querySelector(".kanban-board")?.classList.toggle("all-empty", totalVisible === 0);
    setText("#kanban-stage-summary", tf("kanbanStageSummary", { count: columns.filter((col) => mCount[col] > 0).length, total: columns.length }));
    updateKanbanEmptyColumns();
  }
  var init_board_renderer = __esm({
    "src/modules/kanban-view/board-renderer.ts"() {
      "use strict";
      init_status_helpers();
      init_card_builder();
    }
  });

  // src/modules/kanban-view.ts
  var require_kanban_view = __commonJS({
    "src/modules/kanban-view.ts"(exports, module) {
      init_status_helpers();
      init_board_renderer();
      init_manuscript_modal();
      bindAddManuscriptButton();
      initializeKanbanEmptyColumnsMode();
      var exportedApi = {
        renderKanban,
        deleteManuscript,
        openManuscriptModal,
        updateKanbanEmptyColumns,
        initializeKanbanEmptyColumnsMode
      };
      var g = typeof globalThis !== "undefined" ? globalThis : window;
      Object.assign(g, exportedApi);
      if (typeof window !== "undefined") {
        Object.assign(window, exportedApi);
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          ...module.exports || {},
          ...exportedApi
        };
      }
    }
  });
  require_kanban_view();
})();
