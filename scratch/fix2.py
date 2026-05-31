import os
import re

files_replacements = {
    r"app/[locale]/(main)/dashboard/page.tsx": [
        (r"\.map\(c =>", r".map((c: any) =>")
    ],
    r"app/[locale]/(main)/etablissements/page.tsx": [
        (r"\.filter\(c =>", r".filter((c: any) =>"),
        (r"\.reduce\(\(acc, a\) =>", r".reduce((acc: any, a: any) =>")
    ],
    r"app/[locale]/(main)/reclamations/urgentes/page.tsx": [
        (r"\.filter\(c =>", r".filter((c: any) =>")
    ],
    r"app/[locale]/admin/campagnes/page.tsx": [
        (r"STATUTS_COLORS\[statut\]", r"STATUTS_COLORS[statut as keyof typeof STATUTS_COLORS]")
    ],
    r"app/[locale]/admin/evenements/\[id\]/modifier/page.tsx": [
        (r"\.filter\(\(m\) =>", r".filter((m: any) =>"),
        (r"\.filter\(m =>", r".filter((m: any) =>")
    ],
    r"app/[locale]/admin/evenements/page.tsx": [
        (r"\.find\(c =>", r".find((c: any) =>")
    ],
    r"app/[locale]/admin/programmes-activites/page.tsx": [
        (r"\.reduce\(\(acc, a\) =>", r".reduce((acc: any, a: any) =>")
    ],
    r"app/[locale]/admin/reclamations/page.tsx": [
        (r"\.find\(c =>", r".find((c: any) =>"),
        (r"\.reduce\(\(acc, a\) =>", r".reduce((acc: any, a: any) =>")
    ],
    r"app/[locale]/admin/suggestions/page.tsx": [
        (r"\.sort\(\(a, b\) =>", r".sort((a: any, b: any) =>")
    ],
    r"app/[locale]/coordinateur/calendrier/page.tsx": [
        (r"\.filter\(e =>", r".filter((e: any) =>")
    ],
    r"app/[locale]/coordinateur/etablissements/page.tsx": [
        (r"\.map\(e =>", r".map((e: any) =>")
    ],
    r"app/[locale]/coordinateur/rapports/page.tsx": [
        (r"\.map\(\(rapport\)", r".map((rapport: any)")
    ]
}

for path, replacements in files_replacements.items():
    if not os.path.exists(path):
        print(f"File not found: {path}")
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    for search, replace in replacements:
        new_content = re.sub(search, replace, content)
        if new_content != content:
            content = new_content
            modified = True
        else:
            print(f"Not found in {path}: {search}")
            
    if modified:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {path}")
