from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def health_check():
    return {"status": "healthy", "service": "ai-engine"}


@router.get("/ready")
async def readiness():
    return {"ready": True}
