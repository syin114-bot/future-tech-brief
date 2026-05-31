from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import os
import jwt
import bcrypt
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# 配置
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")
JWT_SECRET = os.getenv("JWT_SECRET")

try:
    client = MongoClient(MONGO_URL)

    client.admin.command("ping")

    db = client[DB_NAME]

    print("✅ MongoDB 连接成功")

except Exception as e:

    print(f"❌ MongoDB 连接失败: {e}")

# ── 首页 ──
@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "✅ 后端在线！", "version": "2.0"})

# ── 健康检查 ──
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"}), 200

# ── 注册 ──
@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        email = data.get("email", "").lower().strip()
        password = data.get("password", "")
        nickname = data.get("nickname", "").strip()

        if not email or not password or not nickname:
            return jsonify({"status": "error", "message": "请填写所有必填字段"}), 400

        if len(password) < 6:
            return jsonify({"status": "error", "message": "密码至少需要 6 位"}), 400

        # 检查邮箱是否已存在
        if db.users.find_one({"email": email}):
            return jsonify({"status": "error", "message": "该邮箱已注册"}), 409

        # 加密密码
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

        # 存入数据库
        user = {
            "email": email,
            "password": hashed,
            "nickname": nickname,
            "created_at": datetime.utcnow().isoformat(),
            "badges": [],
            "projects": []
        }
        result = db.users.insert_one(user)

        # 生成 JWT
        token = jwt.encode(
            {"user_id": str(result.inserted_id), "email": email, "exp": datetime.utcnow() + timedelta(days=30)},
            JWT_SECRET, algorithm="HS256"
        )

        return jsonify({
            "status": "success",
            "message": "注册成功！",
            "token": token,
            "user": {"email": email, "nickname": nickname}
        }), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ── 登录 ──
@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email", "").lower().strip()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({"status": "error", "message": "请填写邮箱和密码"}), 400

        user = db.users.find_one({"email": email})
        if not user:
            return jsonify({"status": "error", "message": "邮箱或密码错误"}), 401

        if not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
            return jsonify({"status": "error", "message": "邮箱或密码错误"}), 401

        token = jwt.encode(
            {"user_id": str(user["_id"]), "email": email, "exp": datetime.utcnow() + timedelta(days=30)},
            JWT_SECRET, algorithm="HS256"
        )

        return jsonify({
            "status": "success",
            "message": "登录成功！",
            "token": token,
            "user": {"email": email, "nickname": user.get("nickname", "")}
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ── 获取 AI 工具列表 ──
@app.route("/api/tools", methods=["GET"])
def get_tools():
    try:
        tools = list(db.tools.find({}, {"_id": 0}))
        return jsonify({"status": "success", "data": tools})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
