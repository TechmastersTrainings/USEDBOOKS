import re
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.category import Category

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text

TAXONOMY_TREE: Dict[str, Dict[str, any]] = {
    "Fiction and Literature": {
        "icon": "book-open",
        "description": "Stories, narratives, poetry, and creative prose across genres and languages.",
        "subcategories": [
            "Novels", "Literary Fiction", "Romance", "Mystery and Detective Fiction",
            "Crime and Thriller", "Horror", "Fantasy", "Science Fiction",
            "Historical Fiction", "Adventure", "Short Stories", "Poetry",
            "Drama and Plays", "Regional-Language Fiction", "Contemporary Literature",
            "Classic Literature"
        ]
    },
    "Non-Fiction": {
        "icon": "compass",
        "description": "Biographies, histories, philosophies, economics, and life sciences.",
        "subcategories": [
            "Biography and Autobiography", "Memoirs", "History", "Politics and Public Policy",
            "Philosophy", "Psychology", "Sociology", "Economics", "Business and Management",
            "Finance and Investing", "Entrepreneurship", "Self-Help", "Productivity",
            "Communication", "Travel", "Nature and Environment", "Popular Science",
            "Religion and Spirituality", "Art and Photography", "Music", "Sports",
            "Cooking", "Gardening"
        ]
    },
    "Engineering and Technology": {
        "icon": "cpu",
        "description": "Textbooks and references across computer science, electronics, mechanical, and civil branches.",
        "subcategories": [
            "Computer Science", "Programming", "Data Structures and Algorithms",
            "Software Engineering", "Artificial Intelligence", "Machine Learning",
            "Data Science", "Cybersecurity", "Cloud Computing", "Networking",
            "Databases", "Operating Systems", "Electronics", "Electrical Engineering",
            "Mechanical Engineering", "Civil Engineering", "Chemical Engineering",
            "Aerospace Engineering", "Robotics", "Telecommunications",
            "Engineering Mathematics", "Engineering Entrance Preparation"
        ]
    },
    "Medicine and Health Sciences": {
        "icon": "activity",
        "description": "Medical, dental, nursing, allied health, and pharmacological texts.",
        "subcategories": [
            "MBBS Textbooks", "Anatomy", "Physiology", "Biochemistry", "Pathology",
            "Pharmacology", "Microbiology", "Forensic Medicine", "Community Medicine",
            "Medicine", "Surgery", "Obstetrics and Gynaecology", "Paediatrics",
            "Orthopaedics", "Radiology", "Nursing", "Dentistry", "Pharmacy",
            "Physiotherapy", "Allied Health Sciences", "Medical Entrance Preparation"
        ]
    },
    "Competitive Examinations": {
        "icon": "award",
        "description": "Prep materials for UPSC, KPSC, NEET, JEE, GATE, Banking, Railways, and state recruitment.",
        "subcategories": [
            "UPSC Civil Services", "State PSC Examinations", "KPSC", "NEET UG", "NEET PG",
            "JEE Main", "JEE Advanced", "GATE", "ESE", "SSC", "Banking Examinations",
            "Railways", "Defence Examinations", "Police Examinations",
            "Teaching Eligibility Examinations", "UGC NET", "CSIR NET", "CAT", "MAT",
            "CLAT", "CUET", "State Recruitment Examinations", "Aptitude and Reasoning",
            "General Knowledge", "Previous-Year Question Papers"
        ]
    },
    "Academic Textbooks": {
        "icon": "graduation-cap",
        "description": "School, undergraduate, and postgraduate textbooks across CBSE, ICSE, and university syllabi.",
        "subcategories": [
            "School Textbooks", "Primary Education", "Secondary Education",
            "Higher Secondary Education", "CBSE", "ICSE", "State Boards",
            "Undergraduate Textbooks", "Postgraduate Textbooks", "B.E. and B.Tech",
            "MBBS and Allied Degrees", "B.Sc.", "B.Com.", "B.A.", "BBA and MBA",
            "BCA and MCA", "Law", "Agriculture", "Architecture", "Education and Teaching",
            "Diploma and Polytechnic", "Research Methods"
        ]
    },
    "Courses and Professional Learning": {
        "icon": "briefcase",
        "description": "Skill development manuals, certifications, IT training, and career guidebooks.",
        "subcategories": [
            "Programming Courses", "Web Development", "Full-Stack Development",
            "AI and ML Courses", "Cloud Certifications", "DevOps",
            "Networking Certifications", "Cybersecurity Certifications",
            "Project Management", "Accounting Certifications", "Language Learning",
            "Professional Development", "Interview Preparation", "Training Manuals",
            "Certification Study Guides"
        ]
    },
    "Research and Academic Publications": {
        "icon": "file-text",
        "description": "Monographs, academic reference handbooks, and conference proceedings.",
        "subcategories": [
            "Research Monographs", "Academic Reference Books", "Thesis and Dissertation Guidance",
            "Research Methodology", "Scientific Publications", "Conference Proceedings",
            "Technical Reports", "Laboratory Manuals", "Research Handbooks"
        ]
    },
    "Regional & Indian Literature": {
        "icon": "globe",
        "description": "Literature, folklore, poetry, and regional language publications.",
        "subcategories": [
            "Kannada Literature", "Hindi Literature", "English Literature",
            "Other Indian Languages", "Foreign Languages", "Children's Books",
            "Picture Books", "Early Learning", "Young Adult",
            "Comics and Graphic Novels", "Manga", "Dictionaries",
            "Encyclopaedias", "Atlases and Maps", "Magazines", "Journals",
            "Exam Guides", "Reference Books"
        ]
    }
}

def seed_categories(db: Session) -> int:
    """Populates categories and hierarchical subcategories. Idempotent."""
    count = 0
    sort_order = 10
    
    for root_name, data in TAXONOMY_TREE.items():
        root_slug = slugify(root_name)
        root_cat = db.query(Category).filter(Category.slug == root_slug).first()
        if not root_cat:
            root_cat = Category(
                name=root_name,
                slug=root_slug,
                description=data.get("description"),
                icon=data.get("icon"),
                sort_order=sort_order,
                is_active=True
            )
            db.add(root_cat)
            db.flush()
            count += 1
        sort_order += 10

        sub_sort = 1
        for sub_name in data["subcategories"]:
            sub_slug = f"{root_slug}-{slugify(sub_name)}"
            existing_sub = db.query(Category).filter(Category.slug == sub_slug).first()
            if not existing_sub:
                sub_cat = Category(
                    name=sub_name,
                    slug=sub_slug,
                    parent_id=root_cat.id,
                    sort_order=sub_sort,
                    is_active=True
                )
                db.add(sub_cat)
                count += 1
                sub_sort += 1

    db.commit()
    return count

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        inserted = seed_categories(db)
        print(f"Taxonomy seeding complete. Processed {inserted} categories/subcategories.")
    finally:
        db.close()
