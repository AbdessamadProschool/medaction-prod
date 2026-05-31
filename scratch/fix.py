import os

files = {
    r"app/[locale]/(main)/dashboard/page.tsx": [
        (r".map((c) =>", r".map((c: any) =>"),
        (r".filter(c =>", r".filter((c: any) =>"),
        (r".map((entry, index) =>", r".map((entry: any, index: any) =>"),
        (r".map((event, index) =>", r".map((event: any, index: any) =>"),
        (r".map((reclamation, index) =>", r".map((reclamation: any, index: any) =>")
    ],
    r"app/[locale]/(main)/etablissements/page.tsx": [
        (r".filter(c =>", r".filter((c: any) =>"),
        (r".reduce((acc, a) =>", r".reduce((acc: any, a: any) =>"),
        (r".map((etab, index) =>", r".map((etab: any, index: any) =>")
    ],
    r"app/[locale]/(main)/evenements/[id]/page.tsx": [
        (r".filter(m =>", r".filter((m: any) =>"),
        (r".map(tag =>", r".map((tag: any) =>"),
        (r".map((img, idx) =>", r".map((img: any, idx: any) =>")
    ],
    r"app/[locale]/(main)/evenements/page.tsx": [
        (r".map((event, index) =>", r".map((event: any, index: any) =>")
    ],
    r"app/[locale]/(main)/mes-evaluations/page.tsx": [
        (r".map((evaluation, index) =>", r".map((evaluation: any, index: any) =>"),
        (r".reduce((acc, e) =>", r".reduce((acc: any, e: any) =>")
    ],
    r"app/[locale]/(main)/reclamations/urgentes/page.tsx": [
        (r".filter(r =>", r".filter((r: any) =>"),
        (r".filter(c =>", r".filter((c: any) =>"),
        (r".map((reclamation, index) =>", r".map((reclamation: any, index: any) =>")
    ],
    r"app/[locale]/admin/actualites/page.tsx": [
        (r".map((actualite) =>", r".map((actualite: any) =>")
    ],
    r"app/[locale]/admin/articles/page.tsx": [
        (r".map((article) =>", r".map((article: any) =>"),
        (r".map((tag, i) =>", r".map((tag: any, i: any) =>")
    ],
    r"app/[locale]/admin/campagnes/page.tsx": [
        (r"STATUTS_COLORS[statut]", r"STATUTS_COLORS[statut as keyof typeof STATUTS_COLORS]")
    ],
    r"app/[locale]/admin/etablissements/page.tsx": [
        (r"data: { action: 'publish_all' }", r"method: 'POST', data: { action: 'publish_all' }"),
        (r"data: { action: 'delete_all' }", r"method: 'POST', data: { action: 'delete_all' }")
    ],
    r"app/[locale]/admin/evenements/[id]/modifier/page.tsx": [
        (r".filter(m =>", r".filter((m: any) =>"),
        (r".filter((m) =>", r".filter((m: any) =>")
    ],
    r"app/[locale]/admin/evenements/page.tsx": [
        (r".find(c =>", r".find((c: any) =>")
    ],
    r"app/[locale]/admin/page.tsx": [
        (r".map((item, i) =>", r".map((item: any, i: any) =>")
    ],
    r"app/[locale]/admin/programmes-activites/page.tsx": [
        (r".reduce((acc, a) =>", r".reduce((acc: any, a: any) =>")
    ],
    r"app/[locale]/admin/reclamations/[id]/page.tsx": [
        (r".filter(m =>", r".filter((m: any) =>")
    ],
    r"app/[locale]/admin/reclamations/page.tsx": [
        (r".find(c =>", r".find((c: any) =>"),
        (r".reduce((acc, a) =>", r".reduce((acc: any, a: any) =>")
    ],
    r"app/[locale]/admin/suggestions/page.tsx": [
        (r".sort((a, b) =>", r".sort((a: any, b: any) =>")
    ],
    r"app/[locale]/admin/validation/page.tsx": [
        (r"totalPending = Object.values(counts).reduce((a, b) => a + b, 0)", r"totalPending = Object.values(counts).reduce((a: any, b: any) => a + b, 0) as number"),
        (r".reduce((a, b)", r".reduce((a: any, b: any)"),
        (r".sort((a, b) =>", r".sort((a: any, b: any) =>")
    ],
    r"app/[locale]/autorite/reclamations/page.tsx": [
        (r"fetchReclamations", r"refreshReclamations")
    ],
    r"app/[locale]/coordinateur/calendrier/page.tsx": [
        (r"const activites =", r"let activites: any[] ="),
        (r".filter(e =>", r".filter((e: any) =>")
    ],
    r"app/[locale]/coordinateur/etablissements/page.tsx": [
        (r".map(e =>", r".map((e: any) =>")
    ],
    r"app/[locale]/coordinateur/rapports/page.tsx": [
        (r".map((rapport)", r".map((rapport: any)"),
        (r".filter(r =>", r".filter((r: any) =>")
    ],
    r"app/[locale]/super-admin/permissions/page.tsx": [
        (r".filter((p) =>", r".filter((p: any) =>"),
        (r".filter(p =>", r".filter((p: any) =>")
    ]
}

import re

for filepath, replacements in files.items():
    if not os.path.exists(filepath):
        print("Missing:", filepath)
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    for search, replace in replacements:
        if search in content:
            content = content.replace(search, replace)
            modified = True
        else:
            # try regex with whitespace flexibility
            pattern = re.compile(re.escape(search).replace(r"\ ", r"\s+"))
            new_content = pattern.sub(replace, content)
            if new_content != content:
                content = new_content
                modified = True
            else:
                print(f"Not found in {filepath}: {search}")
                
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Updated:", filepath)
