////////////////////////////////////////////////////
// Provides example of creating a custom game state
// see chufApp.start() for details on loading states
////////////////////////////////////////////////////

function createExampleState(gl, shaderResource, meshResource, textureResource)
{
	var state = new State();
	var scene = new Scene();

	state.load = function()
	{
		//TODO loading window here?
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
		
		scene.addChild(globeNode);	
	}
	
	state.handleEvent = function()
	{

	}

	state.update = function(dt)
	{
		scene.update(dt);
	}

	state.draw = function()
	{
		//this is a 'standard' view port - but you may need one or more
		//custom viewports in a state, so gl.clear() needs to go here too
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		scene.draw(gl);
	}

	state.unload = function()
	{
		shaderResource.clear();
		meshResource.clear();
		textureResource.clear();
		scene.clear();
	}
	return state;
}