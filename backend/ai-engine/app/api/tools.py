import subprocess
import tempfile
import os

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ExecuteToolRequest(BaseModel):
    tool_id: str
    params: dict | None = None
    name: str | None = None
    code: str | None = None
    schema_json: dict | None = None


@router.post("/execute")
async def execute_tool(request: ExecuteToolRequest):
    """Execute tool in sandbox. Uses request.code if provided, else params['code']."""
    logs: list[str] = []
    result = None
    params = request.params or {}
    code = request.code if request.code else (params.get("code") if isinstance(params, dict) else None)

    # Basic safety limits
    max_code_chars = 10_000
    if code and isinstance(code, str) and len(code) > max_code_chars:
        return {
            "tool_id": request.tool_id,
            "success": False,
            "logs": ["Code too long for sandbox execution."],
            "result": None,
        }
    try:
        if code and isinstance(code, str):
            with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
                f.write(code)
                tmp = f.name
            try:
                proc = subprocess.run(
                    ["python", tmp],
                    capture_output=True,
                    text=True,
                    timeout=30,
                    env={**os.environ, "PYTHONPATH": ""},
                )
                logs.append(f"stdout: {proc.stdout[:500]}" if proc.stdout else "stdout: (empty)")
                if proc.stderr:
                    logs.append(f"stderr: {proc.stderr[:500]}")
                result = {"exit_code": proc.returncode, "stdout": proc.stdout, "stderr": proc.stderr}
                success = proc.returncode == 0
            finally:
                os.unlink(tmp)
        else:
            logs.append("No executable code provided. Include 'code' field in request body.")
            result = {"message": "No code in body or params"}
            success = False
    except subprocess.TimeoutExpired:
        logs.append("Execution timed out (30s)")
        success = False
    except Exception as e:
        logs.append(f"Execution error: {e}")
        success = False
    return {
        "tool_id": request.tool_id,
        "success": success,
        "logs": logs,
        "result": result,
    }
