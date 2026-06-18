from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import os
import jwt
import bcrypt
from datetime import datetime, timedelta
import cloudinary
import cloudinary.uploader

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ── 环境变量检查 ──
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")
JWT_SECRET = os.getenv("JWT_SECRET")
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

required_vars = ["MONGO_URL", "DB_NAME", "JWT_SECRET"]
for key in required_vars:
    if not os.getenv(key):
        print(f"⚠️ 缺少环境变量: {key}")

if not JWT_SECRET:
    raise ValueError("JWT_SECRET 未配置，请在 Railway Variables 中设置")

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True
    )

# ── MongoDB 连接 ──
db = None
try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    db = client[DB_NAME]
    print("✅ MongoDB 连接成功")
except Exception as e:
    print(f"❌ MongoDB 连接失败: {e}")

# ── 工具函数 ──
def check_db():
    if db is None:
        return jsonify({"status": "error", "message": "数据库未连接"}), 500
    return None

def get_token():
    auth = request.headers.get("Authorization", "")
    return auth.replace("Bearer ", "").strip()

def verify_token(token):
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

def serialize_doc(doc):
    if not doc:
        return doc
    doc["_id"] = str(doc["_id"])
    return doc

def current_user():
    token = get_token()
    if not token:
        return None
    return verify_token(token)

def upload_cover_image(file_storage):
    if not file_storage:
        return ""
    if not (CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET):
        raise ValueError("Cloudinary 未配置，无法上传图片")
    result = cloudinary.uploader.upload(
        file_storage,
        folder="future-tech-brief/projects",
        resource_type="image"
    )
    return result.get("secure_url", "")

# ── 首页 ──
@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "✅ 后端在线！", "version": "2.0"})

# ── 健康检查 ──
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "db": "connected" if db else "disconnected"}), 200

# ── 注册 ──
@app.route("/api/register", methods=["POST"])
def register():
    err = check_db()
    if err: return err

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "无效请求"}), 400

    email = data.get("email", "").lower().strip()
    password = data.get("password", "")
    nickname = data.get("nickname", "").strip()

    if not email or not password or not nickname:
        return jsonify({"status": "error", "message": "请填写所有必填字段"}), 400

    if len(password) < 6:
        return jsonify({"status": "error", "message": "密码至少需要 6 位"}), 400

    try:
        if db.users.find_one({"email": email}):
            return jsonify({"status": "error", "message": "该邮箱已注册"}), 409

        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        user = {
            "email": email,
            "password": hashed,
            "nickname": nickname,
            "created_at": datetime.utcnow().isoformat(),
            "badges": [],
            "projects": [],
            "voted_projects": []
        }
        result = db.users.insert_one(user)

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
    err = check_db()
    if err: return err

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "无效请求"}), 400

    email = data.get("email", "").lower().strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"status": "error", "message": "请填写邮箱和密码"}), 400

    try:
        user = db.users.find_one({"email": email})
        if not user:
            return jsonify({"status": "error", "message": "邮箱或密码错误"}), 401

        stored_pw = user["password"]
        if isinstance(stored_pw, str):
            stored_pw = stored_pw.encode("utf-8")

        if not bcrypt.checkpw(password.encode("utf-8"), stored_pw):
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

# ── 用户资料 ──
@app.route("/api/profile", methods=["GET"])
def profile():
    err = check_db()
    if err: return err

    try:
        token = get_token()
        if not token:
            return jsonify({"status": "error", "message": "未登录"}), 401

        payload = verify_token(token)
        user = db.users.find_one({"email": payload["email"]}, {"password": 0})
        if not user:
            return jsonify({"status": "error", "message": "用户不存在"}), 404

        user["_id"] = str(user["_id"])
        return jsonify({"status": "success", "user": user})

    except Exception as e:
        return jsonify({"status": "error", "message": "Token 无效或已过期"}), 401

# ── 上传项目 ──
@app.route("/api/projects", methods=["POST"])
def upload_project():
    err = check_db()
    if err: return err

    try:
        token = get_token()
        payload = verify_token(token)
    except Exception:
        return jsonify({"status": "error", "message": "请先登录"}), 401

    data = request.form if request.form else request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "无效请求"}), 400

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    if not title or not description:
        return jsonify({"status": "error", "message": "请填写项目名称和介绍"}), 400

    try:
        cover_url = data.get("cover_url", "")
        if "cover_image" in request.files:
            cover_url = upload_cover_image(request.files["cover_image"])

        tags_raw = data.get("tags", [])
        tags = [tag.strip() for tag in tags_raw.split(",") if tag.strip()] if isinstance(tags_raw, str) else tags_raw

        project = {
            "title": title,
            "description": description,
            "difficulty": data.get("difficulty", "beginner"),
            "category": data.get("category", "个人项目"),
            "github_url": data.get("github_url", ""),
            "video_url": data.get("video_url", ""),
            "cover_url": cover_url,
            "author_id": payload["user_id"],
            "author_name": data.get("author_name", "匿名"),
            "tags": tags,
            "emoji": data.get("emoji", "🚀"),
            "votes": 0,
            "comments": 0,
            "shares": 0,
            "voters": [],
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        result = db.projects.insert_one(project)
        project["_id"] = str(result.inserted_id)

        return jsonify({"status": "success", "message": "项目已提交，等待审核通过后展示。", "id": str(result.inserted_id), "project": project}), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ── 获取项目列表 ──
@app.route("/api/projects", methods=["GET"])
def get_projects():
    try:
        projects = []
        if db is not None:
            query = {"status": "approved"}
            token = get_token()
            if token:
                try:
                    payload = verify_token(token)
                    query = {"$or": [{"status": "approved"}, {"author_id": payload["user_id"]}]}
                except Exception:
                    pass
            raw = list(db.projects.find(query).sort([("votes", -1), ("created_at", -1)]))
            for i, p in enumerate(raw):
                p["rank"] = i + 1
                serialize_doc(p)
                p.pop("voters", None)
            projects = raw
        return jsonify({"status": "success", "data": projects})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ── 项目详情 ──
@app.route("/api/projects/<project_id>", methods=["GET"])
def get_project_detail(project_id):
    err = check_db()
    if err: return err

    try:
        project = db.projects.find_one({"_id": ObjectId(project_id)})
        if not project:
            return jsonify({"status": "error", "message": "项目不存在"}), 404

        allowed = project.get("status") == "approved"
        try:
            payload = current_user()
            allowed = allowed or (payload and project.get("author_id") == payload["user_id"])
        except Exception:
            pass
        if not allowed:
            return jsonify({"status": "error", "message": "项目仍在审核中"}), 403

        serialize_doc(project)
        project.pop("voters", None)
        comments = list(db.comments.find({"project_id": project["_id"]}).sort("created_at", 1))
        for comment in comments:
            serialize_doc(comment)
        return jsonify({"status": "success", "project": project, "comments": comments})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ── 项目投票 ──✨ 新增
@app.route("/api/projects/<project_id>/vote", methods=["POST"])
def vote_project(project_id):
    err = check_db()
    if err: return err

    try:
        token = get_token()
        payload = verify_token(token)
        user_id = payload["user_id"]
    except Exception:
        return jsonify({"status": "error", "message": "请先登录"}), 401

    try:
        result = db.projects.update_one(
            {
                "_id": ObjectId(project_id),
                "status": "approved",
                "voters": {"$ne": user_id}
            },
            {
                "$inc": {"votes": 1},
                "$addToSet": {"voters": user_id},
                "$set": {"updated_at": datetime.utcnow().isoformat()}
            }
        )

        if result.matched_count == 0:
            project = db.projects.find_one({"_id": ObjectId(project_id)})
            if not project:
                return jsonify({"status": "error", "message": "项目不存在"}), 404
            if project.get("status") != "approved":
                return jsonify({"status": "error", "message": "项目还在审核中，暂时不能投票"}), 400
            return jsonify({"status": "error", "message": "你已经投过票了"}), 400

        # 获取更新后的投票数
        updated = db.projects.find_one({"_id": ObjectId(project_id)})

        return jsonify({
            "status": "success",
            "message": "投票成功！",
            "votes": updated["votes"]
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ── 项目评论 ──
@app.route("/api/projects/<project_id>/comments", methods=["POST"])
def add_project_comment(project_id):
    err = check_db()
    if err: return err

    try:
        payload = current_user()
    except Exception:
        return jsonify({"status": "error", "message": "请先登录"}), 401

    data = request.get_json(silent=True) or {}
    content = data.get("content", "").strip()
    parent_id = data.get("parent_id", "").strip()
    if not content:
        return jsonify({"status": "error", "message": "评论不能为空"}), 400

    project = db.projects.find_one({"_id": ObjectId(project_id), "status": "approved"})
    if not project:
        return jsonify({"status": "error", "message": "项目不存在或仍在审核中"}), 404

    user = db.users.find_one({"_id": ObjectId(payload["user_id"])}, {"password": 0})
    comment = {
        "project_id": project_id,
        "parent_id": parent_id or None,
        "author_id": payload["user_id"],
        "author_name": user.get("nickname", "匿名") if user else "匿名",
        "content": content,
        "created_at": datetime.utcnow().isoformat()
    }
    result = db.comments.insert_one(comment)
    db.projects.update_one({"_id": ObjectId(project_id)}, {"$inc": {"comments": 1}})
    comment["_id"] = str(result.inserted_id)
    return jsonify({"status": "success", "message": "评论成功", "comment": comment}), 201

# ── 获取 AI 工具列表 ──
@app.route("/api/tools", methods=["GET"])
def get_tools():
    try:
        tools = []
        if db is not None:
            tools = list(db.tools.find({}, {"_id": 0}))
        return jsonify({"status": "success", "data": tools})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
