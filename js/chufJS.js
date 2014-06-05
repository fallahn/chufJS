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

	var currentState = null;
	var states = [];

	this.start = function(canvasId)
	{
		var canvas = document.getElementById(canvasId);
		if(initGL(canvas) == false) return;

		//create states, assign current state
		states[StateID.MAIN_GAME] = createExampleState(gl, shaderResource, meshResource, textureResource);
		currentState = states[StateID.MAIN_GAME];
		currentState.load();

		tick();
	}

	function initGL(canvas)
	{
		try
		{
			gl = canvas.getContext("experimental-webgl");
			if(!gl)
			{
				console.log("Failed to initialise WebGL");
				return false;
			}

			gl.viewportWidth = canvas.width;
			gl.viewportHeight = canvas.height;
			gl.clearColor(1.0, 0.03, 0.07, 1.0);

			//gl.enable(gl.BLEND);
			//gl.blend_func(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			//gl.blendEquation(gl.FUNC_ADD);
			return true;
		}
		catch(e)
		{
		//	if(!gl) //TODO make this fail a bit more nicerer on unsupported browsers
		//		alert("Failed to initialise webGL");
		//	return false;
		}
	}

	var lastTime = new Date().getTime();
	var fixedStep = 1.0 / 30.0;
	function tick()
	{
		//TODO currentState.handleEvent()
		var now = new Date().getTime();
		var frameTime = (now - lastTime) / 1000.0;
		var maxSteps = 4;
		while(frameTime > 0.0 && maxSteps > 0)
		{
			var dt = Math.min(frameTime, fixedStep);
			currentState.update(dt);
			frameTime -= dt;
			maxSteps--;	
		}

		currentState.draw();
		
		if(currentState.stateRequest != StateID.NONE)
		{
			currentState.unload();
			currentState = states[currentState.stateRequest];
			currentState.load();
		}
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