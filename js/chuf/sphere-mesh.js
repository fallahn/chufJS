///////////////////////////
// Creates a sphere mesh
///////////////////////////

//----sphere mesh type----//
function Sphere(glContext, radius)
{
	var bandCount = 14; //these only work if they are both the same
	var stripCount = 14;

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

			//console.log(x, y, z);

			uvData.push(u);
			uvData.push(v);
		}
	}

	var indexData = this.vertexData.indices;
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
				this.vertexData.positionIds.push([last, last - stripCount]);
		}
	}
	//else if band is 0 or bandCount - 1 then all at top or bottom position
	for(i = 1; i <=stripCount; ++i) //TODO this doesn't work correctly
	{
		this.vertexData.positionIds.push([0, i]);
		this.vertexData.positionIds.push([indexData.length - stripCount, indexData.length - (stripCount - i)]);
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