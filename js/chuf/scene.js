function Scene()
{
	//root node of the scene, main draw calls passed down to children
	var matrices =
	{
		pMatrix : mat4.create(),
		mvMatrix : mat4.create()
	}
	
	this.update = function(dt)
	{
		var deletedList = [];
		for(i = 0; i < children.length; ++i)
		{
			//update each
			children[i].update(dt, children[i]);

			//remove deleted
			if(children[i].deleted())
				deletedList.push(i);
		}
		for(i = 0; i < deletedList.length; ++i)
			children.splice(i, 1); //TODO potential optimisation if IDs are concurrent
	}

	this.draw = function(glContext)
	{
		//TODO move pMatrix to camera and only update when necessary
		mat4.perspective(45, glContext.viewportWidth / glContext.viewportHeight, 0.1, 100.0, matrices.pMatrix);		

		for(i = 0; i < children.length; ++i)
		{
			mat4.identity(matrices.mvMatrix);
			children[i].draw(glContext, matrices);
		}
	}

	var children = [];
	this.addChild = function(sceneNode)
	{
		children.push(sceneNode);
	}

	var UID = 0;
	this.createNode = function()
	{
		var node = new SceneNode();
		node.UID = UID++;
		return node;
	}





	//-----------------------------------------------
	function SceneNode()
	{
		this.UID = 0;

		var children = [];
		this.addChild = function(sceneNode)
		{
			children.push(sceneNode);
		}

		var mesh = null;
		this.attachMesh = function(meshComponent)
		{
			mesh = meshComponent;
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

		this.update = function(dt, sceneNode)
		{
			//override this with custom function
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


		var mvMatrix = mat4.create();
		var updateMatrix = true;
		this.draw = function(glContext, matrices)
		{
			if(updateMatrix)
			{
				mat4.identity(mvMatrix);
				mat4.translate(mvMatrix, [position[0], position[1], position[2]]);			
				//mat4.translate(mvMatrix, [-origin.x, -origin.y,-origin.z]);			
				mat4.rotate(mvMatrix, rotation[1], [0, 1, 0]);
				mat4.rotate(mvMatrix, rotation[2], [0, 0, 1]);
				mat4.rotate(mvMatrix, rotation[0], [1, 0, 0]);
				mat4.scale(mvMatrix, [scale[0], scale[1], scale[2]]);
				updateMatrix = false;
			}

			matrices.mvMatrix = mat4.multiply(matrices.mvMatrix, mvMatrix);
			
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
				mesh.draw(glContext, matrices);
			}

			for(i = 0; i < children.length; ++i)
				children[i].draw(glContext, matrices);
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