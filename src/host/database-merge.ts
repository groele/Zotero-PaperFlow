/**
 * Zotero PaperFlow - Database 3-Way Merge Engine
 */

export const hostDatabaseMergeMethods = {
  mergeDatabaseEdits(this: any, base: any, local: any, current: any, options: any = {}) {
    const missing = Symbol('missing');
    const conflicts: any[] = [];
    const details: any[] = [];
    const conflict = (before: any, edited: any, latest: any, path: any, tokens: any, kind = 'value') => {
      const key = JSON.stringify([kind, ...tokens]);
      const box = (value: any) => value === missing ? { exists: false } : { exists: true, value };
      conflicts.push(path);
      if (options.details) details.push({ key, path, kind, base: box(before), local: box(edited), current: box(latest) });
      const choice = options.choices?.[key];
      return choice === 'base' ? before : choice === 'local' ? edited : latest;
    };
    const object = (value: any) => value !== missing && value !== null && typeof value === 'object' && !Array.isArray(value);
    const same = (a: any, b: any): boolean => {
      if (a === b) return true;
      if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => same(v, b[i]));
      if (object(a) && object(b)) {
        const keys = Object.keys(a);
        return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && same(a[key], b[key]));
      }
      return false;
    };
    const identified = (values: any) => Array.isArray(values) && values.every(item => object(item)
      && ((typeof item.id === 'string' && item.id.trim()) || (typeof item.id === 'number' && Number.isFinite(item.id))))
      && new Set(values.map(item => String(item.id))).size === values.length;
    const merge = (before: any, edited: any, latest: any, path: any, tokens: any[] = []): any => {
      if (same(edited, before)) return latest;
      if (same(latest, before) || same(edited, latest)) return edited;
      if (object(edited) && object(latest) && (object(before) || before === missing)) {
        const result: Record<string, any> = {};
        for (const key of new Set([...Object.keys(latest), ...Object.keys(edited), ...Object.keys(before === missing ? {} : before)])) {
          if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
          const value = (obj: any) => obj !== missing && Object.hasOwn(obj, key) ? obj[key] : missing;
          let combined;
          if (!path && ['revision', 'lastUpdated', 'updatedAt', 'deviceId'].includes(key)) combined = value(latest);
          else if (['updatedAt', 'deletedAt'].includes(key) && Date.parse(edited[key]) && Date.parse(latest[key])) {
            combined = Date.parse(edited[key]) >= Date.parse(latest[key]) ? edited[key] : latest[key];
          } else combined = merge(value(before), value(edited), value(latest), path ? `${path}.${key}` : key, [...tokens, ['field', key] as any]);
          if (combined !== missing) result[key] = combined;
        }
        return result;
      }
      if (identified(edited) && identified(latest) && (identified(before) || before === missing)) {
        const map = (values: any) => new Map((values === missing ? [] : values).map(item => [String(item.id), item]));
        const old = map(before), ours = map(edited), theirs = map(latest);
        const common = new Set([...old.keys()].filter(id => ours.has(id) && theirs.has(id)));
        const order = (records: any) => [...records.keys()].filter(id => common.has(id));
        const localReordered = !same(order(old), order(ours));
        const latestReordered = !same(order(old), order(theirs));
        let preferred = localReordered && !latestReordered ? ours : theirs;
        if (localReordered && latestReordered && !same(order(ours), order(theirs))) {
          const selected = conflict([...old.keys()], [...ours.keys()], [...theirs.keys()], `${path}.order`, tokens, 'order');
          preferred = new Map(selected.map((id: any) => [id, null]));
        }
        const result: any[] = [];
        for (const id of new Set([...preferred.keys(), ...theirs.keys(), ...ours.keys(), ...old.keys()])) {
          const entry = (records: any) => records.has(id) ? records.get(id) : missing;
          const combined = merge(entry(old), entry(ours), entry(theirs), `${path}[${id}]`, [...tokens, ['id', id] as any]);
          if (combined !== missing) result.push(combined);
        }
        return result;
      }
      return conflict(before, edited, latest, path, tokens);
    };
    const data = merge(base, local, current, '');
    return options.details ? { data, conflicts, details } : { data, conflicts };
  }
};
