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
		var globeMesh = meshResource.getSphere(gl, 1.0);
		globeMesh.setShader(shaderResource.getShaderProgram(gl, ShaderName.NORMALMAP));
		globeMesh.setDebugShader(shaderResource.getShaderProgram(gl, ShaderName.DEBUG));
		
		var globeNode = new scene.createNode();
		globeNode.attachMesh(globeMesh);
		globeNode.setPosition(0.0, 0.0, -7.0);
		globeNode.updateSelf = function(dt, sceneNode)
		{
			sceneNode.rotate(0.0, 112 * dt, 0.0);
			//sceneNode.move(0.0, 1.0 * dt, 0.0);
		}
		globeNode.setTexture(TextureType.DIFFUSE, textureResource.getTexture(gl, "img/earth_map/earth_colour.png"));
		globeNode.setTexture(TextureType.SPECULAR, textureResource.getTexture(gl, "img/earth_map/earth_specular.png"));
		globeNode.setTexture(TextureType.NORMAL, textureResource.getTexture(gl, "img/earth_map/earth_normal.png"));
		
		//use this to orbit globe, and attach moon node to it
		var moonOrbitNode = scene.createNode();
		moonOrbitNode.setOrigin(0.0, 0.0, -5.0); //to scale moon should be 30x earth diamter
		//TODO set rotation speed relative to earth
		moonOrbitNode.updateSelf = function(dt, sceneNode)
		{
			sceneNode.rotate(0.0, -108 * dt, 0.0);
		}
		
		var moonNode = scene.createNode();
		moonNode.attachMesh(globeMesh);
		moonNode.setScale(0.273, 0.273, 0.273);
		moonNode.rotate(0.0, -90.0, 0.0);
		moonNode.updateSelf = function(dt, sceneNode)
		{
			//TODO simulate moons orbital eccentricity?
			//moonNode.rotate(0.0, -54.0 * dt, 0.0);	
		}

		moonNode.setTexture(TextureType.DIFFUSE, textureResource.getTexture(gl, "img/moon_map/moon_colour.png"));
		moonNode.setTexture(TextureType.NORMAL, textureResource.getTexture(gl, "img/moon_map/moon_normal.png"));
		moonNode.setTexture(TextureType.SPECULAR, textureResource.getTexture(gl, "img/moon_map/moon_specular.png"));

		moonOrbitNode.addChild(moonNode);
		globeNode.addChild(moonOrbitNode);
		scene.addChild(globeNode);


		//create a skybox and add it to the scene
		var images = [
			"/img/skybox/sky_posX.png",
			"/img/skybox/sky_negX.png",
			"/img/skybox/sky_posY.png",
			"/img/skybox/sky_negY.png",
			"/img/skybox/sky_posZ.png",
			"/img/skybox/sky_negZ.png"
			];
		var cubeMap = textureResource.getCubeMap(gl, images);
		var skybox = meshResource.getCube(gl, 1.0);
		skybox.setTexture(TextureType.SKYBOX, cubeMap);
		skybox.setShader(shaderResource.getShaderProgram(gl, ShaderName.SKYBOX));
		scene.setSkybox(skybox);

		//create at least one camera for scene
		var camera = new Camera(45.0, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
		scene.setActiveCamera(camera);
		//moonNode.attachCamera(camera);

		var camNode = scene.createNode();
		camNode.attachCamera(camera);
		camNode.updateSelf = function(dt, sceneNode)
		{
			//sceneNode.rotate(10.0 *dt, 0.0, 0.0);
			//sceneNode.move(0.0, 1.0 * dt, 0.0);
		}
		scene.addChild(camNode);
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
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		//TODO fetch viewport for active scene camera
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