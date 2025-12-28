import re
import os
import json

BASE_DIR = '/home/mosab/projects/chatmodule/frontend/public/knowledge'
AR_DIR = os.path.join(BASE_DIR, 'ar')
JSON_PATH = os.path.join(BASE_DIR, 'knowledge.json')

TEMPLATE_START = """<!DOCTYPE html>
<html lang="{lang}"{dir_attr}>
<head>
  <link rel="stylesheet" href="article-styles.css">
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>{title}</title>
    
</head>
<body>
"""

TEMPLATE_END = """
</body>
</html>
"""

def read_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return None

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def load_titles():
    try:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            titles = {}
            for chapter in data.get('chapters', []):
                for episode in chapter.get('episodes', []):
                    # Map 1-1 to 1.1
                    ep_id = episode['id'].replace('-', '.')
                    titles[ep_id] = episode['title']
            return titles
    except Exception as e:
        print(f"Error loading knowledge.json: {e}")
        return {}

TITLES = load_titles()

def get_title(episode_id, lang='en'):
    prefix = f"Episode {episode_id}: " if lang == 'en' else f"الحلقة {episode_id}: "
    if episode_id in TITLES:
        return prefix + TITLES[episode_id].get(lang, "")
    return f"Episode {episode_id}"

def clean_html_content(content, title, lang='en'):
    # Extract Body Content
    body_match = re.search(r'<div class=WordSection1>([\s\S]*?)</div>\s*</body>', content, re.IGNORECASE)
    if not body_match:
         body_match = re.search(r'<body[^>]*>([\s\S]*?)</body>', content, re.IGNORECASE)
    
    if not body_match:
        return content # Return original if no body found
        
    body_content = body_match.group(1)
    
    # Cleanup
    body_content = re.sub(r'<script[\s\S]*?</script>', '', body_content, flags=re.IGNORECASE)
    body_content = re.sub(r'<style[\s\S]*?</style>', '', body_content, flags=re.IGNORECASE)
    body_content = re.sub(r'<!--[\s\S]*?-->', '', body_content)
    
    def clean_tag(match):
        tag = match.group(1)
        attrs = match.group(2)
        new_attrs = []
        
        src_match = re.search(r'src=["\'](.*?)["\']', attrs, re.IGNORECASE)
        if src_match: new_attrs.append(f'src="{src_match.group(1)}"')
            
        href_match = re.search(r'href=["\'](.*?)["\']', attrs, re.IGNORECASE)
        if href_match: new_attrs.append(f'href="{href_match.group(1)}"')
            
        alt_match = re.search(r'alt=["\'](.*?)["\']', attrs, re.IGNORECASE)
        if alt_match: new_attrs.append(f'alt="{alt_match.group(1)}"')
            
        colspan = re.search(r'colspan=["\']?(\d+)["\']?', attrs, re.IGNORECASE)
        if colspan: new_attrs.append(f'colspan="{colspan.group(1)}"')
        rowspan = re.search(r'rowspan=["\']?(\d+)["\']?', attrs, re.IGNORECASE)
        if rowspan: new_attrs.append(f'rowspan="{rowspan.group(1)}"')
            
        attrs_str = ' '.join(new_attrs)
        if attrs_str:
            return f'<{tag} {attrs_str}>'
        return f'<{tag}>'

    body_content = re.sub(r'<span[^>]*>([\s\S]*?)</span>', r'\1', body_content, flags=re.IGNORECASE)
    body_content = re.sub(r'<span[^>]*>([\s\S]*?)</span>', r'\1', body_content, flags=re.IGNORECASE)
    body_content = re.sub(r'<(\w+)\s+([^>]+)>', clean_tag, body_content)
    
    body_content = re.sub(r'<b>(.*?)</b>', r'<strong>\1</strong>', body_content)
    body_content = re.sub(r'<i>(.*?)</i>', r'<em>\1</em>', body_content)
    
    # Remove empty paragraphs and headings
    body_content = re.sub(r'<p>\s*&nbsp;\s*</p>', '', body_content)
    body_content = re.sub(r'<p>\s*</p>', '', body_content)
    body_content = re.sub(r'<h[1-6]>\s*&nbsp;\s*</h[1-6]>', '', body_content)
    body_content = re.sub(r'<h[1-6]>\s*</h[1-6]>', '', body_content)

    # Remove broken figure/figcaption tags
    body_content = re.sub(r'</?figure>', '', body_content, flags=re.IGNORECASE)
    body_content = re.sub(r'</?figcaption>', '', body_content, flags=re.IGNORECASE)

    # SKIP TABLE UNWRAPPING FOR 1.4.html TO AVOID TRUNCATION
    # The regex was causing issues with nested tables.
    
    # Remove top spacing
    body_content = body_content.strip()
    
    # Ensure the first element is the correct H1 title
    body_content = re.sub(r'<h1>.*?</h1>', '', body_content, count=1, flags=re.IGNORECASE)
    body_content = f"<h1>{title}</h1>\n" + body_content

    dir_attr = ' dir="rtl"' if lang == 'ar' else ''
    css_path = '../article-styles.css' if lang == 'ar' else 'article-styles.css'
    
    html = TEMPLATE_START.format(lang=lang, dir_attr=dir_attr, css_path=css_path, title=title)
    html += body_content
    html += TEMPLATE_END
    
    return html

def process_file(filename):
    print(f"Processing {filename}...")
    en_path = os.path.join(BASE_DIR, filename)
    
    episode_id = filename.replace('.html', '')
    
    # Process English
    if os.path.exists(en_path):
        en_content = read_file(en_path)
        en_title = get_title(episode_id, 'en')
        clean_en = clean_html_content(en_content, en_title, 'en')
        write_file(en_path, clean_en)
    else:
        print(f"File {en_path} not found!")

def main():
    process_file('1.4.html')

if __name__ == '__main__':
    main()
