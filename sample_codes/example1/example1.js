"use strict";

var gl;

var thetaLoc;
var delay = 200;
var delayValue = 200;
var direction = true;
var Isrotation = false;
var pointsArray = [];
var colorsArray = [];
var normals = [];
var modelViewMatrix = mat4();
var pMatrix = mat4();
var transMat = mat4();
var scaleMat = mat4();
var modelViewMatrixLoc;
var stack = [];
var viewer = [1600, -500, 2000];
var up = [0, 1, 0];
var bgColor = [1.0, 0.0, 0.0, 1.0];
var intColor2 = [vec4(1.0, 0.0, 0.0, 1.0),
vec4(0.0, 1.0, 0.0, 1.0),
vec4(0.0, 0.0, 1.0, 1.0)];

var intColor = vec4(0.2, 0.2, 0.2, 1.0);


window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    //
    //  Configure WebGL
    //
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    //  Load shaders and initialize attribute buffers

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);

    colorCube();

    //allInitNode();
    // Load the data into the GPU

    // vertex buffer
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);


    // var nbuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, nbuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    // var vNormal = gl.getAttribLocation(program, "vNormal");
    // gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(vNormal);


    thetaLoc = gl.getUniformLocation(program, "theta");

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelView");
    var matProjUniformLoc = gl.getUniformLocation(program, "projection");
    modelViewMatrix = lookAt(viewer, [0, 0, 0], up);
    pMatrix = perspective(60 * Math.PI / 180, canvas.width / canvas.height, 1, 10000.0);

    gl.uniformMatrix4fv(modelViewMatrixLoc, gl.FALSE, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(matProjUniformLoc, gl.FALSE, flatten(pMatrix));

    var viewerPostionLoc = gl.getUniformLocation(program, "viewerPostion");
    gl.uniform3fv(viewerPostionLoc, flatten(viewer));

    var lightX = 0;
    var lightY = 0;
    var lightZ = -1;
    var lightPosition = vec4(lightX, lightY, lightZ);
    var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
    var lightDiffuse = vec4(1.0, 1.0, 0.0, 1.0);
    var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

    var materialAmbient = vec4(1.0, 0.0, 0.0, 1.0);
    var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
    var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
    var materialShininess = 25.0;

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));

    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);




    document.getElementById("Pause").onclick = function () {
        Isrotation = true;
    }

    document.getElementById("lightxPos").oninput = function () {
        lightX = this.value;
        lightPosition = vec4(lightX, lightY, lightZ);
        gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    }


    allInitNode();
    render();
};




function rotate(theta, x, y, z) {
    var rad = theta * Math.PI / 180
    var c = Math.cos(rad);
    var s = Math.sin(rad);
    var xMat = mat4();
    var yMat = mat4();
    var zMat = mat4();

    if (x == 1) {
        xMat = mat4(1, 0, 0, 0,
            0, c, -s, 0,
            0, s, c, 0,
            0, 0, 0, 1);
    }
    if (z == 1) {
        yMat = mat4(
            c, -s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );
    }
    if (y == 1) {
        yMat = mat4(
            c, 0, s, 0,
            0, 1, 0, 0,
            -s, 0, c, 0,
            0, 0, 0, 1
        );
    }

    return mult(xMat, mult(yMat, zMat));
}

function translate(dx, dy, dz) {
    return mat4(1, 0, 0, dx,
        0, 1, 0, dy,
        0, 0, 1, dz,
        0, 0, 0, 1);
}

function scale(dx, dy, dz) {
    return mat4(dx, 0, 0, 0,
        0, dy, 0, 0,
        0, 0, dz, 0,
        0, 0, 0, 1);
}

function getNormal(a, b, c) {
    var t1 = subtract(c, a);
    var t2 = subtract(b, a);
    var normal = vec3(normalize(cross(t1, t2)));
    normals.push(normal);
    normals.push(normal);
    normals.push(normal);
}

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];

var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // white
    vec4(0.0, 1.0, 1.0, 1.0)   // cyan
];

var figure = [];
var numNodes = 11;

for (var i = 0; i < numNodes; i++) {
    figure[i] = createNode(null, null, null, null);
}

var torsoHeight = 8.0;
var torsoWidthx = 5.0;
var torsoWidthz = 2.0;

var headHeight = 2.0;
var headWidth = 2.0;

var upperArmHeight = 3.5;
var upperArmWidth = 1.0;

var lowerArmHeight = 3.5;
var lowerArmWidth = 0.8;

var upperLegHeight = 3.2;
var upperLegWidth = 1.5;

var lowerLegHeight = 3.2;
var lowerLegWidth = 0.8;


var numVertices = 36;

var theta = [0, 0, 0, 180, 0, 180, 0, 180, 0, 180, 0];
// [torso, head, left upper arm, left lower arm, right upper arm, right lower arm, left upper leg, left lower leg, right upper leg, right lower leg]
var rootId = 0;
var torsoId = 0 + 1;
var headId = 1 + 1;
var luaId = 2 + 1;
var llaId = 3 + 1;
var ruaId = 4 + 1;
var rlaId = 5 + 1;
var lulId = 6 + 1;
var lllId = 7 + 1;
var rulId = 8 + 1;
var rllId = 9 + 1;

var instanceMatrix;

function root() {

}

function torso() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * torsoHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(torsoWidthx, torsoHeight, torsoWidthz));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function head() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(headWidth, headHeight, headWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function lua() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(upperArmWidth, upperArmHeight, upperArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function lla() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(lowerArmWidth, lowerArmHeight, lowerArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function rua() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(upperArmWidth, upperArmHeight, upperArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function rla() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(lowerArmWidth, lowerArmHeight, lowerArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function lul() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function lll() {
    instanceMatrix = mult(modelViewMatrix, translate(0, 0.5 * lowerLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function rul() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function rll() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}



function quad(a, b, c, d) {

    pointsArray.push(vertices[a]);
    colorsArray.push(intColor);


    pointsArray.push(vertices[b]);
    colorsArray.push(intColor);


    pointsArray.push(vertices[c]);
    colorsArray.push(intColor);


    pointsArray.push(vertices[a]);
    colorsArray.push(intColor);


    pointsArray.push(vertices[c]);
    colorsArray.push(intColor);


    pointsArray.push(vertices[d]);
    colorsArray.push(intColor);

}

function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function createNode(transform, render, sibling, child) {
    var node = {
        transform: transform,
        render: render,
        sibling: sibling,
        child: child,
    }
    return node;
}

function initNode(Id) {
    var m = mat4();

    switch (Id) {
        case rootId:
            m = mat4();
            figure[rootId] = createNode(m, root, null, torsoId);
            break;
        case torsoId:
            m = rotate(theta[torsoId], 0, 1, 0);
            figure[torsoId] = createNode(m, torso, null, headId);
            break;
        case headId:
            m = translate(0.0, 1.0 * torsoHeight, 0.0);
            m = mult(m, rotate(theta[headId], 0, 1, 0));
            figure[headId] = createNode(m, head, luaId, null);
            break;
        case luaId:
            m = translate(-0.5 * (torsoWidthx + upperArmWidth), 0.95 * torsoHeight, 0.0);
            m = mult(m, rotate(theta[luaId], 1, 0, 0));
            figure[luaId] = createNode(m, lua, ruaId, llaId);
            break;
        case llaId:
            m = translate(0.0, upperArmHeight, 0.0);
            m = mult(m, rotate(theta[llaId], 0, 0, 1));
            figure[llaId] = createNode(m, lla, null, null);
            break;
        case ruaId:
            m = translate(0.5 * (torsoWidthx + upperArmWidth), 0.95 * torsoHeight, 0.0);
            m = mult(m, rotate(theta[ruaId], 1, 0, 0));
            figure[ruaId] = createNode(m, rua, lulId, rlaId);
            break;
        case rlaId:
            m = translate(0.0, upperArmHeight, 0.0);
            m = mult(m, rotate(theta[rlaId], 0, 0, 1));
            figure[rlaId] = createNode(m, rla, null, null);
            break;
        case lulId:
            m = translate(-0.25 * (torsoWidthx), 0.0, 0.0);
            m = mult(m, rotate(theta[lulId], 1, 0, 0));
            figure[lulId] = createNode(m, lul, rulId, lllId);
            break;
        case lllId:
            m = translate(0.0, upperLegHeight, 0.0);
            m = mult(m, rotate(theta[lllId], 1, 0, 0));
            figure[lllId] = createNode(m, lll, null, null);
            break;
        case rulId:
            m = translate(0.25 * (torsoWidthx), 0.0, 0.0);
            m = mult(m, rotate(theta[rulId], 1, 0, 0));
            figure[rulId] = createNode(m, rul, null, rllId);
            break;
        case rllId:
            m = translate(0.0, upperLegHeight, 0.0);
            m = mult(m, rotate(theta[rllId], 1, 0, 0));
            figure[rllId] = createNode(m, rll, null, null);
            break;
    }
}


function traverse(Id) {
    if (Id == null) return;

    stack.push(modelViewMatrix);

    modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);

    figure[Id].render();

    if (figure[Id].child != null)
        traverse(figure[Id].child);

    modelViewMatrix = stack.pop();

    if (figure[Id].sibling != null)
        traverse(figure[Id].sibling);
}

function allInitNode() {
    initNode(rootId);
    initNode(torsoId);
    initNode(headId);
    initNode(luaId);
    initNode(llaId);
    initNode(ruaId);
    initNode(rlaId);
    initNode(lulId);
    initNode(lllId);
    initNode(rulId);
    initNode(rllId);
}
var chk = false;


function getBodyLocation() {
    var origin = vec4(0, 0, 0, 1);
    var position = mult(figure[torsoId].transform, origin);
    if (position.x >= 10) moveToX = -0.1;
}
var moveToX = 0.2;
var handcount = 0;
var legcount = 0;


var bodycount = 0;
function wheelBody1() {
    if (bodycount <= 30) {
        figure[torsoId].transform = mult(figure[torsoId].transform, rotate(-1.75, 1, 0, 0));
        figure[lulId].transform = mult(figure[lulId].transform, rotate(1, 1, 0, 0));
        figure[rulId].transform = mult(figure[rulId].transform, rotate(1, 1, 0, 0));
        figure[luaId].transform = mult(figure[luaId].transform, rotate(-1, 1, 0, 0));
        figure[ruaId].transform = mult(figure[ruaId].transform, rotate(-1, 1, 0, 0));

    }
    else return false;
    bodycount += 1;
    return true;
}
var bodycount2 = 0;
function wheelBody2() {
    if (bodycount2 <= 30) {
        figure[torsoId].transform = mult(figure[torsoId].transform, rotate(-1, 1, 0, 0));
        figure[luaId].transform = mult(figure[luaId].transform, rotate(-1, 1, 0, 0));
        figure[ruaId].transform = mult(figure[ruaId].transform, rotate(-1, 1, 0, 0));
        figure[rulId].transform = mult(figure[rulId].transform, rotate(1, 1, 0, 0));

    }
    else return false;
    bodycount2 += 1;
    return true;
}



function cartwheel() {
    if (!raiseHand()) {
        if (!wheelBody1()) {

            wheelBody2();
        }
    }


}

function raiseHand() {
    if (handcount <= 60) {
        figure[ruaId].transform = mult(figure[ruaId].transform, rotate(6, 1, 0, 0));
        figure[luaId].transform = mult(figure[luaId].transform, rotate(6, 1, 0, 0));
        figure[torsoId].transform = mult(figure[torsoId].transform, rotate(-2, 1, 0, 0));

    }
    else return false;

    handcount += 6;
    if (legcount <= 30) {
        figure[rulId].transform = mult(figure[rulId].transform, rotate(4, 1, 0, 0));
        figure[lulId].transform = mult(figure[lulId].transform, rotate(4, 1, 0, 0));
        figure[rllId].transform = mult(figure[rllId].transform, rotate(-2, 1, 0, 0));
        figure[lllId].transform = mult(figure[lllId].transform, rotate(-2, 1, 0, 0));
        figure[rlaId].transform = mult(figure[rlaId].transform, rotate(2, 1, 0, 0));
        figure[llaId].transform = mult(figure[llaId].transform, rotate(2, 1, 0, 0));

    }
    legcount += 2;
    return true;
}
var jumpcount = 0;
function jumpforVault() {
    if (jumpcount <= 5) {
        //figure[torsoId].transform = mult(figure[torsoId].transform, rotate(2, 1, 0, 0));
        figure[rootId].transform = mult(figure[rootId].transform, translate(0.5, 0.5, 0));

    }
    else return false;
    jumpcount++;
    return true;
}

function TwohandedVault() {
    if (!raiseHand()) {
        jumpforVault();
    }
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //allInitNode();
    traverse(rootId);
    TwohandedVault();
    requestAnimationFrame(render);
}
