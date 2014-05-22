//////////////
// Main App //
//////////////
function runApp(canvasId)
{
	var app = new chufApp();
	app.start(canvasId);
}


function chufApp()
{
	var glContext;
	var shaderResource = new ShaderResource();
	var textureResource = new TextureResource();
	var scene = new Scene();

	this.start = function(canvasId)
	{
		var canvas = document.getElementById(canvasId);
		initGL(canvas);
		loadScene();

		tick();
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
			//TODO move cull options to multipass rendering
			glContext.enable(glContext.CULL_FACE);
			glContext.cullface(glContext.FRONT);
		}
		catch(e)
		{
			if(!glContext) //TODO make this fail a bit more nicerer on unsupported browsers
				alert("Failed to initialise webGL");
		}
	}

	function loadScene()
	{
		var globeMesh = new Sphere(glContext, 2.5);
		globeMesh.setShader(shaderResource.getShaderProgram(glContext, "normal"));
		globeMesh.setDebugShader(shaderResource.getShaderProgram(glContext, "debug"), glContext);
		
		var globeNode = new scene.createNode();
		globeNode.attachMesh(globeMesh);
		globeNode.setPosition(0.0, 0.0, -7.0);
		globeNode.update = function(dt, sceneNode)
		{
			sceneNode.rotate(0.0, 4.0 * dt, 0.0);
		}
		globeNode.setTexture("colour", textureResource.getTexture(glContext, "img/earth_map/earth_colour.png"));
		globeNode.setTexture("specular", textureResource.getTexture(glContext, "img/earth_map/earth_specular.png"));
		globeNode.setTexture("normal", textureResource.getTexture(glContext, "img/earth_map/earth_normal.png"));
		scene.addChild(globeNode);
	}

	function drawScene()
	{
		glContext.viewport(0, 0, glContext.viewportWidth, glContext.viewportHeight);
		glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);

		scene.draw(glContext);
	}

	var lastTime = new Date().getTime();
	var fixedStep = 1.0 / 30.0;
	function tick()
	{
		var now = new Date().getTime();
		var frameTime = (now - lastTime) / 1000.0;
		var maxSteps = 4;
		while(frameTime > 0.0 && maxSteps > 0)
		{
			var dt = Math.min(frameTime, fixedStep);
			scene.update(dt);
			frameTime -= dt;
			maxSteps--;	
		}

		drawScene();
		requestAnimationFrame(tick);
		lastTime = now;		
	}

}//chufApp

// requestAnimationFrame() shim by Paul Irish
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame =
(
	function() 
	{
 		return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(callback, element)
         {
           window.setTimeout(callback, 1000/60);
   		 };
	}
)();