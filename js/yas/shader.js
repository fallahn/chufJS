///////////////////////////////////////////
// webGL shaders 
///////////////////////////////////////////
function ShaderProgram(name)
{
	this.name               = name;
	this.program            = null;

	this.pMatrixUniform     = null;
	this.mvMatrixUniform    = null;
	this.nMatrixUniform     = null;
	this.colourMapUniform   = null;
	this.normalMapUniform   = null;
	this.specularMapUniform = null;

	this.vertexPosAttribute = null;
	this.texCoordAttribute  = null;
	this.vertexNormalAttribute = null;
	//TODO make this more flexible with setters for custom shaders
}

function ShaderResource()
{
	var shaders = [];

	this.getShaderProgram = function(glContext, name)
	{
		//check if shader exists
		for(i = 0; i < shaders.length; ++i)
		{
			if(shaders[i].name === name)
			{
				return shaders[i];
			}
		}

		//create it if it doesn't
		var fragShader;
		var vertShader;
		var newShader = new ShaderProgram(name);

		switch (name)
		{
		case "phong":
			fragShader = getShader(glContext, phongFrag, "frag");
			vertShader = getShader(glContext, phongVert, "vert");
		break;
		case "normal":
			//TODO load normal map shader and set shader program unform locations
		break;

		default: return null;
		}
		
		newShader.program = glContext.createProgram();
		glContext.attachShader(newShader.program, vertShader);
		glContext.attachShader(newShader.program, fragShader);
		glContext.linkProgram(newShader.program);

		if(!glContext.getProgramParameter(newShader.program, glContext.LINK_STATUS))
			alert("Failed to Link Shader Program");

		newShader.vertexPosAttribute = glContext.getAttribLocation(newShader.program, "vertPos");
		glContext.enableVertexAttribArray(newShader.vertexPosAttribute);
		newShader.texCoordAttribute = glContext.getAttribLocation(newShader.program, "texCoord");
		glContext.enableVertexAttribArray(newShader.texCoordAttribute);
		newShader.vertexNormalAttribute = glContext.getAttribLocation(newShader.program, "vertNormal");
		glContext.enableVertexAttribArray(newShader.vertexNormalAttribute);

		newShader.pMatrixUniform = glContext.getUniformLocation(newShader.program, "pMat");
		newShader.mvMatrixUniform = glContext.getUniformLocation(newShader.program, "mvMat");
		newShader.nMatrixUniform = glContext.getUniformLocation(newShader.program, "nMat");
		newShader.colourMapUniform = glContext.getUniformLocation(newShader.program, "colourMap");
		//TODO lightpos uniform

		shaders.push(newShader);
		return newShader;

		//----------------------------------------
		function getShader(glContext, str, type)
		{
			var shader;
			if(type == "frag")
			{
				shader = glContext.createShader(glContext.FRAGMENT_SHADER);
			}
			else if(type == "vert")
			{
				shader = glContext.createShader(glContext.VERTEX_SHADER);
			}
			else return null;

			glContext.shaderSource(shader, str);
			glContext.compileShader(shader);

			if(!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS))
			{
				alert(glContext.getShaderInfoLog(shader));
				return null;
			}

			return shader;
		}
	}
}



//--------------------------------------------------------
var phongFrag = [ //TODO finish this
"	precision mediump float;",
"	varying vec2 vTexCoord;",
"	varying vec3 vNormal;",
"	varying vec4 vPosition;",

"	uniform sampler2D colourMap;",
//"	uniform vec3 lightPosition;",

"	vec3 lightPosition = vec3(3.0, 3.0, 3.0);", //TODO make uniforms
"	vec3 lightColour = vec3(1.0, 1.0, 0.9);",

"	void main(void)",
"	{",
"		vec3 lightDir = normalize(lightPosition - vPosition.xyz);",
"		vec3 lightAmount = lightColour * max(dot(normalize(vNormal), lightDir), 0.0);",
"		vec4 colour = texture2D(colourMap, vTexCoord.xy);",
"		gl_FragColor = vec4(colour.rgb * lightAmount, colour.a);",
"	}"].join("\n");

var phongVert = [
"	attribute vec3 vertPos;",
"	attribute vec2 texCoord;",
"	attribute vec3 vertNormal;",

"	uniform mat4 mvMat;",
"	uniform mat4 pMat;",
"	uniform mat3 nMat;",

"	varying vec2 vTexCoord;",
"	varying vec3 vNormal;",
"	varying vec4 vPosition;",

"	void main(void)",
"	{",
"		vPosition = mvMat * vec4(vertPos, 1.0);",
"		gl_Position = pMat * vPosition;",
"		vTexCoord = texCoord;",
"		vNormal = nMat * vertNormal;",
"	}"].join("\n");

//---------------------------------------------------------

var normalFrag = [//TODO make this actually a normal shader
"	precision mediump float;",
"	varying vec2 vTexCoord;",

"	uniform sampler2D colourMap;",

"	void main(void)",
"	{",
"		gl_FragColor = texture2D(colourMap, vTexCoord.xy);",
"	}"].join("\n");

var normalVert = [//TODO make this actually a normal shader
"	attribute vec3 vertPos;",
"	attribute vec2 texCoord;",

"	uniform mat4 mvMat;",
"	uniform mat4 pMat;",

"	varying vec2 vTexCoord;",

"	void main(void)",
"	{",
"		gl_Position = pMat * mvMat * vec4(vertPos, 1.0);",
"		vTexCoord = texCoord;",
"	}"].join("\n");