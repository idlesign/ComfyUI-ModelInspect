import {app} from "../../scripts/app.js";
import {getFileName, sortBy} from "./utils.js";
import {createButton, refreshDropdowns, renderSummaryTable, selectNode} from "./ui.js";
import {getFiles} from "./api.js";

const targetExtensions = [".safetensors", ".gguf"];


function categorize({nodeTitle = "", widgetName = "", ...otherOptions} = {}) {
    // order matters

    function substr(text, substring) {
        return text.toLowerCase().includes(substring.toLowerCase());
    }

    let
        categoryUnknown = "???",
        category = categoryUnknown;

    if (substr(nodeTitle, "vae") || substr(widgetName, "vae")) {
        category = "vae"
    }
    if (substr(nodeTitle, "clip")) {
        category = "clip"
    }
    if (substr(nodeTitle, "control")) {
        category = "controlnet"
    }
    if (substr(nodeTitle, "lora")) {
        category = "loras"
    }
    if (substr(nodeTitle, "unet")) {
        category = "unet"
    }
    if (substr(nodeTitle, "diffusion")) {
        category = "diffusion_models"
    }
    if (substr(nodeTitle, "seedvr")) {
        category = "SEEDVR2"
    }
    if (substr(nodeTitle, "checkpoint") || widgetName === "ckpt_name") {
        category = "checkpoints"
    }
    if (substr(nodeTitle, "patch")) {
        category = "model_patches"
    }

    if (category === categoryUnknown && substr(nodeTitle, "gguf")) {
        category = "diffusion_models"
    }

    return category;
}


async function getSummaryItems({showAllFiles = true, ...otherOptions} = {}) {
    const
        nodesModels = [],
        urlRegex = /https:\/\/[^\s$?#]+[^\s)]/g,
        urls = {};

    app.graph._nodes.forEach(node => {
        const
            nodeId = node.id,
            nodeType = node.type,
            nodeTitle = node.title;

        if (node.widgets) {
            node.widgets.forEach(widget => {
                const
                    widgetVal = widget.value,
                    widgetType = widget.type;

                if (typeof widgetVal === "string") {

                    switch (widgetType) {
                        case "combo":
                            const widgetName = widget.name;

                            if (targetExtensions.some(extension => widgetVal.endsWith(extension))) {
                                nodesModels.push({
                                    nodeId: nodeId,
                                    nodeType: nodeType,
                                    nodeTitle: nodeTitle,
                                    value: widgetVal,
                                    label: widget.label,
                                    type: widgetType,
                                    name: widgetName,
                                    path: "",
                                    size: null,
                                    category: categorize({nodeTitle: nodeTitle, widgetName: widgetName}),
                                    fileName: getFileName(widgetVal),
                                    urlProposed: "",
                                });
                            }
                            break;
                        case "customtext":
                        case "MARKDOWN":
                            // try to get file url from a hint node
                            (widgetVal.match(urlRegex) || []).forEach(url => {
                                urls[getFileName(url)] = url
                            })
                            break;
                    }

                }
            });
        }
    });

    let
        nodesFiles = [],
        files = await getFiles(targetExtensions);

    nodesModels.forEach(node => {
        let fileName = node.fileName;
        if (fileName) {
            if (urls.hasOwnProperty(fileName)) {
                // file url taken from a hint in workflow
                node.urlProposed = urls[fileName];
            }
            if (files.hasOwnProperty(fileName)) {
                // local file found for a node
                const fileInfo = files[fileName];
                node.path = fileInfo.path;
                node.size = fileInfo.size;
                node.category = fileInfo.category;
                fileInfo.processed = true;
            }
        }
    });

    nodesModels.push(...nodesFiles);

    if (showAllFiles) {
        // local files not used in nodes
        Object.values(files).forEach(file => {
            if (!file.processed) {
                nodesModels.push({
                    nodeId: null,
                    nodeType: null,
                    nodeTitle: "—",
                    value: null,
                    label: "—",
                    type: null,
                    name: null,
                    path: file.path,
                    size: file.size,
                    category: file.category,
                    fileName: file.name,
                    urlProposed: null,
                });
            }
        });
    }

    sortBy(nodesModels, ["nodeTitle", "label", "category", "fileName"]);

    return nodesModels;
}


app.registerExtension({
    name: "idlesign.modelinspect",
    bottomPanelTabs: [
        {
            id: "modelinspect.panel.id",
            title: "Model Inspect",
            type: "custom",
            render: (el) => {
                el.className = "p-4 h-full overflow-auto";

                const elToolbar = document.createElement("div");
                elToolbar.className = "flex gap-2 mb-4 justify-end";
                el.appendChild(elToolbar);

                const elListing = document.createElement("div");
                el.appendChild(elListing);

                const elFilterBox = document.createElement("div")
                elFilterBox.innerHTML = `
                    <label class="flex items-center gap-2 mr-4 cursor-pointer text-muted select-none">
                        <input type="checkbox" id="moinspectShowAllFiles">Show all files
                    </label>`;

                elToolbar.appendChild(elFilterBox);

                elToolbar.appendChild(createButton("Sync", "sync", async function () {
                    data.length = 0;
                    data.push(...await getSummaryItems({
                        showAllFiles: document.getElementById("moinspectShowAllFiles").checked
                    }));
                    renderTable();
                    await refreshDropdowns();
                }))

                let data = [];

                const renderTable = () => {
                    elListing.innerHTML = renderSummaryTable(data);
                    elListing.querySelectorAll(".pi-bullseye").forEach(btn => {
                        btn.onclick = () => {
                            selectNode(btn.getAttribute("data-nodeid"))
                        };
                    });
                };

                renderTable();
            }
        }
    ],

    async setup() {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = new URL("./style.css", import.meta.url).href;
        document.head.appendChild(link);
    }
});
