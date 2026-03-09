from pathlib import Path

from aiohttp import web

import folder_paths
from server import PromptServer

WEB_DIRECTORY = "./js"
NODE_CLASS_MAPPINGS = {}

__all__ = ['NODE_CLASS_MAPPINGS', 'WEB_DIRECTORY']


@PromptServer.instance.routes.post("/moinspect/list/")
async def do_list(request):
    data = await request.json()
    extensions = set(data.get("extensions", set()))

    models_root = Path(folder_paths.models_dir)

    found = {}

    for file_path in models_root.rglob("*"):
        if file_path.is_file() and file_path.suffix.lower() in extensions:
            path = file_path.relative_to(models_root)
            name = file_path.name
            found[name] = {
                "name": name,
                "path": f"{path}",
                "size": file_path.stat().st_size,
                "category": path.parts[0] if path.parts else "???"
            }

    return web.json_response(found)
