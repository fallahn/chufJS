///////////////////////////////////////////
// webGL shaders 
///////////////////////////////////////////

function ShaderResource()
{
	this.Type = Object.freeze
	({
		PHONG  : 0,
		NORMAL : 1,
		DEBUG  : 2
	})

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
		var newShader = new ShaderProgram(name, glContext);

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
		default:
			console.log("unable to find shader of type " + name);
		return null;
		}
		
		newShader.setProgram(glContext.createProgram());
		glContext.attachShader(newShader.getProgram(), vertShader);
		glContext.attachShader(newShader.getProgram(), fragShader);
		glContext.linkProgram(newShader.getProgram());

		if(!glContext.getProgramParameter(newShader.getProgram(), glContext.LINK_STATUS))
			alert("Failed to Link Shader Program");

		//TODO refactor into own function for getting shader attribs, more flexible for custom shaders
		newShader.vertexPosAttribute = glContext.getAttribLocation(newShader.getProgram(), "vertPos");
		glContext.enableVertexAttribArray(newShader.vertexPosAttribute);
		
		newShader.pMatrixUniform = glContext.getUniformLocation(newShader.getProgram(), "pMat");
		newShader.mvMatrixUniform = glContext.getUniformLocation(newShader.getProgram(), "mvMat");

		if(name != "debug")
		{
			newShader.texCoordAttribute = glContext.getAttribLocation(newShader.getProgram(), "texCoord");
			glContext.enableVertexAttribArray(newShader.texCoordAttribute);
			newShader.vertexNormalAttribute = glContext.getAttribLocation(newShader.getProgram(), "vertNormal");
			glContext.enableVertexAttribArray(newShader.vertexNormalAttribute);
			
			newShader.nMatrixUniform = glContext.getUniformLocation(newShader.getProgram(), "nMat");
			newShader.colourMapUniform = glContext.getUniformLocation(newShader.getProgram(), "colourMap");

			if(name === "normal")
			{
				newShader.vertexTanAttribute = glContext.getAttribLocation(newShader.getProgram(), "vertTan");
				glContext.enableVertexAttribArray(newShader.vertexTanAttribute);
				newShader.vertexBitanAttribute = glContext.getAttribLocation(newShader.getProgram(), "vertBitan");
				glContext.enableVertexAttribArray(newShader.vertexBitanAttribute);

				newShader.specularMapUniform = glContext.getUniformLocation(newShader.getProgram(), "specularMap");
				newShader.normalMapUniform = glContext.getUniformLocation(newShader.getProgram(), "normalMap");
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
			else
			{
				console.log("failed to get shader of type " + type);
				return null;
			}

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
	function ShaderProgram(name, glContext)
	{
		this.name                  = name;

		this.colourMapUniform      = null;
		this.normalMapUniform      = null;
		this.specularMapUniform    = null;

		this.vertexPosAttribute    = null;
		this.texCoordAttribute     = null;
		this.vertexNormalAttribute = null;
		this.vertexTanAttribute    = null;
		this.vertexBitanAttribute  = null;

		var prog = null;
		this.setProgram = function(program)
		{
			prog = program;
		}
		this.getProgram = function(program)
		{
			return prog;
		}
		
		var uniformLocations = [];
		function getUniformLocation(name)
		{
			//TODO need a faster find method
			for(i = 0; i < uniformLocations.length; ++i)
			{
				if(uniformLocations[i][0] === name)
					return uniformLocations[i][1];
			}
			var location = glContext.getUniformLocation(prog, name);
			if(location)
			{
				uniformLocations.push([name, location]);
				return location;
			}
			else
			{
				console.log(name + " not found in shader " + this.name);
				return null;
			}
		}

		this.setUniformVec2 = function(name, value)
		{
			var location = getUniformLocation(name);
			if(location)
				glContext.uniform2fv(location, value);
		}

		this.setUniformVec3 = function(name, value)
		{
			var location = getUniformLocation(name);
			if(location)
				glContext.uniform3fv(location, value);
		}

		this.setUniformVec4 = function(name, value)
		{
			var location = getUniformLocation(name);
			if(location)
				glContext.uniform4fv(location, value);
		}

		this.setUniformMat3 = function(name, value)
		{
			var location = getUniformLocation(name);
			if(location)
				glContext.uniformMatrix3fv(location, false, value);
		}

		this.setUniformMat4 = function(name, value)
		{
			var location = getUniformLocation(name);
			if(location)
				glContext.uniformMatrix4fv(location, false, value);
		}

		var textures = [];
		this.setUniformTexture = function(name, value)
		{
			var location = getUniformLocation(name);
			if(location) //TODO check available texture units
			{
				for(i = 0; i < textures.length; ++i)
				{
					if(textures[i][0] == location)
					{
						textures[i][1] = value;
						return;
					}
				}
				textures.push([location, value]);
			}
		}
		function bindTextures()
		{
			for(i = 0; i < textures.length; ++i)
			{
				glContext.activeTexture(glContext.TEXTURE0 + i);
				textures[i][1].bind();
				glContext.uniform1i(textures[i][0], i);
			}
		}

		this.bind = function()
		{
			glContext.useProgram(prog);
			bindTextures();
		}
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
"		vec3 finalColour = ambientColour + (diffuseColour.rgb * diffuseAmount) + (specularColour * specAmount);",

"		gl_FragColor = vec4(finalColour, diffuseColour.a);",
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
"	varying vec3 vLightVec;",
"	varying vec3 vEyeVec;",


"	uniform sampler2D colourMap;",
"	uniform sampler2D specularMap;",
"	uniform sampler2D normalMap;",
//TODO make light params uniforms
"	vec3 diffuseColour = vec3(0.8, 0.8, 0.8);",
"	vec3 ambientColour = vec3(0.01, 0.01, 0.01);",
"	vec3 specularColour = vec3(1.0, 1.0, 1.0);",
"	float shininess = 200.0;",

/*
"	void main(void)",
"	{",
"		vec4 baseColour = texture2D(colourMap, vTexCoord.xy);",
//TODO mask map lookup

"		vec3 bump = normalize(texture2D(normalMap, vTexCoord.xy).xyz * 2.0 - 1.0);",
"		vec3 lVec = normalize(vLightVec);",
"		vec3 eVec = normalize(vEyeVec);",
"		vec3 R = reflect(-lVec, bump);",
//hemispherical shadow model
"		float multiplier = dot(bump, -lVec);", 
"		multiplier = multiplier * 0.5 + 0.5;",
"		vec3 finalColour = mix(baseColour.rgb, ambientColour, multiplier);",
//specular calc
"		float colourIntensity = max(dot(bump, lVec), 0.0);",
"		vec3 spec = vec3(0.0);",
"		vec3 diff = vec3(0.0);",
"		float specMultiplier = texture2D(specularMap, vTexCoord.xy).r;", //can we move this to normal alpha channel?
//we could also save a little bit by only looking up the spec value if it is needed
"		if(colourIntensity > 0.0)",
"		{",
"			float specAmount = pow(clamp(dot(R, eVec), 0.0, 1.0), shininess) * specMultiplier;",
"			spec += specularColour * specAmount;",
"			diff += diffuseColour * finalColour * colourIntensity;",
"		}",
//"		finalColour.a = baseColour.a;",
"		gl_FragColor = vec4(clamp(finalColour + spec + diff, 0.0, 1.0), baseColour.a);",
*/

"	void main(void)",
"	{",
"		vec4 baseColour = texture2D(colourMap, vTexCoord.xy);",
"		vec3 bump = normalize(texture2D(normalMap, vTexCoord.xy).xyz * 2.0 - 1.0);",

"		vec3 lightDir = normalize(vLightVec);",
"		vec3 eyeDir = normalize(vEyeVec);",
"		vec3 reflectDir = reflect(-lightDir, bump);",

"		float specAmount = pow(max(dot(reflectDir, eyeDir), 0.0), shininess) * texture2D(specularMap, vTexCoord.xy).r;",
"		float diffuseAmount = max(dot(bump, lightDir), 0.0);",

"		vec3 finalColour = ambientColour + (baseColour.rgb * diffuseAmount) + (specularColour * specAmount);",

"		gl_FragColor = vec4(finalColour, baseColour.a);",

"	}"].join("\n");

var normalVert = [
"	attribute vec3 vertPos;",
"	attribute vec2 texCoord;",
"	attribute vec3 vertNormal;",
"	attribute vec3 vertTan;",
"	attribute vec3 vertBitan;",

"	uniform mat4 mvMat;",
"	uniform mat4 pMat;",
"	uniform mat3 nMat;",

"	varying vec3 vLightVec;",
"	varying vec3 vEyeVec;",
"	varying vec2 vTexCoord;",

"	vec3 lightPosition = vec3(8.0, 8.0, 3.0);", //TODO make this a uniform

"	void main(void)",
"	{",
"		vec4 viewVert = mvMat * vec4(vertPos, 1.0);",
"		gl_Position = pMat * viewVert;",
"		vTexCoord = texCoord;",

"		vec3 n = normalize(nMat * vertNormal);",
"		vec3 t = normalize(nMat * vertTan);",
"		vec3 b = normalize(nMat * vertBitan);",

"		vec3 temp = lightPosition - viewVert.xyz;",
"		vLightVec.x = dot(temp, t);",
"		vLightVec.y = dot(temp, b);",
"		vLightVec.z = dot(temp, n);",

"		temp = -viewVert.xyz;",
"		vEyeVec.x = dot(temp, t);",
"		vEyeVec.y = dot(temp, b);",
"		vEyeVec.z = dot(temp, n);",

"	}"].join("\n");