import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.category import Category
from app.db.seeds.taxonomy_seed import seed_categories

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()

def test_seed_categories(test_db):
    count = seed_categories(test_db)
    assert count > 50  # Must seed all prompt domains (Fiction, UPSC/KPSC, Engineering, Medicine, etc.)

    # Check root categories
    roots = test_db.query(Category).filter(Category.parent_id == None).all()
    root_names = [r.name for r in roots]
    assert "Fiction and Literature" in root_names
    assert "Engineering and Technology" in root_names
    assert "Competitive Examinations" in root_names
    assert "Medicine and Health Sciences" in root_names

    # Check subcategories
    upsc = test_db.query(Category).filter(Category.name == "UPSC Civil Services").first()
    assert upsc is not None
    assert upsc.parent_id is not None
