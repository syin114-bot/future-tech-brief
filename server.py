from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt, os, uuid
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "future_tech_brief")
JWT_SECRET = os.getenv("JWT_SECRET", "changeme")
JWT_ALGORITHM = "HS256"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Future Tech Brief API")
api_router = APIRouter(prefix="/api")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    nickname: str = Field(..., min_length=2, max_length=50)
    language: str = Field(default="zh-CN")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: str = Field(..., min_length=1, max_length=500)
    coverImage: Optional[str] = None
    videoLink: Optional[str] = None
    githubLink: Optional[str] = None
    tools: List[str] = []
    difficulty: str = "beginner"
    sdg: Optional[str] = None
    category: str = "personal"

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    return jwt.encode({"user_id": user_id, "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/auth/register")
async def register(user: UserRegister):
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password": hash_password(user.password),
        "nickname": user.nickname,
        "avatar": None,
        "bio": None,
        "language": user.language,
        "referralCode": str(uuid.uuid4())[:8].upper(),
        "referredBy": None,
        "createdAt": datetime.now(timezone.utc),
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    return {"token": token, "user": {k: v for k, v in user_doc.items() if k not in ["password", "_id"]}}

@api_router.post("/auth/login")
async def login(user: UserLogin):
    user_doc = await db.users.find_one({"email": user.email})
    if not user_doc or not verify_password(user.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user_doc["id"])
    return {"token": token, "user": {k: v for k, v in user_doc.items() if k not in ["password", "_id"]}}

@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"password": 0, "_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    projects_count = await db.projects.count_documents({"creatorID": user_id})
    referrals_count = await db.users.count_documents({"referredBy": user["referralCode"]})
    return {"user": user, "stats": {"projectsCount": projects_count, "referralsCount": referrals_count}}

@api_router.post("/projects")
async def create_project(project: ProjectCreate, current_user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    doc = {
        "id": project_id,
        **project.dict(),
        "creatorID": current_user_id,
        "creatorName": user["nickname"],
        "creatorAvatar": user.get("avatar"),
        "votes": 0,
        "commentsCount": 0,
        "shares": 0,
        "score": 0,
        "status": "approved",
        "createdAt": now,
        "updatedAt": now,
    }
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/projects")
async def get_projects(search: Optional[str] = None, difficulty: Optional[str] = None, category: Optional[str] = None, sort: str = "latest", skip: int = 0, limit: int = 20):
    query = {"status": "approved"}
    if search:
        query["$or"] = [{"name": {"$regex": search, "$options": "i"}}, {"description": {"$regex": search, "$options": "i"}}]
    if difficulty:
        query["difficulty"] = difficulty
    if category:
        query["category"] = category
    sort_map = {"latest": [("createdAt", -1)], "popular": [("votes", -1)], "trending": [("score", -1)]}
    projects = await db.projects.find(query, {"_id": 0}).sort(sort_map.get(sort, [("createdAt", -1)])).skip(skip).limit(limit).to_list(limit)
    return projects

@api_router.get("/projects/ranking/top")
async def get_ranking(limit: int = 100):
    projects = await db.projects.find({"status": "approved"}, {"_id": 0}).sort("score", -1).limit(limit).to_list(limit)
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    comments = await db.comments.find({"projectID": project_id}, {"_id": 0}).sort("createdAt", -1).to_list(100)
    return {"project": project, "comments": comments}

@api_router.post("/projects/{project_id}/vote")
async def vote_project(project_id: str, current_user_id: str = Depends(get_current_user)):
    existing = await db.votes.find_one({"projectID": project_id, "userID": current_user_id})
    if existing:
        await db.votes.delete_one({"projectID": project_id, "userID": current_user_id})
        await db.projects.update_one({"id": project_id}, {"$inc": {"votes": -1}})
        voted = False
    else:
        await db.votes.insert_one({"id": str(uuid.uuid4()), "projectID": project_id, "userID": current_user_id, "createdAt": datetime.now(timezone.utc)})
        await db.projects.update_one({"id": project_id}, {"$inc": {"votes": 1}})
        voted = True
    project = await db.projects.find_one({"id": project_id})
    if project:
        score = project.get("votes", 0) * 10 + project.get("commentsCount", 0) * 3 + project.get("shares", 0) * 5
        await db.projects.update_one({"id": project_id}, {"$set": {"score": score}})
    return {"voted": voted}

@api_router.post("/projects/{project_id}/comments")
async def add_comment(project_id: str, comment: CommentCreate, current_user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    comment_doc = {
        "id": str(uuid.uuid4()),
        "projectID": project_id,
        "userID": current_user_id,
        "userName": user["nickname"],
        "userAvatar": user.get("avatar"),
        "content": comment.content,
        "createdAt": datetime.now(timezone.utc),
    }
    await db.comments.insert_one(comment_doc)
    await db.projects.update_one({"id": project_id}, {"$inc": {"commentsCount": 1}})
    comment_doc.pop("_id", None)
    return comment_doc

@api_router.post("/projects/{project_id}/share")
async def share_project(project_id: str, current_user_id: str = Depends(get_current_user)):
    await db.projects.update_one({"id": project_id}, {"$inc": {"shares": 1}})
    return {"message": "Share recorded"}

@api_router.post("/users/favorites/{project_id}")
async def toggle_favorite(project_id: str, current_user_id: str = Depends(get_current_user)):
    existing = await db.favorites.find_one({"userID": current_user_id, "projectID": project_id})
    if existing:
        await db.favorites.delete_one({"userID": current_user_id, "projectID": project_id})
        return {"favorited": False}
    await db.favorites.insert_one({"id": str(uuid.uuid4()), "userID": current_user_id, "projectID": project_id, "createdAt": datetime.now(timezone.utc)})
    return {"favorited": True}

@api_router.get("/users/favorites")
async def get_favorites(current_user_id: str = Depends(get_current_user)):
    favorites = await db.favorites.find({"userID": current_user_id}, {"_id": 0}).to_list(100)
    project_ids = [f["projectID"] for f in favorites]
    projects = await db.projects.find({"id": {"$in": project_ids}}, {"_id": 0}).to_list(100)
    return projects

app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": "Future Tech Brief API", "status": "running", "copyright": "© 2025-2026 Lim. All rights reserved."}
