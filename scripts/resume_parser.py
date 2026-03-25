import sys
import json
import warnings

warnings.filterwarnings('ignore')

# Redirect stdout to prevent any internal print statements from pyresparser
# from corrupting the final JSON output string
original_stdout = sys.stdout
sys.stdout = sys.stderr

try:
    from pyresparser import ResumeParser
except ImportError as e:
    sys.stdout = original_stdout
    print(json.dumps({"success": False, "error": f"Import error: {str(e)}"}))
    sys.exit(1)

def main():
    if len(sys.argv) < 2:
        sys.stdout = original_stdout
        print(json.dumps({"success": False, "error": "No file path provided"}))
        sys.exit(1)
        
    file_path = sys.argv[1]
    
    try:
        data = ResumeParser(file_path).get_extracted_data()
        skills = data.get('skills', []) if data else []
        
        if skills is None:
            skills = []
            
        sys.stdout = original_stdout
        print(json.dumps({"success": True, "skills": skills}))
    except Exception as e:
        sys.stdout = original_stdout
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
