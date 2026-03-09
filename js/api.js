import {api} from "../../scripts/api.js";


export async function getFiles(targetExtensions) {
    const response = await api.fetchApi("/moinspect/list/", {
        method: "POST",
        body: JSON.stringify({extensions: targetExtensions})
    });
    return await response.json();
}
