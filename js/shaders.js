///////////////////////////////////////////
// webGL shaders 
///////////////////////////////////////////
function ShaderProgram()
{
	this.name               = null;
	this.program            = null;
	this.pMatrixLocation    = null;
	this.mvMatrixLocation   = null;
	this.vertexPosAttribute = null;
	//UV coords etc
}

function ShaderManager()
{
	var shaders = [];

	this.getShaderProgram = function(glContext, name)
	{
		//check if shader exists
		for(i = 0; i < shaders.length; ++i)
		{
			if(shaders[i].name == name)
			{
				return shaders[i];
			}
		}

		//create it if it doesn't
		var fragShader;
		var vertShader;
		var newShader = new ShaderProgram();

		switch (name)
		{
		case "phong":
			fragShader = getShader(glContext, phongFrag, "frag");
			vertShader = getShader(glContext, phongVert, "vert");
		break;

		default: return null;
		}
		
		newShader.name = name;
		newShader.program = glContext.createProgram();
		glContext.attachShader(newShader.program, vertShader);
		glContext.attachShader(newShader.program, fragShader);
		glContext.linkProgram(newShader.program);

		if(!glContext.getProgramParameter(newShader.program, glContext.LINK_STATUS))
			alert("Failed to Link Shader Program");

		newShader.vertexPosAttribute = glContext.getAttribLocation(newShader.program, "vertPos");
		glContext.enableVertexAttribArray(newShader.vertexPosAttribute);

		newShader.pMatrixLocation = glContext.getUniformLocation(newShader.program, "pMat");
		newShader.mvMatrixLocation = glContext.getUniformLocation(newShader.program, "mvMat");

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

"	void main(void)",
"	{",
"		gl_FragColor = vec4(0.0, 0.5, 1.0, 1.0);",
"	}"].join("\n");

var phongVert = [//TODO make this actually a phong shader
"	attribute vec3 vertPos;",

"	uniform mat4 mvMat;",
"	uniform mat4 pMat;",

"	void main(void)",
"	{",
"		gl_Position = pMat * mvMat * vec4(vertPos, 1.0);",
"	}"].join("\n");