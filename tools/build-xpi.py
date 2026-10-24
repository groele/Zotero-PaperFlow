from pathlib import Path
import json
import sys

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / 'scripts'))
from release_package import main

version = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))['version']
main(root, 'Zotero-PaperFlow', ('update.json',),
     ('zotero-paperflow@groele.org', 'researchflow@groele.org'),
     f'docs/releases/v{version}-verification.json')
