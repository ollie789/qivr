#!/usr/bin/env python3
import re
import sys

def merge_sx_props(original_sx):
    """Extract sx props from FlexBetween and merge with default flexbox props"""
    # Default flexbox props
    base_props = {
        'display': '"flex"',
        'justifyContent': '"space-between"',
        'alignItems': '"center"'
    }
    
    # Parse existing sx if present
    if 'sx={{' in original_sx:
        # Extract content between {{ and }}
        match = re.search(r'sx=\{\{([^}]+)\}\}', original_sx)
        if match:
            props_str = match.group(1)
            # Parse individual props
            for prop in props_str.split(','):
                prop = prop.strip()
                if ':' in prop:
                    key, value = prop.split(':', 1)
                    key = key.strip()
                    value = value.strip()
                    base_props[key] = value
    
    # Build merged sx string
    props_list = [f'{k}: {v}' for k, v in base_props.items()]
    return 'sx={{ ' + ', '.join(props_list) + ' }}'

def replace_flexbetween(content):
    """Replace FlexBetween with Box"""
    # Pattern to match <FlexBetween ...>
    pattern = r'<FlexBetween([^>]*)>'
    
    def replacer(match):
        attrs = match.group(1)
        merged_sx = merge_sx_props(attrs)
        # Keep other attributes except sx
        other_attrs = re.sub(r'sx=\{\{[^}]+\}\}', '', attrs).strip()
        if other_attrs:
            return f'<Box {other_attrs} {merged_sx}>'
        return f'<Box {merged_sx}>'
    
    content = re.sub(pattern, replacer, content)
    content = content.replace('</FlexBetween>', '</Box>')
    
    return content

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 replace-flexbetween.py <file>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Remove FlexBetween import
    content = re.sub(r',?\s*FlexBetween,?\s*', '', content)
    
    # Replace FlexBetween usage
    content = replace_flexbetween(content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"✓ Replaced FlexBetween in {filepath}")

if __name__ == '__main__':
    main()
