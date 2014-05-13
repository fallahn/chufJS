//-----base class for meshes-----//
function Mesh()
{
	//TODO make protected? Not sure how it works with inheritance
	this.normalBuffer   = null;
	this.uvBuffer       = null;
	this.positionBuffer = null;
	this.indexBuffer    = null;

	this.shaderProgram  = null; //should be made private and set with function

	//TODO these should be parent node properties
	var mvMatrix = mat4.create();
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

	this.setRotation = function(x, y, z)
	{
		rotation.x = x;
		rotation.y = y;
		rotation.z = z;
	}

	this.rotate = function(x, y, z)
	{
		rotation.x += x;
		rotation.y += y;
		rotation.z += z;
	}

	this.setPosition = function(x, y, z)
	{
		position.x = x;
		position.y = y;
		position.z = z;
	}

	this.move = function(x, y, z)
	{
		position.x += x;
		position.y += y;
		position.z += z
	}

	this.setScale = function(x, y, z)
	{
		scale.x = x;
		scale.y = y;
		scale.z = z;
	}

	this.scale = function(x, y, z)
	{
		scale.x *= x;
		scale.y *= y;
		scale.z *= z;
	}

	this.draw = function(glContext, pMatrix)
	{
		glContext.useProgram(this.shaderProgram.program);

		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, [position.x, position.y, position.z]);
		mat4.rotate(mvMatrix, rotation.y, [0, 1, 0]);
		mat4.rotate(mvMatrix, rotation.z, [0, 0, 1]);
		mat4.rotate(mvMatrix, rotation.x, [1, 0, 0]);
		mat4.scale(mvMatrix, [scale.x, scale.y, scale.z]);
		
		glContext.uniformMatrix4fv(this.shaderProgram.mvMatrixLocation, false, mvMatrix);
		glContext.uniformMatrix4fv(this.shaderProgram.pMatrixLocation, false, pMatrix);

		glContext.bindBuffer(glContext.ARRAY_BUFFER, this.positionBuffer);
		glContext.vertexAttribPointer(this.shaderProgram.vertexPosAttribute, this.positionBuffer.itemSize, glContext.FLOAT, false, 0, 0);
		glContext.drawArrays(glContext.TRIANGLE_STRIP, 0, this.positionBuffer.itemCount);
	}	
}




//----sphere mesh type----//
function Sphere(radius, glContext)
{
	var bandCount = 30;
	var stripCount = 30;

	var vertPosData = [];
	var normalData = [];
	var uvData = [];

	for(var band = 0; band <= bandCount; band++)
	{
		var theta = band * Math.PI / bandCount;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);

		for(var strip = 0; strip <= stripCount; strip++)
		{
			var phi = strip * 2 * Math.PI / stripCount;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);

			var x = cosPhi * sinTheta;
			var y = cosTheta;
			var z = sinPhi * sinTheta;
			var u = 1 - (strip / stripCount);
			var v = 1 - (band / bandCount);

			vertPosData.push(radius * x);
			vertPosData.push(radius * y);
			vertPosData.push(radius * z);

			normalData.push(x);
			normalData.push(y);
			normalData.push(z);

			uvData.push(u);
			uvData.push(v);
		}
	}

	var indexData = [];
	for(var band = 0; band < bandCount; ++band)
	{
		for(var strip = 0; strip < stripCount; ++ strip)
		{
			var first = (band * (bandCount + 1)) + strip;
			var second = first + bandCount + 1;
			indexData.push(first);
			indexData.push(second);
			indexData.push(first + 1);

			indexData.push(second);
			indexData.push(second + 1);
			indexData.push(first + 1);
		}
	}

	this.normalBuffer = glContext.createBuffer();
	glContext.bindBuffer(glContext.ARRAY_BUFFER, this.normalBuffer);
	glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(normalData), glContext.STATIC_DRAW);
	this.normalBuffer.itemSize = 3;
	this.normalBuffer.itemCount = normalData.length / 3;

	this.uvBuffer = glContext.createBuffer();
	glContext.bindBuffer(glContext.ARRAY_BUFFER, this.uvBuffer);
	glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(uvData), glContext.STATIC_DRAW);
	this.uvBuffer.itemSize = 2;
	this.uvBuffer.itemCount = uvData.length / 2;

	this.positionBuffer = glContext.createBuffer();
	glContext.bindBuffer(glContext.ARRAY_BUFFER, this.positionBuffer);
	glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(vertPosData), glContext.STATIC_DRAW);
	this.positionBuffer.itemSize = 3;
	this.positionBuffer.itemCount = vertPosData.length / 3;

	this.indexBuffer = glContext.createBuffer();
	glContext.bindBuffer(glContext.ARRAY_BUFFER, this.indexBuffer);
	glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(indexData), glContext.STATIC_DRAW);
	this.indexBuffer.itemSize = 1;
	this.indexBuffer.itemCount = indexData.length;
}
Sphere.prototype = new Mesh();


//----cube mesh type----//
function Cube(length)
{

}
Cube.prototype = new Mesh();