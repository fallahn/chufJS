////////////////////////////////////////////////////
// Provides example of creating a custom game state
// see chufApp.start() for details on loading states
////////////////////////////////////////////////////

function createExampleState(gl, shaderResource, meshResource, textureResource)
{
	var state = new State();
	var scene = new Scene(gl);

	state.load = function()
	{
		//TODO loading window here?
		var globeMesh = meshResource.getSphere(gl, 1.0);
		globeMesh.setShader(shaderResource.getShaderProgram(gl, ShaderName.NORMALMAP));
		globeMesh.setDebugShader(shaderResource.getShaderProgram(gl, ShaderName.DEBUG));
		globeMesh.setShadowMapShader(shaderResource.getShaderProgram(gl, ShaderName.SHADOWMAP));
		
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
		//skybox.setTexture(TextureType.SKYBOX, cubeMap);
		skybox.setShader(shaderResource.getShaderProgram(gl, ShaderName.SKYBOX));
		scene.setSkybox(skybox);

		//create at least one camera for scene
		var camera = new Camera(45.0, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
		scene.setActiveCamera(camera);
		//moonNode.attachCamera(camera);

		var camNode = scene.createNode();
		camNode.attachCamera(camera);
		//camNode.move(1.0, 0.3, 0.0);
		camNode.updateSelf = function(dt, sceneNode)
		{
			//sceneNode.rotate(0.0, 10.0 *dt, 0.0);
			//sceneNode.move(0.0, 1.0 * dt, 0.0);
			//sceneNode.setScale(-1.0, -1.0, 1.0);
		}
		scene.addChild(camNode);

		var light = scene.addLight();
		var lightNode = scene.createNode();
		//lightNode.setPosition(10.0, 0.5, 1.0);
		lightNode.attachLight(light);
		scene.addChild(lightNode);

		var shadowMapTexture = new RenderTexture(gl, 1024, 1024, true, TargetType.CUBEMAP);
		scene.setShadowMap(shadowMapTexture);
		skybox.setTexture(TextureType.SKYBOX, shadowMapTexture);
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