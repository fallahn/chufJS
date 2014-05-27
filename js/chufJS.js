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
	var gl;
	var shaderResource = new ShaderResource();
	var textureResource = new TextureResource();
	var meshResource = new MeshResource();
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
			gl = canvas.getContext("experimental-webgl");
			gl.viewportWidth = canvas.width;
			gl.viewportHeight = canvas.height;
			gl.clearColor(0.0, 0.03, 0.07, 1.0);
			gl.enable(gl.DEPTH_TEST);
			//TODO move cull options to multipass rendering
			gl.enable(gl.CULL_FACE);
			gl.cullface(gl.FRONT);
			gl.enable(gl.BLEND);
			gl.blend_func(gl.SRC_ALPHA, gl.ONE);
			gl.blendEquation(gl.FUNC_ADD);
		}
		catch(e)
		{
			if(!gl) //TODO make this fail a bit more nicerer on unsupported browsers
				alert("Failed to initialise webGL");
		}
	}

	function loadScene()
	{
		var globeMesh = meshResource.getSphere(gl, 1.5);
		globeMesh.setShader(shaderResource.getShaderProgram(gl, ShaderName.NORMALMAP));
		globeMesh.setDebugShader(shaderResource.getShaderProgram(gl, ShaderName.DEBUG));
		
		var globeNode = new scene.createNode();
		globeNode.attachMesh(globeMesh);
		globeNode.setPosition(0.0, 0.0, -7.0);
		globeNode.updateSelf = function(dt, sceneNode)
		{
			sceneNode.rotate(0.0, 14.0 * dt, 0.0);
		}
		globeNode.setTexture(TextureType.DIFFUSE, textureResource.getTexture(gl, "img/earth_map/earth_colour.png"));
		globeNode.setTexture(TextureType.SPECULAR, textureResource.getTexture(gl, "img/earth_map/earth_specular.png"));
		globeNode.setTexture(TextureType.NORMAL, textureResource.getTexture(gl, "img/earth_map/earth_normal.png"));
		
		var cloudMesh = meshResource.getSphere(gl, 0.4);
		cloudMesh.setShader(shaderResource.getShaderProgram(gl, ShaderName.PHONG));
		cloudMesh.setDebugShader(shaderResource.getShaderProgram(gl, ShaderName.DEBUG))
		var cloudNode = scene.createNode();
		cloudNode.attachMesh(cloudMesh);
		cloudNode.updateSelf = function(dt, sceneNode)
		{
			sceneNode.rotate(0.0, -119.0 * dt, 0.0);
		}
		cloudNode.setTexture(TextureType.DIFFUSE, textureResource.getTexture(gl, "img/earth_map/cloud_colour.png"));
		//cloudNode.setTexture(TextureType.NORMAL, textureResource.getTexture(gl, "img/earth_map/cloud_normal.png"));
		cloudNode.setPosition(2.2, 0.0, -7.0);

		//var cubeMesh = meshResource.getCube(gl, 0.2);
		//cubeMesh.setShader(shaderResource.getShaderProgram(gl, ShaderName.PHONG));
		var cubeNode = scene.createNode();
		cubeNode.attachMesh(cloudMesh);
		cubeNode.setScale(0.5, 0.5, 0.5);
		cubeNode.updateSelf = function(dt, sceneNode)
		{
			sceneNode.rotate(0.0, 50.0 * dt, 0.0);
		}
		cubeNode.setTexture(TextureType.DIFFUSE, textureResource.getTexture(gl, "img/earth_map/cloud_normal.png"));
		cubeNode.setPosition(-1.9, 0.0, -7.0);

		scene.addChild(cubeNode);
		scene.addChild(cloudNode);
		scene.addChild(globeNode);
	}

	function drawScene()
	{
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		scene.draw(gl);
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