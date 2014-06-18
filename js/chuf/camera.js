////////////////////////////////////////////
// cameras are attachable to scene nodes
// and provide the scene's projection matrix
////////////////////////////////////////////

//TODO add viewport paramters

function Camera(fov, aspectRatio, nearPlane, farPlane)
{
	var pMatrix = mat4.create();
	mat4.perspective(fov, aspectRatio, nearPlane, farPlane, pMatrix);

	this.getProjectionMatrix = function()
	{
		return pMatrix;
	}

	var inverseMVMatrix = mat4.create(); //this is what we return after node transform
	this.getTransform = function()
	{
		if(parent)
		{		
			mat4.inverse(parent.getWorldTransform(), inverseMVMatrix);
			//inverseMVMatrix = parent.getWorldTransform();
		}
		else
		{
			mat4.identity(inverseMVMatrix);
		}
		return inverseMVMatrix;
	}

	var parent = null;
	this.setParent = function(sceneNode)
	{
		parent = sceneNode;
	}

	var lookAtTarget = vec3.create();
	this.setTarget = function(target)
	{
		lookAtTarget = target;
	}
	this.getTarget = function()
	{
		return lookAtTarget;
	}
}