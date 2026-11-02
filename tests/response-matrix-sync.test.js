const test = require('node:test');
const assert = require('node:assert/strict');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function synthesizeReviewMatrixNoteHtml(reviewRows) {
  if (!Array.isArray(reviewRows) || reviewRows.length === 0) return '';
  let noteHtml = `<h3>📋 审稿人逐条意见与修回回复矩阵 (Response Matrix)</h3>`;
  noteHtml += `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; width:100%; font-size:12px; border-color:#cbd5e1;">`;
  noteHtml += `<tr style="background:#f1f5f9; font-weight:600;"><th style="width:45%; text-align:left;">审稿人意见 (Reviewer Comment)</th><th style="width:55%; text-align:left;">作者修回回复 (Author Response)</th></tr>`;
  for (let i = 0; i < reviewRows.length; i++) {
    const r = reviewRows[i];
    const cmt = escapeHtml(r.comment || '').replace(/\n/g, '<br/>');
    const resp = escapeHtml(r.response || '').replace(/\n/g, '<br/>');
    const reviewerBadge = r.reviewer ? ` <span style="background:#e0e7ff; color:#3730a3; padding:1px 5px; border-radius:3px; font-size:10px;">${escapeHtml(r.reviewer)}</span>` : '';
    const changesRow = r.changes ? `<div style="margin-top:4px; font-size:11px; color:#0369a1;"><strong>📝 修改说明:</strong> ${escapeHtml(r.changes)}</div>` : '';
    noteHtml += `<tr><td style="vertical-align:top; background:#f8fafc;"><strong>#${i + 1}</strong>${reviewerBadge}<br/>${cmt || '<em style="color:#94a3b8;">暂无内容</em>'}</td><td style="vertical-align:top;">${resp || '<em style="color:#94a3b8;">待撰写回复</em>'}${changesRow}</td></tr>`;
  }
  noteHtml += `</table>`;
  return noteHtml;
}

test('Review Matrix generates well-formed HTML tables with escaping', () => {
  const rows = [
    {
      reviewer: 'Reviewer #1',
      comment: 'Please clarify equation (1) with respect to <MoS2> defect density.',
      response: 'We added detailed explanations in Section 2.2 & Supplementary Note 1.',
      changes: 'Page 5, Lines 140-155; Supplementary Figure S3'
    },
    {
      reviewer: 'Reviewer #2',
      comment: 'Line 45: "error bars missing"',
      response: 'Error bars representing standard deviation (N=5) have been included.',
      changes: 'Figure 2 and Figure 4 captions updated'
    }
  ];

  const html = synthesizeReviewMatrixNoteHtml(rows);
  assert.ok(html.includes('&lt;MoS2&gt;'));
  assert.ok(html.includes('&quot;error bars missing&quot;'));
  assert.ok(html.includes('Section 2.2 &amp; Supplementary Note 1'));
  assert.ok(html.includes('Reviewer #1'));
  assert.ok(html.includes('Reviewer #2'));
  assert.ok(html.includes('Page 5, Lines 140-155'));
  assert.ok(html.includes('Figure 2 and Figure 4 captions updated'));
  assert.ok(html.includes('<strong>#1</strong>'));
  assert.ok(html.includes('<strong>#2</strong>'));
  assert.ok(html.includes('<table border="1"'));
});

test('Review Matrix falls back gracefully on empty rows', () => {
  const emptyHtml = synthesizeReviewMatrixNoteHtml([]);
  assert.equal(emptyHtml, '');

  const partialRows = [{ comment: '', response: '' }];
  const html = synthesizeReviewMatrixNoteHtml(partialRows);
  assert.ok(html.includes('暂无内容'));
  assert.ok(html.includes('待撰写回复'));
});

test('Review Matrix multi-line responses convert newlines to <br/> tags', () => {
  const multiline = [
    {
      comment: 'Point 1\nPoint 2\nPoint 3',
      response: 'Response 1\nResponse 2'
    }
  ];
  const html = synthesizeReviewMatrixNoteHtml(multiline);
  assert.ok(html.includes('Point 1<br/>Point 2<br/>Point 3'));
  assert.ok(html.includes('Response 1<br/>Response 2'));
});
