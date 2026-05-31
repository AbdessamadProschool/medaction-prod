import json
import os

new_keys_fr = {
    "updating": "Mise à jour en cours...",
    "email_not_provided": "Email non fourni",
    "no_suggestion": "Aucune suggestion",
    "photos": "Photos"
}

new_keys_ar = {
    "updating": "جاري التحديث...",
    "email_not_provided": "البريد الإلكتروني غير متوفر",
    "no_suggestion": "لا يوجد اقتراح",
    "photos": "الصور"
}

def update_json_file(file_path, new_keys):
    if not os.path.exists(file_path):
        return
        
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for k, v in new_keys.items():
        if k not in data["admin"]["common_modal"]:
            data["admin"]["common_modal"][k] = v
            
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

update_json_file('locales/fr/common.json', new_keys_fr)
update_json_file('locales/ar/common.json', new_keys_ar)
