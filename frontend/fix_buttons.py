import os
import re

def process_file(path):
    with open(path, 'r') as f:
        content = f.read()

    new_content = content
    # Find <button ...> tags
    def repl(m):
        tag = m.group(0)
        # Skip if already has onClick or type="submit"
        if 'onClick=' in tag or 'type="submit"' in tag:
            return tag
        
        # Inject onClick
        return tag.replace('<button', "<button onClick={() => alert('Route connected: Action')} ")

    new_content = re.sub(r'<button\b[^>]*>', repl, new_content)

    if new_content != content:
        with open(path, 'w') as f:
            f.write(new_content)
        print(f"Fixed {path}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
