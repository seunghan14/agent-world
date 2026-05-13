import json
import os
from pathlib import Path
import datetime

STORAGE_ROOT = Path(r"C:\Users\ChrisHong\.ai-shared\projects\agent-world\storage\projects")

class ProjectManager:
    def __init__(self):
        STORAGE_ROOT.mkdir(parents=True, exist_ok=True)

    def create_project(self, initial_task):
        project_id = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        project_dir = STORAGE_ROOT / project_id
        project_dir.mkdir(parents=True, exist_ok=True)
        
        data = {
            "id": project_id,
            "title": initial_task[:30] + ("..." if len(initial_task) > 30 else ""),
            "created_at": datetime.datetime.now().isoformat(),
            "chat_history": [],
            "latest_plan": "",
            "latest_code": "",
            "status": "active"
        }
        self.save_project(project_id, data)
        return project_id

    def save_project(self, project_id, data):
        project_dir = STORAGE_ROOT / project_id
        project_dir.mkdir(parents=True, exist_ok=True)
        with open(project_dir / "state.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def load_project(self, project_id):
        path = STORAGE_ROOT / project_id / "state.json"
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

    def delete_project(self, project_id):
        import shutil
        project_dir = STORAGE_ROOT / project_id
        if project_dir.exists() and project_dir.is_dir():
            shutil.rmtree(project_dir)
            return True
        return False

    def list_projects(self):
        projects = []
        if not STORAGE_ROOT.exists(): return []
        for d in STORAGE_ROOT.iterdir():
            if d.is_dir() and (d / "state.json").exists():
                state = self.load_project(d.name)
                if state:
                    projects.append({
                        "id": state["id"],
                        "title": state["title"],
                        "created_at": state["created_at"]
                    })
        return sorted(projects, key=lambda x: x["created_at"], reverse=True)

project_manager = ProjectManager()
