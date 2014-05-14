///////////////////////////////////////////
// webGL shaders 
///////////////////////////////////////////
function ShaderProgram(name)
{
	this.name               = name;
	this.program            = null;

	this.pMatrixUniform     = null;
	this.mvMatrixUniform    = null;
	this.colourMapUniform   = null;
	this.normalMapUniform   = null;
	this.specularMapUniform = null;

	this.vertexPosAttribute = null;
	this.texCoordAttribute  = null;
}

function ShaderManager()
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

		newShader.pMatrixUniform = glContext.getUniformLocation(newShader.program, "pMat");
		newShader.mvMatrixUniform = glContext.getUniformLocation(newShader.program, "mvMat");
		newShader.colourMapUniform = glContext.getUniformLocation(newShader.program, "colourMap");

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




var phongFrag = [//TODO make this actually a phong shader
"	precision mediump float;",
"	varying vec2 vTexCoord;",

"	uniform sampler2D colourMap;",

"	void main(void)",
"	{",
"		gl_FragColor = texture2D(colourMap, vTexCoord.xy);",
"	}"].join("\n");

var phongVert = [//TODO make this actually a phong shader
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