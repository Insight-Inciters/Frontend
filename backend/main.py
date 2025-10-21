from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from nlp_core import full_analysis

app = FastAPI(title="Ink Insights API")

# Allow your frontend domain on Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://inkinsights.vercel.app",
        "https://www.inkinsights.vercel.app",
        "*",  # remove this later for security
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True, "message": "Backend running fine!"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    text = (await file.read()).decode("utf-8", errors="ignore")
    result = full_analysis(file.filename, text)
    return result
