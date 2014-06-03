//////////////////////////////////////////////////////////
// creates a point light whic can attached to a scene node
//////////////////////////////////////////////////////////

function Light()
{
	this.colour = vec4.create([1.0, 1.0, 1.0, 1.0]);

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

	var pMatrix = mat4.create();
	mat4.identity(pMatrix);
	this.getProjection = function()
	{
		//projection matrix for shadow map shader
		return pMatrix;
	}

	this.setProjection = function(fov, width, height)
	{
		//TODO decide on how we want to set these planes - smaller difference gives 
		//better accuracy, but bigger risk of missing objects in shadow map
		mat4.perspective(fov, width / height, width, height, 0, 50, pMatrix);
	}
}