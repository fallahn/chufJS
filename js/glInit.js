////////////
// GLOBALS - TODO: unglobalise :)
////////////

var glContext;
var globeMesh =
{
	normalBuffer   : null,
	uvBuffer       : null,
	positionBuffer : null,
	indexBuffer    : null
};
var pMatrix = mat4.create();
var mvMatrix = mat4.create();
var shaderProg;

function startGL()
{
	var canvas = document.getElementById("globeCanvas");
	initGL(canvas);
	initShaders();
	initBuffers();

	glContext.clearColor(0.0, 0.03, 0.07, 1.0);
	glContext.enable(glContext.DEPTH_TEST);

	drawScene();
}

function initGL(canvas)
{
	try
	{
		glContext = canvas.getContext("experimental-webgl");
		glContext.viewportWidth = canvas.width;
		glContext.viewportHeight = canvas.height;
	}
	catch(e)
	{
		if(!glContext)
			alert("Failed to initialise webGL");
	}
}

function initShaders()
{
	var fragShader = getShader(glContext, phongFrag, "frag");
	var vertShader = getShader(glContext, phongVert, "vert");

	shaderProg = glContext.createProgram();
	glContext.attachShader(shaderProg, vertShader);
	glContext.attachShader(shaderProg, fragShader);
	glContext.linkProgram(shaderProg);

	if(!glContext.getProgramParameter(shaderProg, glContext.LINK_STATUS))
		alert("Failed to Link Shader Program");

	shaderProg.vertexPositionAttribute = glContext.getAttribLocation(shaderProg, "vertPos");
	glContext.enableVertexAttribArray(shaderProg.vertexPositionAttribute);

	shaderProg.pMatrixLocation = glContext.getUniformLocation(shaderProg, "pMat");
	shaderProg.mvMatrixLocation = glContext.getUniformLocation(shaderProg, "mvMat");

	glContext.useProgram(shaderProg);
}

function initBuffers()
{
	var bandCount = 30;
	var stripCount = 30;
	var radius = 2.5;

	var vertPosData = [];
	var normalData = [];
	var uvData = [];

	for(var band = 0; band <= bandCount; band++)
	{
		var theta = band * Math.PI / bandCount;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);

		for(var strip = 0; strip <= stripCount; strip++)
		{
			var phi = strip * 2 * Math.PI / stripCount;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);

			var x = cosPhi * sinTheta;
			var y = cosTheta;
			var z = sinPhi * sinTheta;
			var u = 1 - (strip / stripCount);
			var v = 1 - (band / bandCount);

			vertPosData.push(radius * x);
			vertPosData.push(radius * y);
			vertPosData.push(radius * z);

			normalData.push(x);
			normalData.push(y);
			normalData.push(z);

			uvData.push(u);
			uvData.push(v);
		}
	}

	var indexData = [];
	for(var band = 0; band < bandCount; ++band)
	{
		for(var strip = 0; strip < stripCount; ++ strip)
		{
			var first = (band * (bandCount + 1)) + strip;
			var second = first + bandCount + 1;
			indexData.push(first);
			indexData.push(second);
			indexData.push(first + 1);

			indexData.push(second);
			indexData.push(second + 1);
			indexData.push(first + 1);
		}
	}

	globeMesh.normalBuffer = glContext.createBuffer();
	glContext.bindBuffer(glContext.ARRAY_BUFFER, globeMesh.normalBuffer);
	glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(normalData), glContext.STATIC_DRAW);
	globeMesh.normalBuffer.itemSize = 3;
	globeMesh.normalBuffer.itemCount = normalData.length / 3;

	globeMesh.uvBuffer = glContext.createBuffer();
	glContext.bindBuffer(glContext.ARRAY_BUFFER, globeMesh.uvBuffer);
	glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(uvData), glContext.STATIC_DRAW);
	globeMesh.uvBuffer.itemSize = 2;
	globeMesh.uvBuffer.itemCount = uvData.length / 2;

	globeMesh.positionBuffer = glContext.createBuffer();
	glContext.bindBuffer(glContext.ARRAY_BUFFER, globeMesh.positionBuffer);
	glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(vertPosData), glContext.STATIC_DRAW);
	globeMesh.positionBuffer.itemSize = 3;
	globeMesh.positionBuffer.itemCount = vertPosData.length / 3;

	globeMesh.indexBuffer = glContext.createBuffer();
	glContext.bindBuffer(glContext.ARRAY_BUFFER, globeMesh.indexBuffer);
	glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(indexData), glContext.STATIC_DRAW);
	globeMesh.indexBuffer.itemSize = 1;
	globeMesh.indexBuffer.itemCount = indexData.length;
}

function drawScene()
{
	glContext.viewport(0, 0, glContext.viewportWidth, glContext.viewportHeight);
	glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);

	mat4.perspective(45, glContext.viewportWidth / glContext.viewportHeight, 0.1, 100.0, pMatrix);
	mat4.identity(mvMatrix);

	mat4.translate(mvMatrix,[0.0, 0.0, -7.0]);
	glContext.bindBuffer(glContext.ARRAY_BUFFER, globeMesh.positionBuffer);
	glContext.vertexAttribPointer(shaderProg.vertexPositionAttribute, globeMesh.positionBuffer.itemSize, glContext.FLOAT, false, 0, 0);
	setMatrixUniforms();
	glContext.drawArrays(glContext.TRIANGLE_STRIP, 0, globeMesh.positionBuffer.itemCount);
}

function setMatrixUniforms()
{
	glContext.uniformMatrix4fv(shaderProg.pMatrixLocation, false, pMatrix);
	glContext.uniformMatrix4fv(shaderProg.mvMatrixLocation, false, mvMatrix);
}