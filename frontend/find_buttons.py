import os
import re

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
                # Find all button tags
                buttons = re.finditer(r'<button\b[^>]*>', content)
                for b in buttons:
                    tag = b.group(0)
                    if 'onClick' not in tag and 'type="submit"' not in tag:
                        print(f"{path}: missing click handler -> {tag}")
