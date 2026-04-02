from flask import Flask, request, jsonify
from supabase import create_client
import os

app = Flask(__name__)

SUPABASE_URL = "https://jycizbiclzyjapmxntya.supabase.co"
SUPABASE_KEY = "sb_secret_aknZfuuWplP30OtG5vYF_w_X5Ece8E3"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "sunucu calisiyor"}), 200

@app.route('/api/logs', methods=['POST', 'OPTIONS'])
def receive_log():
    if request.method == 'OPTIONS':
        return '', 204

    data = request.get_json()
    if not data:
        return jsonify({"error": "veri yok"}), 400

    student_id = data.get('runKey', 'unknown_student')
    action = data.get('action', 'unknown')
    timestamp_ms = data.get('timestamp', 0)
    parameters = data.get('parameters', {})

    supabase.table('logs').insert({
        'student_id': student_id,
        'action': action,
        'timestamp_ms': timestamp_ms,
        'parameters': parameters,
        'raw_data': data
    }).execute()

    print(f"[{student_id}] {action} kaydedildi")
    return jsonify({"status": "ok"}), 200

@app.after_request
def add_cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    return response

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
