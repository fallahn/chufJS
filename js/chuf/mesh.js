//TODO this file is huge, but javascript has no way of including external files by default.
var MeshType = Object.freeze
({
	OBJ : 0,
	MD2 : 1
})


function MeshResource()
{
	var meshes = [];

	this.clear = function(gl)
	{
		for(var h = 0; h < meshes.length; ++h)
			meshes[h].delete();
		
		while(meshes.length) meshes.pop();
	}

	this.loadMeshFromFile = function(path, type)
	{
		console.log("External mesh loaders are currently unimplemented");

		var mesh  = existingMesh(path);
		if(mesh) return mesh;

		switch(type)
		{
			case MeshType.OBJ:
			break;
			case MeshTyp.MD2:
			break;
			default: break;
		}
	}

	this.getSphere = function(gl, diameter)
	{
		var name = "sphere" + diameter.toString();
		var mesh = existingMesh(name);
		if(mesh) return mesh;

		mesh = new Mesh(gl, sphere(diameter));
		meshes.push([name, mesh]);
		return mesh;
	}

	this.getCube = function(gl, width)
	{
		var name = "cube" + width.toString();
		var mesh = existingMesh(name);
		if(mesh) return mesh;

		mesh = new Mesh(gl, cube(width));
		meshes.push([name, mesh]);
		return mesh;
	}

	function existingMesh(name)
	{
		for(var i = 0; i < meshes.length; ++i)
		{
			if(meshes[i][0] === name)
			{
				return meshes[i][1];
			}
		}
		return null;
	}


	function VertexData()
	{
		this.positions   = [];
		this.uvs         = [];
		this.indices     = [];
		this.positionIds = []; //vert's index and index of vert it clones position of
	}

	//-----base class for meshes-----//
	function Mesh(gl, vertexData)
	{
		var vertexBuffer   = null;
		var indexBuffer    = null;
		var normalBuffer   = null;		
		var debugBuffer    = null;	

		var vertexArray = [];
		var u, v;
		for(u = 0, v = 0; v < vertexData.positions.length; u += 2, v += 3)
		{
			vertexArray.push(vertexData.positions[v]);
			vertexArray.push(vertexData.positions[v + 1]);
			vertexArray.push(vertexData.positions[v + 2]);
			vertexArray.push(vertexData.uvs[u]);
			vertexArray.push(vertexData.uvs[u + 1]);
			//TODO add vert colour here?
		}
		vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
		vertexBuffer.itemCount = vertexData.positions.length / 3;

		indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexData.indices), gl.STATIC_DRAW);
		indexBuffer.itemSize = 1;
		indexBuffer.itemCount = vertexData.indices.length;

		//-----------------calculate normal data for mesh, and interleave into own buffer--------------------------------
		var positions  = vertexData.positions;
		var uvs        = vertexData.uvs;
		var indices    = vertexData.indices;

		var normals    = [];
		var tangents   = [];
		var bitangents = [];
		//TODO interleave arrays from outset
		for(var i = 0; i < positions.length; ++i)
		{
			normals.push(0.0);
			tangents.push(0.0);
			bitangents.push(0.0);
		}

		for(var i = 0; i < indices.length; i += 3)
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
			for(var j = 0; j < vertPositions.length; j++)
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
		}

		//sum and normals of duplicated vertex positions
		var dupIds       = vertexData.positionIds;
		var accumulatorN = [];
		var accumulatorB = [];
		var accumulatorT = [];
		for(var i = 0; i < dupIds.length; i++)
		{
			var exists = false;
			for(var j = 0; j < accumulatorN.length; ++j)
			{
				if(accumulatorN[j][0] === dupIds[i][0])
				{
					vec3.add(accumulatorN[j][1], getVec3(dupIds[i][1], normals), accumulatorN[j][1]);
					vec3.add(accumulatorB[j][1], getVec3(dupIds[i][1], bitangents), accumulatorB[j][1]);
					vec3.add(accumulatorT[j][1], getVec3(dupIds[i][1], tangents), accumulatorT[j][1]);
					exists = true;
					break;
				}
			}
			if(!exists)
			{
				var sum = vec3.create();
				vec3.add(getVec3(dupIds[i][0], normals), getVec3(dupIds[i][1], normals), sum);
				accumulatorN.push([dupIds[i][0], sum]);

				sum = vec3.create();
				vec3.add(getVec3(dupIds[i][0], bitangents), getVec3(dupIds[i][1], bitangents), sum);
				accumulatorB.push([dupIds[i][0], sum]);

				sum = vec3.create();
				vec3.add(getVec3(dupIds[i][0], tangents), getVec3(dupIds[i][1], tangents), sum);
				accumulatorT.push([dupIds[i][0], sum]);
			}

		}
		//set each to accumulated value
		for(var i = 0; i < dupIds.length; i++)
		{
			for(var j = 0; j < accumulatorN.length; ++j)
			{
				setVec3(accumulatorN[j][0], normals, accumulatorN[j][1]);
				setVec3(accumulatorB[j][0], bitangents, accumulatorB[j][1]);
				setVec3(accumulatorT[j][0], tangents, accumulatorT[j][1]);
				if(dupIds[i][0] === accumulatorN[j][0])
				{
					setVec3(dupIds[i][1], normals, accumulatorN[j][1]);
					setVec3(dupIds[i][1], bitangents, accumulatorB[j][1]);
					setVec3(dupIds[i][1], tangents, accumulatorT[j][1]);
					break;
				}
			}
		}

		//normalise all 3 arrays
		for(var i = 0; i < positions.length / 3; i++)
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

		//create normal buffer
		var interleaved = [];
		for(var i = 0; i < normals.length; i+=3)
		{
			interleaved.push(normals[i]);
			interleaved.push(normals[i + 1]);
			interleaved.push(normals[i + 2]);

			interleaved.push(tangents[i]);
			interleaved.push(tangents[i + 1]);
			interleaved.push(tangents[i + 2]);

			interleaved.push(bitangents[i]);
			interleaved.push(bitangents[i + 1]);
			interleaved.push(bitangents[i + 2]);
		}
		normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(interleaved), gl.STATIC_DRAW);
		normalBuffer.itemSize = 3;
		normalBuffer.itemCount = normals.length / 3;

		//buffer for drawing debug data
		//pack position / colout for N, T and B repectively
		var debugData    = [];
		var normalLength = 0.1;
		var red          = vec4.create([1.0, 0.0, 0.0, 1.0]);
		var green        = vec4.create([0.0, 1.0, 0.0, 1.0]);
		var blue         = vec4.create([0.0, 0.0, 1.0, 1.0]);
		for(var i = 0; i < positions.length; i+=3)
		{
			debugData.push(positions[i]);
			debugData.push(positions[i + 1]);
			debugData.push(positions[i + 2]);
			debugData.push(red[0]);
			debugData.push(red[1]);
			debugData.push(red[2]);
			debugData.push(red[3]);

			debugData.push(positions[i] + normals[i] * normalLength);
			debugData.push(positions[i + 1] + normals[i + 1] * normalLength);
			debugData.push(positions[i + 2] + normals[i + 2] * normalLength);
			debugData.push(red[0]);
			debugData.push(red[1]);
			debugData.push(red[2]);
			debugData.push(red[3]);				

			debugData.push(positions[i]);
			debugData.push(positions[i + 1]);
			debugData.push(positions[i + 2]);
			debugData.push(green[0]);
			debugData.push(green[1]);
			debugData.push(green[2]);
			debugData.push(green[3]);

			debugData.push(positions[i] + tangents[i] * normalLength);
			debugData.push(positions[i + 1] + tangents[i + 1] * normalLength);
			debugData.push(positions[i + 2] + tangents[i + 2] * normalLength);
			debugData.push(green[0]);
			debugData.push(green[1]);
			debugData.push(green[2]);
			debugData.push(green[3]);				

			debugData.push(positions[i]);
			debugData.push(positions[i + 1]);
			debugData.push(positions[i + 2]);
			debugData.push(blue[0]);
			debugData.push(blue[1]);
			debugData.push(blue[2]);
			debugData.push(blue[3]);

			debugData.push(positions[i] + bitangents[i] * normalLength);
			debugData.push(positions[i + 1] + bitangents[i + 1] * normalLength);
			debugData.push(positions[i + 2] + bitangents[i + 2] * normalLength);
			debugData.push(blue[0]);
			debugData.push(blue[1]);
			debugData.push(blue[2]);
			debugData.push(blue[3]);	
		}
		debugBuffer = gl.createBuffer();
		debugBuffer.itemCount = (positions.length / 3) * 6;
		gl.bindBuffer(gl.ARRAY_BUFFER, debugBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(debugData), gl.STATIC_DRAW);


//------------------------------------------------------------------------------------
		var shaderProgram  = null;
		this.setShader = function(shaderProg)
		{
			shaderProgram = shaderProg;
		}

		var debugShader = null;
		this.setDebugShader = function(shaderProg)
		{
			debugShader = shaderProg;
		}

		var colourTexture   = null;
		var normalTexture   = null;
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

		var nMatrix = mat3.create();
		this.draw = function(matrices)
		{
			//bind shader attrib buffers - TODO check and warn if not exist
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
			gl.vertexAttribPointer(shaderProgram.getAttribute(ShaderAttribute.POSITION), 3, gl.FLOAT, false, 20, 0);
			//gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
			gl.vertexAttribPointer(shaderProgram.getAttribute(ShaderAttribute.TEXCOORD), 2, gl.FLOAT, false, 20, 12);

			if(normalBuffer)
			{
				gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
				gl.vertexAttribPointer(shaderProgram.getAttribute(ShaderAttribute.NORMAL), normalBuffer.itemSize, gl.FLOAT, false, 36, 0);

				if(shaderProgram.shaderName === ShaderName.NORMALMAP)
				{
					//bind normal tangents
					gl.vertexAttribPointer(shaderProgram.getAttribute(ShaderAttribute.TANGENT), normalBuffer.itemSize, gl.FLOAT, false, 36, 12);
					gl.vertexAttribPointer(shaderProgram.getAttribute(ShaderAttribute.BITANGENT), normalBuffer.itemSize, gl.FLOAT, false, 36, 24);
				}
			}			

			//set shader uniforms
			if(colourTexture)
			{
				shaderProgram.setUniformTexture(ShaderUniform.COLOURMAP, colourTexture);
			}
			if(specularTexture)
			{
				shaderProgram.setUniformTexture(ShaderUniform.SPECULARMAP, specularTexture);
			}

			if(normalTexture)
			{
				shaderProgram.setUniformTexture(ShaderUniform.NORMALMAP, normalTexture);
			}		
			
			shaderProgram.setUniformMat4(ShaderUniform.MVMAT, matrices.mvMatrix);
			shaderProgram.setUniformMat4(ShaderUniform.PMAT, matrices.pMatrix);
			
			mat4.toInverseMat3(matrices.mvMatrix, nMatrix);
			mat3.transpose(nMatrix);
			shaderProgram.setUniformMat3(ShaderUniform.NMAT, nMatrix);

			//bind element buffer and draw
			shaderProgram.bind();			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
			gl.drawElements(gl.TRIANGLES, indexBuffer.itemCount, gl.UNSIGNED_SHORT, 0);

			//for drawing normals in debug
			var drawNormals = true;
			if(drawNormals && debugShader)
			{
				debugShader.bind();
				debugShader.setUniformMat4(ShaderUniform.MVMAT, matrices.mvMatrix);
				debugShader.setUniformMat4(ShaderUniform.PMAT, matrices.pMatrix);

				gl.bindBuffer(gl.ARRAY_BUFFER, debugBuffer);
				gl.vertexAttribPointer(debugShader.getAttribute(ShaderAttribute.POSITION), 3, gl.FLOAT, false, 28, 0);
				gl.vertexAttribPointer(debugShader.getAttribute(ShaderAttribute.COLOUR), 4, gl.FLOAT, false, 28, 12);
				gl.drawArrays(gl.LINES, 0, debugBuffer.itemCount);
			}

			//console.log(shaderProgram.shaderName);
		}

		this.delete = function()
		{
			gl.deleteBuffer(normalBuffer);
			normalBuffer = null;
			gl.deleteBuffer(vertexBuffer);
			vertexBuffer = null;
			gl.deleteBuffer(indexBuffer);
			indexBuffer = null;
			gl.deleteBuffer(debugBuffer);
			debugBuffer = null;
		}



		//---------------------------------------
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


	//----sphere mesh type----//
	function sphere(radius)
	{
		var bandCount = 14; //these only work if they are both the same
		var stripCount = 14;

		var vertexData = new VertexData();
		var vertPosData = vertexData.positions;
		var uvData = vertexData.uvs;

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

				//console.log(x, y, z);

				uvData.push(u);
				uvData.push(v);
			}
		}

		var indexData = vertexData.indices;
		for(var band = 0; band < bandCount; band++)
		{
			for(var strip = 0; strip < stripCount; strip++)
			{
				var first = (band * (bandCount + 1)) + strip;
				var second = first + bandCount + 1;

				var last = bandCount * (band + 1) + band;

				//these should be wound *anti* clockwise
				indexData.push(first);			
				indexData.push(second);
				indexData.push(first + 1);

				indexData.push(second);
				indexData.push(second + 1);
				indexData.push(first + 1);

				//if last index added is (bandCount * (band + 1) + band)
				//then it shares position with index - stripCount
				if(band > 0 && ((first + 1) === last))
					vertexData.positionIds.push([last, last - stripCount]);
			}
		}
		//else if band is 0 or bandCount - 1 then all at top or bottom position
		for(var i = 1; i <=stripCount; ++i) //TODO this doesn't work correctly
		{
			vertexData.positionIds.push([0, i]);
			vertexData.positionIds.push([indexData.length - stripCount, indexData.length - (stripCount - i)]);
		}
		return vertexData;
	}


	//----cube mesh type----//
	function cube(length)
	{
		var vertexData = new VertexData();

		length /= 2; //origin about centre
		vertexData.positions =
		[
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

		vertexData.uvs = 
		[
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

		vertexData.indices =
		[
			 0,  1,  2,   0,  2,  3,
			 4,  5,  6,   4,  6,  7,
			 8,  9, 10,   8, 10, 11,
			12, 13, 14,  12, 14, 15,
			16, 17, 18,  16, 18, 19,
			20, 21, 22,  20, 22, 23
		];

		return vertexData;
	}
}