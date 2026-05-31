from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# MongoDB 连接
MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://isjoellim_db_user:HC9NZr3aFrpALAqU@cluster0.iublsz0.mongodb.net/?appName=Cluster0")
DB_NAME = os.getenv("DB_NAME", "future_tech_brief")

try:
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    print("✅ MongoDB 连接成功")
except Exception as e:
    print(f"❌ MongoDB 连接失败: {e}")

# 首页
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "✅ 后端在线！",
        "message": "未来科技简报 API",
        "version": "1.0"
    })

# 获取 AI 工具列表
@app.route("/api/tools", methods=["GET"])
def get_tools():
    try:
        tools_collection = db["tools"]
        tools = list(tools_collection.find({}, {"_id": 0}))
        return jsonify({
            "status": "success",
            "data": tools
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# 健康检查
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
