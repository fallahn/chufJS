////////////////////////////////
// Creates a cube mesh
////////////////////////////////

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

	//this.vertexData.positionIds.push([0, 13]);
	//this.vertexData.positionIds.push([0, 23]);



	glContext.bufferData(glContext.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), glContext.STATIC_DRAW);
	this.indexBuffer.itemCount = indices.length;
	this.indexBuffer.itemSize = 1;
	this.vertexData.indices = indices;

	this.createNormals(glContext);
}
Cube.prototype = new Mesh();