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
		mat4.identity(matrices.mvMatrix);
		//TODO move pMatrix to camera and only update when necessary
		mat4.perspective(45, glContext.viewportWidth / glContext.viewportHeight, 0.1, 100.0, matrices.pMatrix);		

		for(i = 0; i < children.length; ++i)
			children[i].draw(glContext, matrices);
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

		var rotation =
		{
			x : 0.0,
			y : 0.0,
			z : 0.0
		}

		var position = 
		{
			x : 0.0,
			y : 0.0,
			z : 0.0		
		}

		var scale = 
		{
			x : 1.0,
			y : 1.0,
			z : 1.0		
		}

		var origin = 
		{
			x : 0.0,
			y : 0.0,
			z : 0.0
		}

		this.setRotation = function(x, y, z)
		{
			rotation.x = toRad(x);
			rotation.y = toRad(y);
			rotation.z = toRad(z);
			updateMatrix = true;
		}

		this.rotate = function(x, y, z)
		{
			rotation.x += toRad(x);
			rotation.y += toRad(y);
			rotation.z += toRad(z);
			updateMatrix = true;
		}

		this.setPosition = function(x, y, z)
		{
			position.x = x;
			position.y = y;
			position.z = z;
			updateMatrix = true;
		}

		this.move = function(x, y, z)
		{
			position.x += x;
			position.y += y;
			position.z += z;
			updateMatrix = true;
		}

		this.setScale = function(x, y, z)
		{
			scale.x = x;
			scale.y = y;
			scale.z = z;
			updateMatrix = true;
		}

		this.scale = function(x, y, z)
		{
			scale.x *= x;
			scale.y *= y;
			scale.z *= z;
			updateMatrix = true;
		}

		this.setOrigin = function(x, y, z)
		{
			origin.x = x;
			origin.y = y;
			origin.z = z;
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
			case "colour":
				colourTexture = texture;
				break;
			case "normal":
				normalTexture = texture;
				break;
			case "specular":
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
				mat4.translate(mvMatrix, [position.x, position.y, position.z]);			
				//mat4.translate(mvMatrix, [-origin.x, -origin.y,-origin.z]);			
				mat4.rotate(mvMatrix, rotation.y, [0, 1, 0]);
				mat4.rotate(mvMatrix, rotation.z, [0, 0, 1]);
				mat4.rotate(mvMatrix, rotation.x, [1, 0, 0]);
				mat4.scale(mvMatrix, [scale.x, scale.y, scale.z]);
				updateMatrix = false;
			}

			matrices.mvMatrix = mat4.multiply(matrices.mvMatrix, mvMatrix);
			
			if(mesh)
			{
				//set textures maps if they exist
				if(colourTexture)
				{
					mesh.setTexture("colour", colourTexture);
				}
				if(normalTexture)
				{
					mesh.setTexture("normal", normalTexture);
				}
				if(specularTexture)
				{
					mesh.setTexture("specular", specularTexture);
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