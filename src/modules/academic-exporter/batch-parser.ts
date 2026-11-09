/**
 * Zotero PaperFlow - Batch Review Comments Parser
 */

export function parseReviewCommentsBatch(rawText = '', defaultReviewer = 'Reviewer #1'): any[] {
  if (!rawText || !rawText.trim()) return [];
  const lines = rawText.split(/\r?\n/);
  const comments: any[] = [];
  let currentReviewer = defaultReviewer || 'Reviewer #1';
  let currentBuffer: string[] = [];

  const reviewerRegex = /^(?:(?:Reviewer|Referee|审稿人|评审人|审稿专家)\s*#?\s*([0-9]+|[A-Z一二三四五六七八九十])|(?:Editor(?:-in-Chief)?|Associate\s+Editor|Guest\s+Editor|Handling\s+Editor|主编|副主编|责任编辑|编辑部?)|Comments?\s+from\s+(?:the\s+)?(?:Editor|Reviewers?)|(?:编辑|审稿人|评审人)意见)/i;
  const pointRegex = /^(?:(?:Point|Comment|Issue|Item|Q|问题|意见|建议)\s*#?\s*([0-9]+)[\s.:)-：、]|(?:Major|Minor)\s*(?:Comments?|Points?)\s*#?\s*([0-9]+)[\s.:)-：、]|([0-9]{1,2})[\s.:)-、：]\s*|(\([0-9]{1,2}\)|（[0-9]{1,2}）)\s*|([a-z]\))\s*|[-*•·]\s+)/i;
  const cnNumMap: Record<string, string> = { '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '十': '10' };

  function flushComment() {
    const text = currentBuffer.join('\n').trim();
    if (text) {
      comments.push({
        id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${comments.length}`,
        reviewer: currentReviewer,
        comment: text,
        response: '',
        changes: '',
        status: 'pending'
      });
    }
    currentBuffer = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentBuffer.length > 0) {
        currentBuffer.push('');
      }
      continue;
    }

    const revMatch = line.match(reviewerRegex);
    if (revMatch) {
      flushComment();
      if (/Editor|主编|编辑/i.test(line)) {
        currentReviewer = 'Editor';
      } else {
        const rawRevNum = revMatch[1] || '1';
        const revNum = cnNumMap[rawRevNum] || rawRevNum;
        currentReviewer = `Reviewer #${revNum}`;
      }
      continue;
    }

    const pointMatch = line.match(pointRegex);
    if (pointMatch) {
      flushComment();
      currentBuffer.push(line);
    } else {
      currentBuffer.push(line);
    }
  }

  flushComment();

  if (comments.length === 0 && rawText.trim()) {
    const blocks = rawText.split(/\r?\n\s*\r?\n/).map((b) => b.trim()).filter(Boolean);
    blocks.forEach((block, idx) => {
      comments.push({
        id: `rev_${Date.now()}_${idx}`,
        reviewer: currentReviewer,
        comment: block,
        response: '',
        changes: '',
        status: 'pending'
      });
    });
  }

  return comments;
}
