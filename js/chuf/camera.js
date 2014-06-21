////////////////////////////////////////////
// cameras are attachable to scene nodes
// and provide the scene's projection and view matrices
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

	var inverseMVMatrix = mat4.create();
	mat4.identity(inverseMVMatrix);	
	this.getTransform = function()
	{
		if(parent)
		{		
			mat4.inverse(parent.getWorldTransform(), inverseMMatrix);
		}
		return inverseMVMatrix;
	}

	var viewMat = mat4.create();
	mat4.identity(viewMat);
	this.getViewMatrix = function()
	{
		if(parent)
			mat4.lookAt(parent.getWorldPosition(), lookAtTarget, [0.0, 1.0, 0.0], viewMat);
		return viewMat;
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
		if(parent)
		{		
			mat4.lookAt(parent.getWorldPosition(), lookAtTarget, [0.0, 1.0, 0.0], viewMat);
		}		
	}
	this.getTarget = function()
	{
		return lookAtTarget;
	}
}