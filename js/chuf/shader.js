///////////////////////////////////////////
// webGL shaders 
///////////////////////////////////////////

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
			fragShader = getShader(glContext, normalFrag, "frag");
			vertShader = getShader(glContext, normalVert, "vert");
		break;
		case "debug":
			fragShader = getShader(glContext, debugFrag, "frag");
			vertShader = getShader(glContext, debugVert, "vert");
		break;
		default: return null;
		}
		
		newShader.program = glContext.createProgram();
		glContext.attachShader(newShader.program, vertShader);
		glContext.attachShader(newShader.program, fragShader);
		glContext.linkProgram(newShader.program);

		if(!glContext.getProgramParameter(newShader.program, glContext.LINK_STATUS))
			alert("Failed to Link Shader Program");

		//TODO refactor into own function for getting shader attribs, more flexible for custom shaders
		newShader.vertexPosAttribute = glContext.getAttribLocation(newShader.program, "vertPos");
		glContext.enableVertexAttribArray(newShader.vertexPosAttribute);
		
		newShader.pMatrixUniform = glContext.getUniformLocation(newShader.program, "pMat");
		newShader.mvMatrixUniform = glContext.getUniformLocation(newShader.program, "mvMat");

		if(name != "debug")
		{
			newShader.texCoordAttribute = glContext.getAttribLocation(newShader.program, "texCoord");
			glContext.enableVertexAttribArray(newShader.texCoordAttribute);
			newShader.vertexNormalAttribute = glContext.getAttribLocation(newShader.program, "vertNormal");
			glContext.enableVertexAttribArray(newShader.vertexNormalAttribute);
			
			newShader.nMatrixUniform = glContext.getUniformLocation(newShader.program, "nMat");
			newShader.colourMapUniform = glContext.getUniformLocation(newShader.program, "colourMap");

			if(name === "normal")
			{
			//	newShader.vertexTanAttribute = glContext.getAttribLocation(newShader.program, "vertTan");
			//	glContext.enableVertexAttribArray(newShader.vertexTanAttribute);
			//	newShader.vertexBitanAttribute = glContext.getAttribLocation(newShader.program, "vertBitan");
			//	glContext.enableVertexAttribArray(newShader.vertexBitanAttribute);

				newShader.specularMapUniform = glContext.getUniformLocation(newShader.program, "specularMap");
			}
		}

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

	//----------------------------------------
	function ShaderProgram(name)
	{
		this.name                  = name;
		this.program               = null;

		this.pMatrixUniform        = null;
		this.mvMatrixUniform       = null;
		this.nMatrixUniform        = null;
		this.colourMapUniform      = null;
		this.normalMapUniform      = null;
		this.specularMapUniform    = null;

		this.vertexPosAttribute    = null;
		this.texCoordAttribute     = null;
		this.vertexNormalAttribute = null;
		this.vertexTanAttribute    = null;
		this.vertexBitanAttribute  = null;
		//TODO make this more flexible with setters for custom shaders
	}	
}


//--------------------------------------------------------
var debugFrag = [
"	precision mediump float;",
"	uniform vec4 colour;",
"	void main()",
"	{",
"		gl_FragColor = colour;",
"	}"].join("\n");

var debugVert = [
"	attribute vec3 vertPos;",
"	uniform mat4 mvMat;",
"	uniform mat4 pMat;",
"	void main()",
"	{",
"		gl_Position = pMat * mvMat * vec4(vertPos, 1.0);",
"	}"].join("\n");


//--------------------------------------------------------
var phongFrag = [ //TODO finish this
"	precision mediump float;",
"	varying vec2 vTexCoord;",
"	varying vec3 vNormal;",
"	varying vec4 vPosition;",

"	uniform sampler2D colourMap;",
//"	uniform vec3 lightPosition;",

"	vec3 lightPosition = vec3(8.0, 8.0, 3.0);", //TODO make uniforms
"	vec3 ambientColour = vec3(0.05, 0.05, 0.05);",
"	vec3 specularColour = vec3(1.0, 1.0, 1.0);",
"	float shininess = 128.0;", //0 - 255

"	void main(void)",
"	{",
"		vec3 lightDir = normalize(lightPosition - vPosition.xyz);",
"		vec3 normal = normalize(vNormal);",
"		vec3 eyeDir = normalize(-vPosition.xyz);",
"		vec3 reflectDir = reflect(-lightDir, normal);",
"		float specAmount = pow(max(dot(reflectDir, eyeDir), 0.0), shininess);",
"		float diffuseAmount = max(dot(normal, lightDir), 0.0);",
"		vec4 diffuseColour = texture2D(colourMap, vTexCoord.xy);",
"		vec3 lightAmount = ambientColour + (diffuseColour.rgb * diffuseAmount) + (specularColour * specAmount);",

"		gl_FragColor = vec4(diffuseColour.rgb * lightAmount, diffuseColour.a);",
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
"	varying vec3 vNormal;",
"	varying vec4 vPosition;",

"	uniform sampler2D colourMap;",
"	uniform sampler2D specularMap;",
//"	uniform vec3 lightPosition;",

"	vec3 lightPosition = vec3(8.0, 8.0, 3.0);", //TODO make uniforms
"	vec3 diffuseColour = vec3(0.9, 0.9, 0.9);",
"	vec3 ambientColour = vec3(0.01, 0.01, 0.05);",
"	vec3 specularColour = vec3(1.0, 1.0, 1.0);",

"	void main(void)",
"	{",
"		vec3 lightDir = normalize(lightPosition - vPosition.xyz);",
"		vec3 normal = normalize(vNormal);",
"		vec3 eyeDir = normalize(-vPosition.xyz);",
"		vec3 reflectDir = reflect(-lightDir, normal);",
"		float specAmount = pow(max(dot(reflectDir, eyeDir), 0.0), 120.0);",//" (texture2D(specularMap, vTexCoord.xy).r * 255.0));",
"		float diffuseAmount = max(dot(normal, lightDir), 0.0);",
"		vec3 lightAmount = ambientColour + (specularColour * specAmount) + (diffuseColour * diffuseAmount);",

"		vec4 colour = texture2D(colourMap, vTexCoord.xy);",
"		gl_FragColor = vec4(colour.rgb * lightAmount, colour.a);",
"	}"].join("\n");

var normalVert = [//TODO make this actually a normal shader
"	attribute vec3 vertPos;",
"	attribute vec2 texCoord;",
"	attribute vec3 vertNormal;",
"	attribute vec3 vertTan;",
"	attribute vec3 vertBitan;",

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