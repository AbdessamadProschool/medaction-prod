import os
import re

files_replacements = {
    r"app/[locale]/(main)/etablissements/page.tsx": [
        (r"communes\.map\(c =>", r"communes.map((c: any) =>"),
        (r"annexes\.map\(a =>", r"annexes.map((a: any) =>")
    ],
    r"app/[locale]/admin/evenements/[id]/modifier/page.tsx": [
        (r"\.some\(m =>", r".some((m: any) =>")
    ],
    r"app/[locale]/admin/evenements/page.tsx": [
        (r"communes\.find\(c =>", r"communes.find((c: any) =>")
    ],
    r"app/[locale]/admin/programmes-activites/page.tsx": [
        (r"\.reduce\(\(acc: any, a\) =>", r".reduce((acc: any, a: any) =>")
    ],
    r"app/[locale]/admin/reclamations/page.tsx": [
        (r"communes\.find\(c =>", r"communes.find((c: any) =>"),
        (r"annexes\.map\(a =>", r"annexes.map((a: any) =>")
    ],
    r"app/[locale]/admin/suggestions/page.tsx": [
        (r"\.sort\(\(a, b\) =>", r".sort((a: any, b: any) =>")
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
