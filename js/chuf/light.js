//////////////////////////////////////////////////////////
// creates a point light which can attached to a scene node
//////////////////////////////////////////////////////////

function Light()
{
	this.specular = vec3.create([1.0, 1.0, 0.7]);
	this.diffuse  = vec3.create([0.8, 0.8, 0.8]);
	this.ambient  = vec3.create([0.01, 0.01, 0.01]);

	var parent = null;
	this.setParent = function(sceneNode)
	{
		parent = sceneNode;
	}

	var defaultPosition = vec3.create();
	this.getPosition = function()
	{
		//abs position for lighting shaders
		if(parent)
			return parent.getWorldPosition();
		else
			return defaultPosition;
	}

	var inverseMVMatrix = mat4.create();
	this.getTransform = function()
	{
		//inverse parent transform for shadow map shader mvMat
		if(parent)
		{		
			mat4.inverse(parent.getWorldTransform(), inverseMVMatrix);
		}
		else
		{
			mat4.identity(inverseMVMatrix);
		}
		return inverseMVMatrix;		
	}
	var faceDirections = 
	[
		vec3.create([1.0, 0.0, 0.0]),
		vec3.create([-1.0, 0.0, 0.0]),
		vec3.create([0.0, 1.0, 0.0]),
		vec3.create([0.0, -1.0, 0.0]),
		vec3.create([0.0, 0.0, 1.0]),
		vec3.create([0.0, 0.0, -1.0])
	];
	this.getFaceTransform = function(face)
	{
		//mat4.lookAt(this.getPosition(), faceDirections[face], [0.0, 1.0, 0.0], inverseMVMatrix);
		switch(face) //TODO this won't work unless node transforms are updated immediately
		{
		case 0:
			parent.setRotation(0.0, 0.0, 0.0);
			break;
		case 1:
			parent.setRotation(0.0, 90.0, 0.0);
			break;
		case 2:
			parent.setRotation(0.0, 180.0, 0.0);
			break;
		case 3:
			parent.setRotation(0.0, 270.0, 0.0);
			break;
		case 4:
			parent.setRotation(90.0, 0.0, 0.0);
			break;
		case 5:
			parent.setRotation(-90.0, 0.0, 0.0);
			break;			
		}
		mat4.inverse(parent.getWorldTransform(), inverseMVMatrix);
		return mat4.inverse(inverseMVMatrix);
	}

	var pMat = mat4.create();
	mat4.perspective(90.0, 1.0, 0.1, 100.0, pMat);
	this.getProjection = function()
	{
		//projection matrix for shadow map shader
		return pMat;
	}

	this.setProjection = function(fov, width, height)
	{
		//TODO decide on how we want to set these planes - smaller difference gives 
		//better accuracy, but bigger risk of missing objects in shadow map
		//TODO decide if we prefer orthogonal?
		mat4.perspective(fov, width / height, width, height, 0, 50, pMatrix);
	}
}