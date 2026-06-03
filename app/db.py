from sqlmodel import SQLModel, Session, create_engine, select
from typing import Optional
from passlib.context import CryptContext

# SQLite database URL
DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(DATABASE_URL, echo=False)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


from sqlmodel import Field

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str
    hashed_password: str
    display_name: Optional[str] = None
    age: Optional[int] = None


class Progress(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    levelsCompleted: int
    totalLevels: int
    percentage: float
    gamesPlayed: int


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    # bcrypt limits input to 72 bytes; make sure we never hand it more.
    # convert to bytes (utf-8) and slice the byte array.
    if isinstance(password, str):
        b = password.encode('utf-8')
    else:
        b = str(password).encode('utf-8')
    if len(b) > 72:
        b = b[:72]
    # passlib/bcrypt accepts bytes directly
    return pwd_context.hash(b)
