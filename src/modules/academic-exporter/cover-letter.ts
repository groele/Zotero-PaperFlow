/**
 * Zotero PaperFlow - Academic Revision Cover Letter Generator
 */
import {
  getSubmissionReviewMatrixRows,
  safeEscapeLatex,
} from './latex-helpers';

declare function escapeHTML(value: any): string;
declare function getSubmissionFirstAuthor(sub: any, man?: any): string;

export function generateRevisionCoverLetter(sub: any = {}, man: any = {}, format = 'html'): string {
  const esc = typeof escapeHTML === 'function' ? escapeHTML : ((s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  const paperTitle = man.title || sub.title || 'Untitled Manuscript';
  const journal = sub.targetJournal || 'the Journal';
  const firstAuthor = typeof getSubmissionFirstAuthor === 'function' ? getSubmissionFirstAuthor(sub, man) : (man.authors || sub.firstAuthor || 'Author');
  const authors = man.authors || firstAuthor || 'The Authors';
  const msId = sub.externalManuscriptId ? ` (Manuscript ID: ${sub.externalManuscriptId})` : '';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const rows = getSubmissionReviewMatrixRows(sub);
  const totalComments = rows.length;
  const reviewerSet = new Set(rows.map((r: any) => r.reviewer || 'Reviewer').filter(Boolean));
  const reviewerCount = reviewerSet.size || 2;

  if (format === 'latex') {
    return `\\documentclass[11pt]{article}\n` +
      `\\usepackage[margin=1in]{geometry}\n` +
      `\\usepackage{charter}\n` +
      `\\usepackage{microtype}\n` +
      `\\usepackage{hyperref}\n\n` +
      `\\begin{document}\n\n` +
      `\\noindent ${safeEscapeLatex(dateStr)} \\\\[1.5em]\n` +
      `\\noindent To:\\\\ \n` +
      `The Editor-in-Chief / Handling Editor,\\\\ \n` +
      `\\textit{${safeEscapeLatex(journal)}}\\\\[1.5em]\n\n` +
      `\\noindent\\textbf{Subject: Submission of Revised Manuscript${safeEscapeLatex(msId)}}\\\\[0.5em]\n` +
      `\\textbf{Title:} \`\`${safeEscapeLatex(paperTitle)}''\\\\ \n` +
      `\\textbf{Authors:} ${safeEscapeLatex(authors)}\\\\[1.5em]\n\n` +
      `\\noindent Dear Editor,\\par\\medskip\n\n` +
      `\\noindent Thank you very much for your letter and the constructive comments from the editorial team and the ${reviewerCount} reviewers regarding our manuscript entitled \`\`\\textbf{${safeEscapeLatex(paperTitle)}}''${safeEscapeLatex(msId)}. We greatly appreciate the time and effort devoted to evaluating our work.\\par\\medskip\n\n` +
      `\\noindent We have carefully studied all comments and thoroughly revised the manuscript accordingly. In summary, the main revisions include:\\par\n` +
      `\\begin{itemize}\n` +
      `  \\item Fully addressing all ${totalComments} comments raised by the reviewers and editor, with corresponding textual and graphical updates.\n` +
      `  \\item Providing comprehensive experimental and analytical clarifications to strengthen the core arguments.\n` +
      `  \\item Highlighting all modifications in the revised manuscript and providing a detailed Point-by-Point Response document.\n` +
      `\\end{itemize}\\par\\medskip\n\n` +
      `\\noindent We confirm that all authors have approved this revised version and that the work has not been published or submitted elsewhere.\\par\\medskip\n\n` +
      `\\noindent We believe the revised manuscript has been substantially improved and now meets the high standards of \\textit{${safeEscapeLatex(journal)}}. We look forward to your favorable consideration.\\par\\vspace{2em}\n\n` +
      `\\noindent Sincerely,\\\\\n` +
      `\\noindent ${safeEscapeLatex(firstAuthor || authors)}\\\\ \n` +
      `\\noindent on behalf of all co-authors\n\n` +
      `\\end{document}\n`;
  }

  if (format === 'md') {
    return `# Cover Letter for Revised Manuscript\n\n` +
      `**Date:** ${dateStr}  \n` +
      `**To:** The Editor-in-Chief / Handling Editor, *${journal}*  \n` +
      `**Subject:** Submission of Revised Manuscript${msId}  \n` +
      `**Title:** "${paperTitle}"  \n` +
      `**Authors:** ${authors}  \n\n` +
      `---\n\n` +
      `Dear Editor,\n\n` +
      `Thank you very much for your editorial decision and the constructive feedback from the reviewers regarding our manuscript entitled **"${paperTitle}"**${msId} for publication in *${journal}*.\n\n` +
      `We have carefully considered all comments and carried out a comprehensive revision of our manuscript. Specifically:\n\n` +
      `- We have addressed all ${totalComments} comments and suggestions from the ${reviewerCount} reviewers and editor.\n` +
      `- Additional clarifications, analyses, and data have been integrated into the revised text and figures.\n` +
      `- All changes in the revised manuscript have been clearly highlighted, and our point-by-point responses are detailed in the accompanying rebuttal document.\n\n` +
      `All co-authors have reviewed and approved this revised manuscript. We confirm that this work is original and is not under consideration elsewhere.\n\n` +
      `We hope the revised manuscript is now suitable for publication in *${journal}*, and we look forward to hearing from you.\n\n` +
      `Sincerely,\n\n` +
      `**${firstAuthor || authors}**  \n` +
      `*(On behalf of all co-authors)*\n`;
  }

  return `<div style="font-family:'Times New Roman',Times,serif; font-size:12pt; line-height:1.5; color:#111827; max-width:760px; margin:0 auto; padding:24px;">` +
    `<p style="margin-bottom:16px;">${esc(dateStr)}</p>` +
    `<p style="margin-bottom:20px;">` +
      `To:<br>` +
      `The Editor-in-Chief / Handling Editor<br>` +
      `<em>${esc(journal)}</em>` +
    `</p>` +
    `<div style="background:#f8fafc; border-left:4px solid #0284c7; padding:12px 16px; margin-bottom:20px;">` +
      `<p style="margin:0 0 6px 0; font-weight:bold; font-size:13pt;">Subject: Submission of Revised Manuscript${esc(msId)}</p>` +
      `<p style="margin:0 0 4px 0;"><strong>Title:</strong> “${esc(paperTitle)}”</p>` +
      `<p style="margin:0;"><strong>Authors:</strong> ${esc(authors)}</p>` +
    `</div>` +
    `<p style="margin-bottom:14px;">Dear Editor,</p>` +
    `<p style="margin-bottom:14px;">` +
      `Thank you very much for your letter and the constructive comments from the reviewers regarding our manuscript entitled ` +
      `<strong>“${esc(paperTitle)}”</strong>${esc(msId)}. We are grateful to the editorial team and the ${reviewerCount} reviewers for their valuable suggestions to strengthen our work.` +
    `</p>` +
    `<p style="margin-bottom:10px;">` +
      `We have carefully evaluated all feedback and thoroughly revised our manuscript. In particular:` +
    `</p>` +
    `<ul style="margin:0 0 16px 24px; padding:0;">` +
      `<li style="margin-bottom:6px;">We have addressed all ${totalComments} comments raised by the reviewers and editor in detail.</li>` +
      `<li style="margin-bottom:6px;">We have expanded our explanations and integrated necessary additional evidence and figure updates into the manuscript.</li>` +
      `<li style="margin-bottom:6px;">All changes have been clearly highlighted in the revised manuscript, accompanied by our detailed Point-by-Point Response document.</li>` +
    `</ul>` +
    `<p style="margin-bottom:14px;">` +
      `All co-authors have approved this revised version, and we confirm that this manuscript is not under consideration elsewhere.` +
    `</p>` +
    `<p style="margin-bottom:24px;">` +
      `We hope that our revisions satisfactorily address the concerns raised and that the manuscript is now acceptable for publication in <em>${esc(journal)}</em>. We look forward to your decision.` +
    `</p>` +
    `<p style="margin:0;">Sincerely,</p>` +
    `<p style="margin:6px 0 0 0; font-weight:bold;">${esc(firstAuthor || authors)}</p>` +
    `<p style="margin:2px 0 0 0; font-style:italic; color:#4b5563;">On behalf of all co-authors</p>` +
    `</div>`;
}
