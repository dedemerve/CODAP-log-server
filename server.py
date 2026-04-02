from flask import Flask, request, jsonify
import json, os
from datetime import datetime

app = Flask(__name__)

@app.route('/api/logs', methods=['POST', 'OPTIONS'])
def receive_log():
    if request.method == 'OPTIONS':
        return '', 204
    data = request.get_json()
    os.makedirs('logs', exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
    filename = f"logs/log_{timestamp}.json"
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Yeni log alındı: {filename}")
    return jsonify({"status": "ok"}), 200

@app.after_request
def add_cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    return response

if __name__ == '__main__':
    app.run(port=5000, debug=True)
