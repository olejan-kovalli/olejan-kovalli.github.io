var draw;

var nodes = {};
var lines = {};
var conn = [];

var isPtrOverNode;
var isPtrOverLine;

var isConnMode = false;

var selectedNodeId;
var selectedLineId;

var connSrcNodeId;
var connDestNodeId;

var tempLine;

//--------nodes--------

function getNextNodeId() {
    if (Object.keys(nodes).length > 0)
        maxId = Math.max(...Object.keys(nodes).map(Number));
    else
        maxId = -100

    return String(maxId + 100);
}

function createNode(cx, cy, id=undefined) {
    if (!id)
        id = getNextNodeId();
    
    var diam = 2 * default_node_radius;
    
    var node = draw.circle(diam, diam);
    node.center(cx, cy);
    node.fill(default_color);

    node.click(() => onNodeClick(id));
    node.dblclick(() => onNodeDblClick(id));
    
    node.mousedown(() => onNodeMouseDown(id));
    node.mouseup(() => onNodeMouseUp(id));

    node.mouseover(() => onNodeMouseOver(id));
    node.mouseout(() => onNodeMouseOut(id));
    
    node.on('dragmove', () => onNodeDragMove(id));

    nodes[id] = node;
}

function selectNode(id) {
    if (id) {
        selectedNode = nodes[id];
        selectedNode.attr({ fill: selected_color })

        selectedNode.draggable();

        selectedNodeId = id;
    }
}

function deselectSelectedNode() {
    if (selectedNodeId) {
        selectedNode = nodes[selectedNodeId];
        selectedNode.attr({ fill: default_color })

        selectedNode.draggable(false);
        
        selectedNodeId = undefined;
    }
}

function highlightNodeHover(id){
    nodes[id].radius(hover_node_radius);
}

function unhighlightNodeHover(id){
    nodes[id].radius(default_node_radius);
}

function highlightDestNode(color){
    nodes[connDestNodeId].attr({ fill: color });
}

function unhighlightDestNode(){
    if (connDestNodeId){
        nodes[connDestNodeId].radius(default_node_radius);
        nodes[connDestNodeId].attr({ fill: default_color });
    }
}

function deleteNode(id) {
    nodes[id].remove();
    delete nodes[id];
}

//--------lines--------

function getNextLineId() {
    if (Object.keys(lines).length > 0)
        maxId = Math.max(...Object.keys(lines).map(Number));
    else
        maxId = -100

    return String(maxId + 100);
}

function createLine(nodeId1, nodeId2, lineId) {
    
    var node1 = nodes[nodeId1];
    var node2 = nodes[nodeId2];

    var line = draw.line(node1.cx(), node1.cy(), node2.cx(), node2.cy());
    line.attr({ stroke: default_color, 'stroke-width': default_line_width })

    line.insertBefore(nodes[Object.keys(nodes)[0]]);
        
    line.mouseover(() => onLineMouseOver(lineId));
    line.mouseout(() => onLineMouseOut(lineId));
    line.click(() => onLineClick(lineId));
    line.dblclick(() => onLineDblClick(lineId));
    
    lines[lineId] = line;
}

function highlightLineHover(id){
    lines[id].attr({ 'stroke-width': hover_line_width });
}

function unhighlightLineHover(id){
    lines[id].attr({ 'stroke-width': default_line_width });
}

function selectLine(id) {
    if (id) {
        selectedLine = lines[id];
        selectedLine.attr({ stroke: selected_color });
        
        selectedLineId = id;
    }
}

function deselectSelectedLine() {
    if (selectedLineId) {
        selectedLine = lines[selectedLineId];
        selectedLine.attr({ stroke: default_color })
        
        selectedLineId = undefined;
    }
}

function deleteLines(nodeId) {   
    for (var cn of conn)
        if (cn[0] === nodeId || cn[1] === nodeId) 
            deleteLine(cn[2])
}

function deleteLine(id) {
    lines[id].remove();
    delete lines[id];
}

//--------tempLine--------

function createTempLine() {
    node = nodes[connSrcNodeId];

    var cx = node.cx()
    var cy = node.cy()

    tempLine = draw.line(cx, cy, cx, cy);
    tempLine.attr({ stroke: inactive_color, 'stroke-width': default_line_width })

    tempLine.insertBefore(nodes[Object.keys(nodes)[0]]);
}

function updateTempLine(x_ptr, y_ptr) {        
    tempLine.attr({ x2: x_ptr });
    tempLine.attr({ y2: y_ptr });
}

function highlightTempLine(color){
    tempLine.attr({ stroke: color });
}

function unhighlightTempLine(){
    tempLine.attr({ stroke: inactive_color });
    tempLine.attr({ 'stroke-width': default_line_width });
}

function deleteTempLine() {
    tempLine.remove();
    tempLine = undefined;
}

//--------connectivity------

function createConnection(nodeId1, nodeId2, lineId=undefined) {
    if (!lineId)
        lineId = getNextLineId();

    createLine(nodeId1, nodeId2, lineId);
    conn.push([nodeId1, nodeId2, lineId]);
}

function isConnWithSrc() {
    return conn.filter(cn => 
        (cn[0] === connSrcNodeId && cn[1] === connDestNodeId) || 
        (cn[0] === connDestNodeId && cn[1] === connSrcNodeId)).length > 0;
}

function deleteConn(nodeId) {
    conn = conn.filter(cn => cn[0] !== nodeId && cn[1] !== nodeId);
}

//----------node events------------

function onNodeClick(id) {
    deselectSelectedLine();

    var saved_shid = selectedNodeId;
    deselectSelectedNode();
    
    if (id !== saved_shid)
        selectNode(id);
}

function onNodeDblClick(id) {
    deselectSelectedNode();
    deselectSelectedLine();

    deleteNode(id);
    deleteLines(id);
    deleteConn(id);

    isPtrOverLine = false;
    isConnMode = false;
}

function onNodeMouseDown(id) {
    if (id === selectedNodeId)
        return;

    isConnMode = true;
    connSrcNodeId = id;

    createTempLine();
}

function onNodeMouseUp(id) {
    if (!isConnMode)
        return;
    
    if (id === connSrcNodeId)
        return;    

    unhighlightDestNode();
 
    if (isConnWithSrc())
        return;

    createConnection(connSrcNodeId, connDestNodeId);
    deleteTempLine();
    
    isConnMode = false;
    connSrcNodeId = undefined;

}

function onNodeMouseOver(id) {
    isPtrOverLine = true;

    if (isConnMode && id !== connSrcNodeId ) {
        connDestNodeId = id;

        if (isConnWithSrc()){
            highlightDestNode(forbidden_color);
            highlightTempLine(forbidden_color);
        }
        else {
            highlightDestNode(allowed_color);
            highlightTempLine(allowed_color);
        }
    }

    highlightNodeHover(id);
}

function onNodeMouseOut(id) {
    isPtrOverLine = false;

    if (isConnMode) {
        unhighlightDestNode(id);

        if (id !== connSrcNodeId)
            unhighlightTempLine();
    }

    unhighlightNodeHover(id);
}

function onNodeDragMove(id) {
    for (let cn of conn) {
        if (cn[0] === id) {
            var line = lines[cn[2]];
            var node = nodes[cn[0]] 
            line.attr({ x1: node.cx() });
            line.attr({ y1: node.cy() });    
        }

        if (cn[1] === id) {
            var line = lines[cn[2]];
            var node = nodes[cn[1]] 
            line.attr({ x2: node.cx() });
            line.attr({ y2: node.cy() });    
        }
    }
}

//--------line events-----------

function onLineMouseOver(id) {
    isPtrOverLine = true;
    if (!isConnMode) {
        lines[id].attr({ 'stroke-width': hover_line_width });
    }
}

function onLineMouseOut(id) {
    isPtrOverLine = false;
    if (!isConnMode) {
        lines[id].attr({ 'stroke-width': default_line_width });
    }
}

function onLineClick(id) {
    deselectSelectedNode();

    var saved_slid = selectedLineId;
    deselectSelectedLine();
    
    if (id !== saved_slid)
        selectLine(id);
}

function onLineDblClick(id) {

    lines[id].remove();
    delete lines[id];

    conn = conn.filter(cn => cn[2] !== id);

    selectedLineId = undefined;
    isPtrOverLine = false;

    isConnMode = false;
}

//--------draw events--------

function onDrawClick(e){
    if (isPtrOverNode || isPtrOverLine)
        return;

    createNode(e.offsetX,e.offsetY);
}

function onDrawMouseUp(e){
    if (!isConnMode)
        return;
    
    if (tempLine)
        deleteTempLine();

        isConnMode = false;
}

function onDrawMouseMove(e){
    if (!isConnMode)
        return;
        
    if (selectedNodeId)
        deselectSelectedNode();
    
    if (selectedLineId)
        deselectSelectedLine();

    updateTempLine(e.offsetX, e.offsetY);
} 

SVG.on(document, 'DOMContentLoaded', function() {

    draw = SVG().addTo('#canvas').size('100%', '100%')

    draw.click((e) => onDrawClick(e));
    draw.mousemove((e) => onDrawMouseMove(e));
    draw.mouseup((e) => onDrawMouseUp(e));
})

function serNode(node){
    return {
        id: node.id, 
        cx: node.cx(), 
        cy: node.cy()
    }
}

function onSave() {
    var tempLink = document.createElement("a"); 
    
    sNodes = {}
    for (let id in nodes) {
        sNodes[id] = serNode(nodes[id]);
    }    

    sConn = []
    for (let cn of conn) {
        sConn.push(cn.slice(0, 2));
    }    

    var taBlob = new Blob([JSON.stringify({'nodes': sNodes, 'conn': sConn}, null, 2)], {type: 'text/plain'});
    tempLink.setAttribute('href', URL.createObjectURL(taBlob));
    tempLink.setAttribute('download', 'graph.json');
    tempLink.click();
    
    URL.revokeObjectURL(tempLink.href);
}

var fileInputElement;

function onLoad() {     
    fileInputElement = document.getElementById("file-input");
    fileInputElement.click();
}

function clear() {
    for(var id of Object.keys(nodes)){
        nodes[id].remove();
    }

    nodes = {};

    for(var id of Object.keys(lines)){
        lines[id].remove();
    }

    lines = {};

    conn.length = 0;
}

function handleFiles() {
    let reader = new FileReader();
    
    reader.onload = function() {  
        
        clear();

        try {            
            var jsonContent = JSON.parse(reader.result);

            var sNodes = jsonContent['nodes'];
            var sConn = jsonContent['conn'];
            
            for (let id in sNodes) {
                var sn = sNodes[id];
                createNode(sn.cx, sn.cy, id);
            }

            for (let cn of sConn) {                
                createConnection(cn[0], cn[1]);
            }
        }
        catch 
        {
            clear();
            alert('Error: File is invalid!');
        }
    
    };

    reader.readAsText(fileInputElement.files[0]);
}