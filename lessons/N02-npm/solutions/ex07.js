export function bump(version, level) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!m) throw new RangeError(`Invalid version: ${version}`);
  const [major, minor, patch] = m.slice(1).map(Number);
  switch (level) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    default: throw new RangeError(`Invalid level: ${level}`);
  }
}

const RANK = { patch: 1, minor: 2, major: 3 };

export function releaseType(commits) {
  let best = null;
  const up = (level) => {
    if (best === null || RANK[level] > RANK[best]) best = level;
  };
  for (const message of commits) {
    const [header = '', ...body] = message.split(/\r?\n/);
    const m = /^(\w+)(\([^)]*\))?(!)?:\s/.exec(header);
    if (m?.[3] || body.some((l) => /^BREAKING CHANGE:/.test(l))) up('major');
    else if (m?.[1] === 'feat') up('minor');
    else if (m && (m[1] === 'fix' || m[1] === 'perf')) up('patch');
  }
  return best;
}

export function nextVersion(current, commits) {
  const level = releaseType(commits);
  return level === null ? current : bump(current, level);
}
