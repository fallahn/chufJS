//-----base class for meshes-----//
function Mesh()
{
	this.normalBuffer   = null;
	this.uvBuffer       = null;
	this.positionBuffer = null;
	this.indexBuffer    = null;

	var shaderProgram  = null;
	this.setShader = function(shaderProg)
	{
		shaderProgram = shaderProg;
	}

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
		glContext.useProgram(shaderProgram.program);

		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, [position.x, position.y, position.z]);
		mat4.rotate(mvMatrix, rotation.y, [0, 1, 0]);
		mat4.rotate(mvMatrix, rotation.z, [0, 0, 1]);
		mat4.rotate(mvMatrix, rotation.x, [1, 0, 0]);
		mat4.scale(mvMatrix, [scale.x, scale.y, scale.z]);

		glContext.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
		glContext.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);

		//bind shader attrib buffers - TODO check which need to be bound for current shader
		glContext.bindBuffer(glContext.ARRAY_BUFFER, this.positionBuffer);
		glContext.vertexAttribPointer(shaderProgram.vertexPosAttribute, this.positionBuffer.itemSize, glContext.FLOAT, false, 0, 0);
		
		glContext.bindBuffer(glContext.ARRAY_BUFFER, this.uvBuffer);
		glContext.vertexAttribPointer(shaderProgram.texCoordAttribute, this.uvBuffer.itemSize, glContext.FLOAT, false, 0, 0);

		//check for textures and bind loaded
		if(colourTexture != null)
		{
			glContext.activeTexture(glContext.TEXTURE0);
			colourTexture.bind();
			glContext.uniform1i(shaderProgram.colourMapUniform, 0);
		}

		//bind element buffer and draw
		glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		glContext.drawElements(glContext.TRIANGLES, this.indexBuffer.itemCount, glContext.UNSIGNED_SHORT, 0);
	}	
}




//----sphere mesh type----//
function Sphere(glContext, radius)
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
	glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), glContext.STATIC_DRAW);
	this.indexBuffer.itemSize = 1;
	this.indexBuffer.itemCount = indexData.length;
}
Sphere.prototype = new Mesh();


//----cube mesh type----//
function Cube(glContext, length)
{
	length /= 2; //origin about centre
	this.positionBuffer = glContext.createBuffer();
	glContext.bindBuffer(glContext.ARRAY_BUFFER, this.positionBuffer);
	var verts = [
		//f0
		-length, -length,  length,
		 length, -length,  length,
		 length,  length,  length,
		-length,  length,  length,
		//f1
		-length, -length, -length,
		-length,  length, -length,
		 length,  length, -length,
		 length, -length, -length
		//f2
		-length,  length, -length,
		-length,  length,  length,
		 length,  length,  length,
		 length,  length, -length,
		//f3
		-length, -length, -length,
		 length, -length, -length,
		 length, -length,  length,
		-length, -length,  length,
		//f4
		 length, -length, -length,
		 length,  length, -length,
		 length,  length,  length,
		 length, -length,  length,
		//f5
		-length, -length, -length,
		-length, -length,  length,
		-length,  length,  length,
		-length,  length, -length
	];
	glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(verts), glContext.STATIC_DRAW);
	this.positionBuffer.itemSize = 3;
	this.positionBuffer.itemCount = verts.length / 3;

	//TODO normal data

	this.uvBuffer = glContext.createBuffer();
	glContext.bindBuffer(glContext.ARRAY_BUFFER, this.uvBuffer);
	var uvCoords = [
		//f0
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		//f1
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0,
		//f2
		0.0, 1.0,
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		//f3
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0,
		1.0, 0.0,
		//f4
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0,
		//f5
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0
	];
	glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(uvCoords), glContext.STATIC_DRAW);
	this.uvBuffer.itemSize = 2;
	this.uvBuffer.itemCount = uvCoords.length / 2;

	this.indexBuffer = glContext.createBuffer();
	glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	var indices = [
		 0,  1,  2,   0,  2,  3,
		 4,  5,  6,   4,  6,  7,
		 8,  9, 10,   8, 10, 11,
		12, 13, 14,  12, 14, 15,
		16, 17, 18,  16, 18, 19,
		20, 21, 22,  21, 22, 23
	];
	glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), glContext.STATIC_DRAW);
	this.indexBuffer.itemCount = indices.length;
	this.indexBuffer.itemSize = 1;
}
Cube.prototype = new Mesh();