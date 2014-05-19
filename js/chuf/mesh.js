//-----base class for meshes-----//
function Mesh()
{
	this.normalBuffer   = null;
	this.tanBuffer      = null;
	this.bitanBuffer    = null;
	this.uvBuffer       = null;
	this.positionBuffer = null;
	this.indexBuffer    = null;

	this.vertexData = 
	{
		positions : [],
		UVs : [],
		normals : [],
		tangents : [],
		bitangents : [],
		indices : []
	}

	var debugBuffer = null;

	var shaderProgram  = null;
	this.setShader = function(shaderProg)
	{
		shaderProgram = shaderProg;
	}

	var debugShader = null;
	this.setDebugShader = function(shaderProg, glContext)
	{
		debugShader = shaderProg;
		debugBuffer = glContext.createBuffer();
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

	this.draw = function(glContext, matrices)
	{
		glContext.useProgram(shaderProgram.program);

		glContext.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, matrices.mvMatrix);
		glContext.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, matrices.pMatrix);
		var nMatrix = mat3.create();
		mat4.toInverseMat3(matrices.mvMatrix, nMatrix);
		mat3.transpose(nMatrix);
		glContext.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);

		//bind shader attrib buffers - TODO check which need to be bound for current shader
		glContext.bindBuffer(glContext.ARRAY_BUFFER, this.positionBuffer);
		glContext.vertexAttribPointer(shaderProgram.vertexPosAttribute, this.positionBuffer.itemSize, glContext.FLOAT, false, 0, 0);
		
		glContext.bindBuffer(glContext.ARRAY_BUFFER, this.uvBuffer);
		glContext.vertexAttribPointer(shaderProgram.texCoordAttribute, this.uvBuffer.itemSize, glContext.FLOAT, false, 0, 0);

		if(this.normalBuffer)
		{
			glContext.bindBuffer(glContext.ARRAY_BUFFER, this.normalBuffer);
			glContext.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.normalBuffer.itemSize, glContext.FLOAT, false, 0, 0);
			
			if(shaderProgram.name === "normal")
			{
				//bind normal tangents
				glContext.bindBuffer(glContext.ARRAY_BUFFER, this.tanBuffer);
				glContext.vertexAttribPointer(shaderProgram.vertexTanAttribute, this.tanBuffer.itemSize, glContext.FLOAT, false, 0, 0);
				glContext.bindBuffer(glContext.ARRAY_BUFFER, this.bitanBuffer);
				glContext.vertexAttribPointer(shaderProgram.vertexBitanAttribute, this.bitanBuffer.itemSize, glContext.FLOAT, false, 0, 0);
			}
		}

		//check for textures and bind loaded
		if(colourTexture)
		{
			glContext.activeTexture(glContext.TEXTURE0);
			colourTexture.bind();
			glContext.uniform1i(shaderProgram.colourMapUniform, 0);
		}
		if(specularTexture)
		{
			glContext.activeTexture(glContext.TEXTURE1);
			specularTexture.bind();
			glContext.uniform1i(shaderProgram.specularMapUniform, 1);
		}

		if(normalTexture)
		{
			glContext.activeTexture(glContext.TEXTURE2);
			normalTexture.bind();
			glContext.uniform1i(shaderProgram.normalMapUniform, 2);
		}

		//bind element buffer and draw
		glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		glContext.drawElements(glContext.TRIANGLES, this.indexBuffer.itemCount, glContext.UNSIGNED_SHORT, 0);

		//for drawing normals in debug
		var drawNormals = false;
		if(drawNormals)
		{
			glContext.useProgram(debugShader.program);
			glContext.uniformMatrix4fv(debugShader.mvMatrixUniform, false, matrices.mvMatrix);
			glContext.uniformMatrix4fv(debugShader.pMatrixUniform, false, matrices.pMatrix);

			glContext.bindBuffer(glContext.ARRAY_BUFFER, debugBuffer);
			glContext.vertexAttribPointer(debugShader.vertexPosAttribute, 3, glContext.FLOAT, false, 0, 0);

			var red = vec4.create([1.0, 0.0, 0.0, 1.0]);
			var green = vec4.create([0.0, 1.0, 0.0, 1.0]);
			var blue = vec4.create([0.0, 0.0, 1.0, 1.0]);

			var normalLength = 0.2;	

			for(i = 0; i < this.vertexData.normals.length; i+=3)
			{
				//glContext.uniform4fv(colourLocation, red);
				debugShader.setUniformVec4("colour", red);
				var verts = [
					this.vertexData.positions[i],
					this.vertexData.positions[i + 1],
					this.vertexData.positions[i + 2],

					this.vertexData.positions[i] + this.vertexData.normals[i] * normalLength,
					this.vertexData.positions[i + 1] + this.vertexData.normals[i + 1] * normalLength,
					this.vertexData.positions[i + 2] + this.vertexData.normals[i + 2] * normalLength
				];
				glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(verts), glContext.DYNAMIC_DRAW);
				glContext.drawArrays(glContext.LINES, 0, 2);

				debugShader.setUniformVec4("colour", green);
				verts = [
					this.vertexData.positions[i],
					this.vertexData.positions[i + 1],
					this.vertexData.positions[i + 2],

					this.vertexData.positions[i] + this.vertexData.tangents[i] * normalLength,
					this.vertexData.positions[i + 1] + this.vertexData.tangents[i + 1] * normalLength,
					this.vertexData.positions[i + 2] + this.vertexData.tangents[i + 2] * normalLength
				];
				glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(verts), glContext.DYNAMIC_DRAW);
				glContext.drawArrays(glContext.LINES, 0, 2);

				debugShader.setUniformVec4("colour", blue);
				verts = [
					this.vertexData.positions[i],
					this.vertexData.positions[i + 1],
					this.vertexData.positions[i + 2],

					this.vertexData.positions[i] + this.vertexData.bitangents[i] * normalLength,
					this.vertexData.positions[i + 1] + this.vertexData.bitangents[i + 1] * normalLength,
					this.vertexData.positions[i + 2] + this.vertexData.bitangents[i + 2] * normalLength
				];
				glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(verts), glContext.DYNAMIC_DRAW);
				glContext.drawArrays(glContext.LINES, 0, 2);
			}
		}
	}

	this.createNormals = function(glContext)
	{								
		if(!this.positionBuffer || !this.uvBuffer) return;

		var positions = this.vertexData.positions;
		var uvs = this.vertexData.UVs;
		var indices = this.vertexData.indices;

		var normals = this.vertexData.normals;
		var tangents = this.vertexData.tangents;
		var bitangents = this.vertexData.bitangents;

		for(i = 0; i < positions.length; ++i)
		{
			normals.push(0.0);
			tangents.push(0.0);
			bitangents.push(0.0);
		}

		for(i = 0; i < indices.length; i += 3)
		{
			var face = 
			{
				uv0 : vec2.create(),
				uv1 : vec2.create(),
				uv2 : vec2.create(),

				p0 : vec3.create(),
				p1 : vec3.create(),
				p2 : vec3.create(),
				normal : vec3.create()
			}
			//calc face normal
			face.p0 = getVec3(indices[i], positions);
			face.p1 = getVec3(indices[i + 1], positions);
			face.p2 = getVec3(indices[i + 2], positions);

			var deltaPos1 = vec3.create();
			var deltaPos2 = vec3.create();
			vec3.subtract(face.p1, face.p0, deltaPos1);
			vec3.subtract(face.p2, face.p0, deltaPos2);
			vec3.cross(deltaPos1, deltaPos2, face.normal);

			//calc normal tan/bitan
			face.uv0 = getVec2(indices[i], uvs);
			face.uv1 = getVec2(indices[i + 1], uvs);
			face.uv2 = getVec2(indices[i + 2], uvs);

			var deltaUV1 = vec2.create();
			var deltaUV2 = vec2.create();
			vec2.subtract(face.uv1, face.uv0, deltaUV1);
			vec2.subtract(face.uv2, face.uv0, deltaUV2);
			
			var temp1 = vec3.create();
			vec3.scale(deltaPos1, deltaUV2[1], temp1);
			var temp2 = vec3.create();
			vec3.scale(deltaPos2, deltaUV1[1], temp2);
			vec3.subtract(temp1, temp2, temp1);

			var r = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV1[1] * deltaUV2[0]);
			var tangent = vec3.create();
			vec3.scale(temp1, r, tangent);

			vec3.scale(deltaPos2, deltaUV1[0], temp1);
			vec3.scale(deltaPos1, deltaUV2[0], temp2);
			vec3.subtract(temp1, temp2, temp1);

			var bitangent = vec3.create();
			vec3.scale(temp1, r, bitangent);

			//calc weight and output normal vecs
			var vertPositions = [face.p0, face.p1, face.p2];
			for(j = 0; j < vertPositions.length; j++)
			{

				var a = vec3.create();
				vec3.subtract(vertPositions[(j + 1) % 3], vertPositions[j], a);
				var b = vec3.create();
				vec3.subtract(vertPositions[(j + 2) % 3], vertPositions[j], b);
				var weight = Math.acos(vec3.dot(a, b) / (vec3.length(a) * vec3.length(b)));

				var newNormal = vec3.create();
				vec3.scale(face.normal, weight, newNormal);
				var currIndex = indices[i + j];
				addVec3(currIndex, normals, newNormal);
				addVec3(currIndex, tangents, tangent);
				addVec3(currIndex, bitangents, bitangent);
			}

			//TODO sum and normalise normals of shared vertices
		}

		//normalise all 3 arrays
		for(i = 0; i < this.positionBuffer.itemCount; i++)
		{
			var n = getVec3(i, normals);
			vec3.normalize(n, n);
			setVec3(i, normals, n);
		
			var t = getVec3(i, tangents);
			vec3.normalize(t, t);
			setVec3(i, tangents, t);
		
			var b = getVec3(i, bitangents);
			vec3.normalize(b, b);
			setVec3(i, bitangents, b);
		}

		//create normal buffers
		this.normalBuffer = glContext.createBuffer();
		glContext.bindBuffer(glContext.ARRAY_BUFFER, this.normalBuffer);
		glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(normals), glContext.STATIC_DRAW);
		this.normalBuffer.itemSize = 3;
		this.normalBuffer.itemCount = normals.length / 3;

		this.tanBuffer = glContext.createBuffer();
		glContext.bindBuffer(glContext.ARRAY_BUFFER, this.tanBuffer);
		glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(tangents), glContext.STATIC_DRAW);
		this.tanBuffer.itemSize = 3;
		this.tanBuffer.itemCount = tangents.length / 3;

		this.bitanBuffer = glContext.createBuffer();
		glContext.bindBuffer(glContext.ARRAY_BUFFER, this.bitanBuffer);
		glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(bitangents), glContext.STATIC_DRAW);
		this.bitanBuffer.itemSize = 3;
		this.bitanBuffer.itemCount = bitangents.length / 3;
	}

	function getVec2(index, array)
	{
		var offset = index * 2;
		var vec = vec2.create();
		vec[0] = array[offset];
		vec[1] = array[offset + 1];
		return vec;
	}

	function getVec3(index, array)
	{
		var offset = index * 3;
		var vec = vec3.create();
		vec[0] = array[offset];
		vec[1] = array[offset + 1];
		vec[2] = array[offset + 2];
		return vec;
	}

	function addVec3(index, array, value)
	{
		var offset = index * 3;
		array[offset] += value[0];
		array[offset + 1] += value[1];
		array[offset + 2] += value[2];
	}

	function setVec3(index, array, value)
	{
		var offset = index * 3;
		array[offset] = value[0];
		array[offset + 1] = value[1];
		array[offset + 2] = value[2];
	}
}

//TODO create a mesh resource so meshes can easily be attached to multiple nodes
//and mesh ctor is encapsulated


//----sphere mesh type----//
function Sphere(glContext, radius)
{
	var bandCount = 16;
	var stripCount = 16;

	var vertPosData = this.vertexData.positions;
	var uvData = this.vertexData.UVs;

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

			var y = cosTheta;
			var x = sinPhi * sinTheta;
			var z = cosPhi * sinTheta;			
			var u = (strip / stripCount) + 0.5;
			var v = 1 - (band / bandCount);

			vertPosData.push(radius * x);
			vertPosData.push(radius * y);
			vertPosData.push(radius * z);

			uvData.push(u);
			uvData.push(v);
		}
	}

	var indexData = this.vertexData.indices;
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

	this.createNormals(glContext);
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
		 length, -length, -length,
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
	this.vertexData.positions = verts;

	//tex coords
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
	this.vertexData.UVs = uvCoords;

	this.indexBuffer = glContext.createBuffer();
	glContext.bindBuffer(glContext.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	var indices = [
		 0,  1,  2,   0,  2,  3,
		 4,  5,  6,   4,  6,  7,
		 8,  9, 10,   8, 10, 11,
		12, 13, 14,  12, 14, 15,
		16, 17, 18,  16, 18, 19,
		20, 21, 22,  20, 22, 23
	];
	glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), glContext.STATIC_DRAW);
	this.indexBuffer.itemCount = indices.length;
	this.indexBuffer.itemSize = 1;
	this.vertexData.indices = indices;

	this.createNormals(glContext);
}
Cube.prototype = new Mesh();