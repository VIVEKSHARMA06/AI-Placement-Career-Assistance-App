"""Generate realistic English and Hindi test resume PDFs with proper fonts.

Uses fpdf2 with standard fonts for English and Nirmala UI for Hindi Unicode.
"""
from pathlib import Path
from fpdf import FPDF

TEST_PDFS_DIR = Path(__file__).resolve().parent

ENGLISH_RESUME_TEXT = """John Doe
Software Engineer
Email: john.doe@example.com | Phone: +1-555-0199 | Location: Seattle, WA
LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe

SUMMARY
Detail-oriented Software Engineer with 3+ years of experience designing and implementing scalable backend REST APIs, microservices, and modern frontend interfaces using Python, FastAPI, React, Node.js, and PostgreSQL.

SKILLS
Programming Languages: Python, JavaScript, TypeScript, SQL
Frameworks & Libraries: FastAPI, Node.js, Express, React, Redux, Docker
Databases: PostgreSQL, MongoDB, Redis
DevOps & Tools: Git, GitHub Actions, AWS, Docker, Linux

EXPERIENCE
Software Engineer - CloudTech Solutions (June 2022 - Present)
- Designed and built high-throughput REST APIs using Python FastAPI and PostgreSQL.
- Reduced API response latency by 35% through Redis caching and query indexing.
- Collaborated with frontend engineers to build dynamic user interfaces using React.

Junior Web Developer - Innovate Labs (January 2021 - May 2022)
- Maintained backend microservices using Node.js and Express.
- Wrote automated unit and integration tests achieving 85% code coverage.

PROJECTS
Placement & Career Assistant (2024)
- Built a full-stack career platform with FastAPI AI services and MERN stack.
- Implemented multilingual resume parsing, ATS checking, and SBERT job recommendations.

EDUCATION
Bachelor of Science in Computer Science
University of Washington (2017 - 2021) | GPA: 3.8/4.0

CERTIFICATIONS
- AWS Certified Developer Associate
"""

HINDI_RESUME_TEXT = """राहुल शर्मा
सॉफ्टवेयर इंजीनियर
ईमेल: rahul.sharma@example.com | फोन: +91-9876543210 | स्थान: नई दिल्ली, भारत
लिंक्डइन: linkedin.com/in/rahulsharma | गिटहब: github.com/rahulsharma

संक्षिप्त विवरण
3 वर्ष के अनुभव के साथ समर्पित सॉफ्टवेयर इंजीनियर। Python, FastAPI, Node.js, React और MongoDB का उपयोग करके स्केलेबल वेब सेवाएं और REST API विकसित करने में कुशल।

कौशल
प्रोग्रामिंग भाषाएं: Python, JavaScript, TypeScript, SQL
फ्रेमवर्क: FastAPI, React, Node.js, Express, Docker
डेटाबेस: MongoDB, PostgreSQL, Redis
टूल्स: Git, GitHub Actions, Docker, Linux, AWS

कार्य अनुभव
सॉफ्टवेयर इंजीनियर - टेक इनोवेशंस प्रा. लि. (जून 2022 - वर्तमान)
- Python और FastAPI का उपयोग करके स्केलेबल REST API और बैकएंड सेवाएं विकसित कीं।
- डेटाबेस प्रश्नों को अनुकूलित करके प्रदर्शन में 30% सुधार किया।
- React और Node.js के साथ पूर्ण-स्टैक वेब अनुप्रयोगों का निर्माण किया।

परियोजनाएं
प्लेसमेंट एवं करियर सहायक (2024)
- बहुभाषी रेज्यूमे प्रसंस्करण और नौकरी सिफारिशों के लिए पूर्ण-स्टैक AI अनुप्रयोग।

शिक्षा
कंप्यूटर विज्ञान में बी.टेक
दिल्ली विश्वविद्यालय (2017 - 2021) | जीपीए: 8.5/10
"""


def create_english_pdf(out_path: Path) -> None:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=10)
    for line in ENGLISH_RESUME_TEXT.strip().split("\n"):
        if line.strip().isupper() and len(line.strip()) < 25:
            pdf.set_font("Helvetica", style="B", size=11)
            pdf.ln(2)
            pdf.cell(w=0, h=6, text=line, new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", size=10)
        else:
            pdf.multi_cell(w=0, h=5, text=line, new_x="LMARGIN", new_y="NEXT")
    pdf.output(str(out_path))
    print(f"Created {out_path}")


def create_hindi_pdf(out_path: Path) -> None:
    pdf = FPDF()
    pdf.add_page()
    font_path = "C:/Windows/Fonts/Nirmala.ttc"
    pdf.add_font("Nirmala", fname=font_path)
    pdf.set_font("Nirmala", size=10)
    for line in HINDI_RESUME_TEXT.strip().split("\n"):
        pdf.multi_cell(w=0, h=6, text=line, new_x="LMARGIN", new_y="NEXT")
    pdf.output(str(out_path))
    print(f"Created {out_path}")


if __name__ == "__main__":
    create_english_pdf(TEST_PDFS_DIR / "test_english.pdf")
    create_hindi_pdf(TEST_PDFS_DIR / "test_hindi.pdf")
