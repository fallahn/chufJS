function Scene()
{
	//root node of the scene, main draw calls passed down to children
	var rootMatrices =
	{
		pMatrix : mat4.create(),
		mvMatrix : mat4.create()
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

	this.draw = function(gl)
	{
		if(activeCamera)
			rootMatrices.pMatrix = activeCamera.getProjectionMatrix();
		else return;
		
		for(var j = 0; j < rootChildren.length; j++)
		{
			rootMatrices.mvMatrix = activeCamera.getTransform(); //TODO get the inverse of the camera transform
			rootChildren[j].draw(gl, rootMatrices);
		}
	}

	this.clear = function()
	{
		while(rootChildren.length)
			rootChildren.pop();
		UID = 0;
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

		var camera = null;
		this.attachCamera = function(cam)
		{
			camera = cam;
			camera.setParent(this);
		}

		var rotation = vec3.create();
		var position = vec3.create();
		var scale    = vec3.create([1.0, 1.0, 1.0]);
		var origin   = vec3.create();

		this.setRotation = function(x, y, z)
		{
			rotation[0] = toRad(x);
			rotation[1] = toRad(y);
			rotation[2]= toRad(z);
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
			updateMatrix = true;
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

		this.getWorldTransform = function()
		{
			var t = mat4.create();
			mat4.identity(t);
			for(var node = this; node != null; node = node.getParent())
			{
				mat4.multiply(t, node.getTransform());
				//if(node != null)
					//console.log(t[0]);
			}
			return t;
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

		this.draw = function(gl, matrices)
		{
			mat4.multiply(matrices.mvMatrix, mvMatrix);
			
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
				mesh.draw(matrices);
			}

			for(var l = 0; l < children.length; ++l)
				children[l].draw(gl, matrices);
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