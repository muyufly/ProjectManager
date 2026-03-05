import json
import sys

def main():
    try:
        with open('openapi.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for path, methods in data.get('paths', {}).items():
            for method, details in methods.items():
                print(f"{method.upper()} {path} - {details.get('summary', '')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
