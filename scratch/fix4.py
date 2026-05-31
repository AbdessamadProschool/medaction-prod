import os
import re

def fix_file(file_path, replacements):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    for old, new in replacements:
        content = content.replace(old, new)
        # Also try regex for more robust matching if literal fails
        # but here we use simple replace since I'll provide exact matches.

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {file_path}")

fix_file(
    r"c:\Users\Proschool\Desktop\medaction\app\[locale]\(main)\reclamations\urgentes\page.tsx",
    [("{communes.map((c) => (", "{communes.map((c: any) => (")]
)

fix_file(
    r"c:\Users\Proschool\Desktop\medaction\app\[locale]\admin\evenements\page.tsx",
    [("communes.map(c =>", "communes.map((c: any) =>")]
)

fix_file(
    r"c:\Users\Proschool\Desktop\medaction\app\[locale]\admin\programmes-activites\page.tsx",
    [("activites.filter(a =>", "activites.filter((a: any) =>")]
)

fix_file(
    r"c:\Users\Proschool\Desktop\medaction\app\[locale]\admin\reclamations\page.tsx",
    [("communes.map(c =>", "communes.map((c: any) =>"), ("agents.map(a =>", "agents.map((a: any) =>")]
)

fix_file(
    r"c:\Users\Proschool\Desktop\medaction\app\[locale]\admin\suggestions\page.tsx",
    [(".reduce((a, b) => a + b", ".reduce((a: any, b: any) => a + b")]
)

fix_file(
    r"c:\Users\Proschool\Desktop\medaction\app\[locale]\coordinateur\calendrier\page.tsx",
    [("{etablissements.map(e =>", "{etablissements.map((e: any) =>")]
)

fix_file(
    r"c:\Users\Proschool\Desktop\medaction\app\[locale]\coordinateur\etablissements\page.tsx",
    [("etablissements.filter(e =>", "etablissements.filter((e: any) =>")]
)

fix_file(
    r"c:\Users\Proschool\Desktop\medaction\app\[locale]\coordinateur\rapports\page.tsx",
    [("rapports.filter(rapport =>", "rapports.filter((rapport: any) =>")]
)

print("Done.")
