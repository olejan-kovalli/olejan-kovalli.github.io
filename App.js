var draw;

var hubs = {};
var lines = {};
var conn = [];

var isPtrOverHub;
var isPtrOverLine;

var isConnMode = false;

var selectedHubId;
var selectedLineId;

var connSrcHubId;
var connDestHubId;

var connLine;

//--------hubs--------

function getNextHubId() {
    if (hubs && Object.keys(hubs).length > 0)
        return Math.max(...Object.keys(hubs).map(Number)) + 100;
    else
        return 100;
}

function createHub(cx, cy) {
    var id = getNextHubId();
    var diam = 2 * default_hub_radius;
    
    var hub = draw.circle(diam, diam);
    hub.center(cx, cy);
    hub.fill(default_color);

    hub.click(() => onHubClick(id));
    hub.dblclick(() => onHubDblClick(id));
    
    hub.mousedown(() => onHubMouseDown(id));
    hub.mouseup(() => onHubMouseUp(id));

    hub.mouseover(() => onHubMouseOver(id));
    hub.mouseout(() => onHubMouseOut(id));

    hub.touchstart(() => onHubMouseDown(id));
    hub.touchend(() => onHubMouseDown(id));
    
    hub.on('dragmove', () => onHubDragMove(id));

    hubs[id] = hub;
}

function selectHub(id) {
    if (id) {
        selectedHub = hubs[id];
        selectedHub.attr({ fill: selected_color })

        selectedHub.draggable();

        selectedHubId = id;
    }
}

function deselectSelectedHub() {
    if (selectedHubId) {
        selectedHub = hubs[selectedHubId];
        selectedHub.attr({ fill: default_color })

        selectedHub.draggable(false);
        
        selectedHubId = undefined;
    }
}

function highlightHubHover(id){
    hubs[id].radius(hover_hub_radius);
}

function unhighlightHubHover(id){
    hubs[id].radius(default_hub_radius);
}

function highlightDestHub(color){
    hubs[connDestHubId].attr({ fill: color });
}

function unhighlightDestHub(){
    if (connDestHubId){
        hubs[connDestHubId].radius(default_hub_radius);
        hubs[connDestHubId].attr({ fill: default_color });
    }
}

function deleteHub(id) {
    hubs[id].remove();
    delete hubs[id];
}

//--------lines--------

function getNextLineId() {
    if (lines && Object.keys(lines).length > 0)
        return Math.max(...Object.keys(lines).map(Number)) + 100;
    else
        return 100;
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

function deleteLines(hubId) {   
    for (var cn of conn)
        if (cn[0] === hubId || cn[1] === hubId) 
            deleteLine(cn[2])
}

function deleteLine(id) {
    lines[id].remove();
    delete lines[id];
}

//--------connLine--------

function createConnLine() {
    hub = hubs[connSrcHubId];

    var cx = hub.cx()
    var cy = hub.cy()

    connLine = draw.line(cx, cy, cx, cy);
    connLine.attr({ stroke: inactive_color, 'stroke-width': default_line_width })

    connLine.insertBefore(hubs[Object.keys(hubs)[0]]);
}

function updateConnLine(x_ptr, y_ptr) {
    var x1 = connLine.attr('x1');
    var y1 = connLine.attr('y1');

    connLine.attr({ x2: x_ptr  + (x_ptr > x1 ? -1 : 1)  });
    connLine.attr({ y2: y_ptr  + (y_ptr > y1 ? -1 : 1) });

}

function highlightConnLine(color){
    connLine.attr({ stroke: color });
}

function unhighlightConnLine(){
    connLine.attr({ stroke: inactive_color });
    connLine.attr({ 'stroke-width': default_line_width });
}

//--------connectivity------

function saveConnection() {
    var hub = hubs[connDestHubId];

    connLine.attr({x2: hub.cx()});
    connLine.attr({y2: hub.cy()});
    connLine.attr({stroke: 'blue'});
    
    var lineId = getNextLineId();
    
    connLine.mouseover(() => onLineMouseOver(lineId));
    connLine.mouseout(() => onLineMouseOut(lineId));
    connLine.click(() => onLineClick(lineId));
    connLine.dblclick(() => onLineDblClick(lineId));
    
    lines[lineId] = connLine;
    
    conn.push([connSrcHubId, connDestHubId, lineId]);
    
    connLine = undefined;
}

function isConnWithSrc() {
    return conn.filter(cn => 
        (cn[0] === connSrcHubId && cn[1] === connDestHubId) || 
        (cn[0] === connDestHubId && cn[1] === connSrcHubId)).length > 0;
}

function deleteConn(hubId) {
    conn = conn.filter(cn => cn[0] !== hubId && cn[1] !== hubId);
}

//----------hub events------------

function onHubClick(id) {
    deselectSelectedLine();

    var saved_shid = selectedHubId;
    deselectSelectedHub();
    
    if (id !== saved_shid)
        selectHub(id);
}

function onHubDblClick(id) {
    deselectSelectedHub();
    deselectSelectedLine();

    deleteHub(id);
    deleteLines(id);
    deleteConn(id);

    isPtrOverLine = false;
    isConnMode = false;
}

function onHubMouseDown(id) {
    if (id === selectedHubId)
        return;

    isConnMode = true;
    connSrcHubId = id;

    createConnLine();
}

function onHubMouseUp(id) {
    if (!isConnMode)
        return;
    
    if (id === connSrcHubId)
        return;

    unhighlightDestHub();
 
    if (isConnWithSrc())
        return;

    saveConnection();
    
    isConnMode = false;
    connSrcHubId = undefined;
}

function onHubMouseOver(id) {
    isPtrOverLine = true;

    if (isConnMode && id !== connSrcHubId ) {
        connDestHubId = id;

        if (isConnWithSrc()){
            highlightDestHub(forbidden_color);
            highlightConnLine(forbidden_color);
        }
        else {
            highlightDestHub(allowed_color);
            highlightConnLine(allowed_color);
        }
    }

    highlightHubHover(id);
}

function onHubMouseOut(id) {
    isPtrOverLine = false;

    if (isConnMode) {
        unhighlightDestHub(id);

        if (id !== connSrcHubId)
            unhighlightConnLine();
    }

    unhighlightHubHover(id);
}

function onHubDragMove(id) {
    for (let cn of conn) {
        if (cn[0] === id) {
            var line = lines[cn[2]];
            var hub = hubs[cn[0]] 
            line.attr({ x1: hub.cx() });
            line.attr({ y1: hub.cy() });    
        }

        if (cn[1] === id) {
            var line = lines[cn[2]];
            var hub = hubs[cn[1]] 
            line.attr({ x2: hub.cx() });
            line.attr({ y2: hub.cy() });    
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
    deselectSelectedHub();

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

function onDrawMouseUp(e){
    if (isConnMode) {
        if (connLine)
            connLine.remove();

        isConnMode = false;

        return;
    }

    if (isPtrOverHub || isPtrOverLine)
        return;

    createHub(e.offsetX,e.offsetY);
}

function onDrawMouseMove(e){
    if (!isConnMode)
        return;
        
    if (selectedHubId)
        deselectSelectedHub();
    
    if (selectedLineId)
        deselectSelectedLine();

    updateConnLine(e.offsetX, e.offsetY);
} 

SVG.on(document, 'DOMContentLoaded', function() {

    draw = SVG().addTo('#canvas').size('100%', '100%')

    draw.mousemove((e) => onDrawMouseMove(e));
    draw.mouseup((e) => onDrawMouseUp(e));

    draw.touchmove((e) => onDrawMouseMove(e));
})