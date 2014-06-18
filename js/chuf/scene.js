var RenderPass = Object.freeze
({
	SHADOW : 0,
	FINAL  : 1
});

function Scene()
{
	

	/*
	Currently only the first light is used by forward shading
	I plan to use multiple lights when deferred shading becomes available
	in webgl 2.0
	*/

	var lights = [];
	var maxLights = 8;
	this.addLight = function()
	{
		if(lights.length < maxLights)
		{
			//TODO pass render texture size to light for shadow map
			var light = new Light();
			lights.push(light);
			return light;
		}
		else
		{
			console.log("WARNING: max light count reached, failed to create light");
			return null;
		}
	}

	var skybox = null;
	this.setSkybox = function(sbox)
	{
		skybox = sbox;
	}


	//root node of the scene, main draw calls passed down to children
	var rootMatrices =
	{
		pMatrix   : mat4.create(),
		mvMatrix  : mat4.create(),
		camMatrix : mat4.create()
	}
	
	var rootChildren = [];
	this.addChild = function(sceneNode)
	{
		rootChildren.push(sceneNode);
		//don't need to set the root as parent as there's nothing
		//a child needs to query
	}

	var UID = 0;
	this.createNode = function()
	{
		var node = new SceneNode();
		node.UID = UID++;
		return node;
	}

	this.update = function(dt)
	{
		var deletedList = [];
		for(var i = 0; i < rootChildren.length; i++)
		{
			//update each
			rootChildren[i].update(dt, rootChildren[i]);

			//remove deleted
			if(rootChildren[i].deleted())
				deletedList.push(i);
		}
		for(var i = 0; i < deletedList.length; i++)
			rootChildren.splice(i, 1); //TODO potential optimisation if IDs are concurrent
	}

	var activeCamera = null;
	this.setActiveCamera = function(camera)
	{
		activeCamera = camera;
	}


	var shadowMapTarget = null;
	this.draw = function(gl)
	{
		if(!activeCamera)
		{
			console.log("WARNING: scene has no active camera");
			return;
		}
		gl.enable(gl.DEPTH_TEST);
		
		gl.enable(gl.CULL_FACE);		
		gl.cullFace(gl.BACK);				
		/*
		var colours = [
				0.0, 1.0, 0.0, 1.0,
				1.0, 0.0, 0.0, 1.0,
				0.0, 0.0, 1.0, 1.0,
				1.0, 1.0, 0.0, 1.0,
				0.0, 1.0, 1.0, 1.0,
				1.0, 0.0, 1.0, 1.0];
		*/

		//---------shadow pass-----------
		shadowMapTarget = lights[0].getShadowMapTexture();
		if(shadowMapTarget)
		{
			gl.viewport(0, 0, shadowMapTarget.width, shadowMapTarget.height);
			rootMatrices.pMatrix = lights[0].getProjection();
			shadowMapTarget.setActive(true);
			gl.clearColor(1.0, 1.0, 1.0, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			//this just points the light at whatever the camera is looking at
			lights[0].setTarget(activeCamera.getTarget());
			rootMatrices.camMatrix = lights[0].getModelView();
			
			for(var z = 0; z < rootChildren.length; ++z)
			{
				mat4.identity(rootMatrices.mvMatrix);
				rootChildren[z].draw(rootMatrices, RenderPass.SHADOW);
			}

			shadowMapTarget.setActive(false);
		}

		//----------final pass-----------
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		//TODO fetch viewport for active scene camera
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		//set projection matrix back to camera from light
		rootMatrices.pMatrix = activeCamera.getProjectionMatrix();
		rootMatrices.camMatrix = activeCamera.getTransform();

		//skybox
		if(skybox)
		{
			gl.cullFace(gl.FRONT); //only need this if we aren't culling for shadow map
			gl.depthMask(false);
			mat4.set(rootMatrices.camMatrix, rootMatrices.mvMatrix);
			//nerf translation
			rootMatrices.mvMatrix[12] = 0.0;
			rootMatrices.mvMatrix[13] = 0.0;
			rootMatrices.mvMatrix[14] = 0.0;
			skybox.draw(rootMatrices, RenderPass.FINAL);
			gl.depthMask(true);
		}

		//graph nodes
		gl.cullFace(gl.BACK);
		for(var j = 0; j < rootChildren.length; j++)
		{
			mat4.identity(rootMatrices.mvMatrix);
			rootChildren[j].draw(rootMatrices, RenderPass.FINAL);
		}
	}

	this.clear = function()
	{
		while(rootChildren.length)
		{
			rootChildren.pop();
		}
		while(lights.length)
		{
			lights[lights.length - 1].delete();
			lights.pop();
		}
		UID = 0;

		//if(shadowMapTarget)
		//	shadowMapTarget.delete(); //performed by light deletion
	}



	//-----------------------------------------------
	function SceneNode()
	{
		this.UID = 0;

		var children = [];
		this.addChild = function(sceneNode)
		{
			children.push(sceneNode);
			sceneNode.setParent(this);
		}

		var parent = null;
		this.setParent = function(sceneNode)
		{
			parent = sceneNode;
		}
		this.getParent = function()
		{
			return parent;
		}

		var mesh = null;
		this.attachMesh = function(meshComponent)
		{
			mesh = meshComponent;
			mesh.setLights(lights);
		}

		//nodes carry own textures so multiple textures can be applied to shared meshes
		var colourTexture = null;
		var normalTexture = null;
		var specularTexture = null;
		this.setTexture = function(textureType, texture)
		{
			switch(textureType)
			{
			case TextureType.DIFFUSE:
				colourTexture = texture;
				break;
			case TextureType.NORMAL:
				normalTexture = texture;
				break;
			case TextureType.SPECULAR:
				specularTexture = texture;
				break;
			default: break;
			}
		}

		this.attachCamera = function(camera)
		{
			camera.setParent(this);
		}

		this.attachLight = function(light)
		{
			light.setParent(this);
		}

		var rotation = vec3.create();
		var position = vec3.create();
		var scale    = vec3.create([1.0, 1.0, 1.0]);
		var origin   = vec3.create();

		this.setRotation = function(x, y, z)
		{
			rotation[0] = toRad(x);
			rotation[1] = toRad(y);
			rotation[2] = toRad(z);
			updateMatrix = true;
		}

		this.rotate = function(x, y, z)
		{
			rotation[0] += toRad(x);
			rotation[1] += toRad(y);
			rotation[2] += toRad(z);
			updateMatrix = true;
		}

		this.setPosition = function(x, y, z)
		{
			position[0] = x;
			position[1] = y;
			position[2] = z;
			updateMatrix = true
		}

		this.getPosition = function()
		{
			return position;
		}

		this.getWorldPosition = function()
		{
			var position = vec3.create();
			mat4.multiplyVec3(worldMatrix, position);
			return position;
		}

		this.move = function(x, y, z)
		{
			position[0] += x;
			position[1] += y;
			position[2] += z;
			updateMatrix = true;
		}

		this.setScale = function(x, y, z)
		{
			scale[0] = x;
			scale[1] = y;
			scale[2] = z;
			updateMatrix = true;
		}

		this.scale = function(x, y, z)
		{
			scale[0] *= x;
			scale[1] *= y;
			scale[2] *= z;
			updateMatrix = true;
		}

		this.setOrigin = function(x, y, z)
		{
			origin[0] = x;
			origin[1] = y;
			origin[2] = z;
		}

		var mvMatrix = mat4.create();
		this.getTransform = function()
		{
			return mvMatrix;
		}
		var worldMatrix = mat4.create();
		this.getWorldTransform = function()
		{
			return worldMatrix;
		}
		
		var updateMatrix = true;

		this.update = function(dt, sceneNode)
		{
			if(updateMatrix)
			{
				mat4.identity(mvMatrix);

				mat4.translate(mvMatrix, [position[0], position[1], position[2]]);							
				mat4.rotate(mvMatrix, rotation[1], [0, 1, 0]);
				mat4.rotate(mvMatrix, rotation[2], [0, 0, 1]);
				mat4.rotate(mvMatrix, rotation[0], [1, 0, 0]);
				//scale first if you want to scale about the origin point (this will also scale the distance to the origin of course)
				mat4.scale(mvMatrix, [scale[0], scale[1], scale[2]]);
				mat4.translate(mvMatrix, [-origin[0], -origin[1], -origin[2]]);
				updateMatrix = false;				
			}

			this.updateSelf(dt, sceneNode);
			for(var k = 0; k < children.length; k++)
				children[k].update(dt, children[k]);
		}

		this.updateSelf = function(dt, sceneNode)
		{
			//override this with custom function
			//see state creation in examples folder
		}

		this.draw = function(matrices, renderPass)
		{
			mat4.multiply(matrices.mvMatrix, mvMatrix);
			mat4.set(matrices.mvMatrix, worldMatrix);
			
			if(mesh)
			{
				//set textures maps if they exist
				if(colourTexture)
				{
					mesh.setTexture(TextureType.DIFFUSE, colourTexture);
				}
				if(normalTexture)
				{
					mesh.setTexture(TextureType.NORMAL, normalTexture);
				}
				if(specularTexture)
				{
					mesh.setTexture(TextureType.SPECULAR, specularTexture);
				}
				mesh.draw(matrices, renderPass);
			}

			for(var l = 0; l < children.length; ++l)
				children[l].draw(matrices, renderPass);
		}

		var isDeleted = false;
		this.deleted = function()
		{
			return isDeleted;
		}
		this.delete = function()
		{
			isDeleted = true;
		}

		//------------------------------------------------------
		function toRad(degrees)
		{
			return degrees * 0.017453;
		}
	}	
}