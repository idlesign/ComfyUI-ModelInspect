import {api} from "../../scripts/api.js";
import {app} from "../../scripts/app.js";
import {formatSize} from "./utils.js";

export async function refreshDropdowns() {

    const nodeDefs = await api.getNodeDefs();

    app.graph._nodes.forEach(node => {
        const def = nodeDefs[node.type];
        if (!def || !node.widgets) return;

        node.widgets.forEach(w => {
            if (w.type === "combo" && def.input && def.input.required[w.name]) {
                const enumValues = def.input.required[w.name][0];
                if (Array.isArray(enumValues)) {
                    w.options.values = enumValues;
                    node.setDirtyCanvas(true, true);
                }
            }
        });
    });
}

export function createButton(label, icon, func) {
    const btn = document.createElement("button");
    btn.className = "p-button p-component p-button-sm";
    btn.innerHTML = `
        <span class="pi pi-${icon} p-button-icon p-button-icon-left"></span>
        <span class="p-button-label">${label}</span>
    `;
    btn.onclick = func;
    return btn
}

export function selectNode(id) {

    const findNodeRecursively = (graph) => {
        let node = graph.getNodeById(id);
        if (node) return { node, graph };

        for (const n of (graph._nodes || [])) {
            if (n.subgraph) {
                const found = findNodeRecursively(n.subgraph);
                if (found) return found;
            }
        }
        return null;
    };

    const result = findNodeRecursively(app.graph);

    if (result) {
        const { node, graph } = result;

        // handle subgraph
        if (app.canvas.graph !== graph) {
            app.canvas.setGraph(graph);
        }

        app.canvas.deselectAllNodes();
        app.canvas.selectNode(node);

        // builtin v1.39.19
        if (typeof app.centerOnNodes === "function") {
            app.centerOnNodes([node]);

        } else {
            // workaround
            const zoom = 1.0;

            const centerX = node.pos[0] + node.size[0] / 2;
            const centerY = node.pos[1] + node.size[1] / 2;

            app.canvas.ds.scale = zoom;
            app.canvas.ds.offset[0] = (app.canvas.canvas.width / 2 / zoom) - centerX;
            app.canvas.ds.offset[1] = (app.canvas.canvas.height / 2 / zoom) - centerY;
        }

        app.canvas.setDirty(true, true);

    }
}

export function renderSummaryTable(data) {
    const totalSize = data.reduce((sum, item) => sum + (item.size || 0), 0);
    return `
    <div class="moinspect-table p-datatable p-component p-datatable-sm p-datatable-striped">
        <table class="p-datatable-table w-full">
            <thead class="p-datatable-thead">
                <tr>
                    <th class="p-2" nowrap width="5%"></th>
                    <th class="p-2 text-left">Model</th>
                    <th class="p-2 text-left">Size</th>
                    <th class="p-2 text-left">Category</th>
                    <th class="p-2 text-left">Node</th>
                </tr>
            </thead>
            <tbody class="p-datatable-tbody">
                ${data.map(item => `
                    <tr class="p-selectable-row border-b border-gray-800">
                        <td class="p-2" nowrap>
                            <a class="p-button p-button-xs p-button-text pi pi-search" title="Search by name" target="_blank" href="https://www.google.com/search?q=${item.fileName}"></a>
                            <a class="p-button p-button-xs p-button-text pi pi-copy" title="Copy name" onClick="navigator.clipboard.writeText('${item.fileName}')"></a>                                           
                        </td>
                        <td class="p-2 text-xs">
                            ${item.urlProposed ? `<a title="URL proposed" target="_blank" href="${item.urlProposed}">${item.fileName}</a>` : `${item.fileName}`}                                            
                        </td>
                        <td class="p-2 text-muted text-sm">${formatSize(item.size)}</td>
                        <td class="p-2 text-muted text-sm">${item.category}</td>
                        <td class="p-2">
                            ${
        item.nodeId ?
            `<a class="p-button p-button-sm p-button-text pi pi-bullseye" title="Locate node" data-nodeid="${item.nodeId}"></a> ${item.nodeTitle} <span class="text-muted text-sm">${item.label}</span>`
            : ''
    }                                            
                        </td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot class="p-datatable-tfoot">
                <tr class="font-bold bg-gray-900">
                    <td class="p-2 text-right" colspan="2"></td>
                    <td class="p-2 text-sm">${formatSize(totalSize)}</td>
                    <td class="p-2 text-muted text-xs" colspan="2"></td>
                </tr>
            </tfoot>
        </table>
    </div>
`;
}
