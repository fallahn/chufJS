/////////////
// GLOBALS //
/////////////

var glContext;
var shaderManager = new ShaderManager();
var globeMesh;
var pMatrix = mat4.create(); //move to camera class

function startGL()
{
	var canvas = document.getElementById("globeCanvas");
	initGL(canvas);
	loadScene();

	drawScene();
}

function initGL(canvas)
{
	try
	{
		glContext = canvas.getContext("experimental-webgl");
		glContext.viewportWidth = canvas.width;
		glContext.viewportHeight = canvas.height;
		glContext.clearColor(0.0, 0.03, 0.07, 1.0);
		glContext.enable(glContext.DEPTH_TEST);		
	}
	catch(e)
	{
		if(!glContext) //TODO make this fail a bit more nicerer on unsupported browsers
			alert("Failed to initialise webGL");
	}
}

function loadScene()
{
	globeMesh = new Sphere(2.5, glContext);
	globeMesh.shaderProgram = shaderManager.getShaderProgram(glContext, "phong");
	globeMesh.setPosition(0.0, 0.0, -7.0);
}

function drawScene()
{
	glContext.viewport(0, 0, glContext.viewportWidth, glContext.viewportHeight);
	glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);

	mat4.perspective(45, glContext.viewportWidth / glContext.viewportHeight, 0.1, 100.0, pMatrix);	
	globeMesh.draw(glContext, pMatrix);
}
