import json
import sys

if __name__ == '__main__':
    # Fail intentionally to test error handling
    sys.stderr.write('fail script: simulating an error')
    sys.exit(1)
