from app.config import settings
from app.core.security import decode_access_token
from app.database import get_db
from app.models.user import User
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Returns current authenticated user. If no bearer token is supplied,
    automatically falls back to the default inspector profile so the application
    operates directly without requiring manual login or account credentials.
    """
    if token:
        payload = decode_access_token(token)
        if payload and payload.get("sub"):
            user = db.query(User).filter(User.username == payload.get("sub")).first()
            if user and user.is_active:
                return user
                
    # Fallback to default active inspector
    inspector = db.query(User).filter(User.username == "inspector").first()
    if inspector:
        return inspector

    first_user = db.query(User).filter(User.is_active.is_(True)).first()
    if first_user:
        return first_user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No active inspector profile found",
        headers={"WWW-Authenticate": "Bearer"},
    )

def get_optional_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User | None:
    if not token:
        inspector = db.query(User).filter(User.username == "inspector").first()
        return inspector
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        return db.query(User).filter(User.username == "inspector").first()
    return db.query(User).filter(User.username == payload.get("sub")).first()
