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

	this.getFaceTransform = function(face)
	{
		mat4.identity(inverseMVMatrix);
		mat4.translate(inverseMVMatrix, this.getPosition());

		switch(face)
		{
		case 0:
			mat4.rotate(inverseMVMatrix, 1.571, [0, 1, 0]);
			break;
		case 1:
			mat4.rotate(inverseMVMatrix, -1.571, [0, 1, 0]);
			break;
		case 2:
			mat4.rotate(inverseMVMatrix, 1.571, [1, 0, 0]);
			break;
		case 3:
			mat4.rotate(inverseMVMatrix, -1.571, [1, 0, 0]);
			break;
		case 4:
			
			break;
		case 5:
			mat4.rotate(inverseMVMatrix, 3.142, [0, 1, 0]);
			break;			
		}

		//mat4.scale(inverseMVMatrix, [1.0, 1.0, 1.0]);
		mat4.inverse(inverseMVMatrix);	
		return inverseMVMatrix;
	}

	var pMat = mat4.create();
	mat4.perspective(45.0, 1.0, 0.1, 100.0, pMat);
	//mat4.scale(pMat, [-1.0, -1.0, 1.0]);
	//mat4.rotate(pMat, 3.142, [1, 0, 0]);
	this.getProjection = function()
	{
		//projection matrix for shadow map shader
		return pMat;
	}

	this.getModelView = function(target)
	{
		mat4.identity(inverseMVMatrix);
		return mat4.lookAt(this.getPosition(), target, [0.0, 1.0, 0.0], inverseMVMatrix);
	}
}