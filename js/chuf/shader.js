///////////////////////////////////////////
// webGL shaders 
///////////////////////////////////////////

var ShaderName = Object.freeze
({
	PHONG     : 0,
	NORMALMAP : 1,
	DEBUG     : 2
})

var ShaderType = Object.freeze
({
	VERTEX    : 0,
	FRAGMENT  : 1
})

var ShaderAttribute = Object.freeze
({
	POSITION  : 0,
	TEXCOORD  : 1,
	NORMAL    : 2,
	TANGENT   : 3,
	BITANGENT : 4,
	COLOUR    : 5
})

var ShaderUniform = Object.freeze
({
	//matrices
	PMAT        : 0,
	MVMAT       : 1,
	NMAT        : 2,
	//maps
	COLOURMAP   : 3,
	NORMALMAP   : 4,
	SPECULARMAP : 5
})

function ShaderResource()
{
	var shaders = [];
	var activeProgram = null;
	this.getActiveProgram = function()
	{
		return activeProgram;
	}

	this.clear = function(gl)
	{
		for(var h = 0; h < shaders.length; ++h)
			gl.deleteProgram(shaders[h].getShaderProgram());
		
		while(shaders.length) shaders.pop();
	}

	this.getShaderProgram = function(gl, shaderName)
	{
		//check if shader exists
		for(var i = 0; i < shaders.length; ++i)
		{
			if(shaders[i].shaderName === shaderName)
			{
				return shaders[i];
			}
		}

		//create it if it doesn't
		var fragShader;
		var vertShader;
		var newShader = new ShaderProgram(shaderName, gl);

		switch (shaderName)
		{
		case ShaderName.PHONG:
			fragShader = getShader(gl, phongFrag, ShaderType.FRAGMENT);
			vertShader = getShader(gl, phongVert, ShaderType.VERTEX);
		break;
		case ShaderName.NORMALMAP:
			fragShader = getShader(gl, normalFrag, ShaderType.FRAGMENT);
			vertShader = getShader(gl, normalVert, ShaderType.VERTEX);
		break;
		case ShaderName.DEBUG:
			fragShader = getShader(gl, debugFrag, ShaderType.FRAGMENT);
			vertShader = getShader(gl, debugVert, ShaderType.VERTEX);
		break;
		default:
		//TODO allow for custom shaders
			console.log("unable to find shader");
		return null;
		}
		
		newShader.setProgram(gl.createProgram());
		gl.attachShader(newShader.getProgram(), vertShader);
		gl.attachShader(newShader.getProgram(), fragShader);
		gl.linkProgram(newShader.getProgram());

		if(!gl.getProgramParameter(newShader.getProgram(), gl.LINK_STATUS))
		{
			alert("Failed to Link Shader Program");
			return null;
		}

		shaders.push(newShader);
		return newShader;

		//----------------------------------------
		function getShader(gl, str, type)
		{
			var shader;
			if(type == ShaderType.FRAGMENT)
			{
				shader = gl.createShader(gl.FRAGMENT_SHADER);
			}
			else if(type == ShaderType.VERTEX)
			{
				shader = gl.createShader(gl.VERTEX_SHADER);
			}
			else
			{
				console.log("failed to get shader of type " + type);
				return null;
			}

			gl.shaderSource(shader, str);
			gl.compileShader(shader);

			if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
			{
				alert(gl.getShaderInfoLog(shader));
				return null;
			}

			return shader;
		}
	}

	//----------------------------------------
	function ShaderProgram(shadername, gl)
	{
		this.shaderName = shadername;

		var vertexPositionAttribute  = null;
		var vertexColourAttribute    = null;	
		var vertexTexCoordAttribute  = null;
		var vertexNormalAttribute    = null;
		var vertexTangentAttribute   = null;
		var vertexBitangentAttribute = null;	
		this.getAttribute = function(name)
		{
			switch(name)
			{
			case ShaderAttribute.POSITION:
				if(vertexPositionAttribute == null)
					vertexPositionAttribute = fetchAttribute("aPosition");
				return vertexPositionAttribute;
			case ShaderAttribute.COLOUR:
				if(vertexColourAttribute == null)
					vertexColourAttribute = fetchAttribute("aColour");
				return vertexColourAttribute;
			case ShaderAttribute.TEXCOORD:
				if(vertexTexCoordAttribute == null)
					vertexTexCoordAttribute = fetchAttribute("aTexCoord");
				return vertexTexCoordAttribute;
			case ShaderAttribute.NORMAL:
				if(vertexNormalAttribute == null)
					vertexNormalAttribute = fetchAttribute("aNormal");
				return vertexNormalAttribute;
			case ShaderAttribute.TANGENT:
				if(vertexTangentAttribute == null)
					vertexTangentAttribute = fetchAttribute("aTan");
				return vertexTangentAttribute;
			case ShaderAttribute.BITANGENT:
				if(vertexBitangentAttribute == null)
					vertexBitangentAttribute = fetchAttribute("aBitan");
				return vertexBitangentAttribute;
			default:
				console.log("WARNING: requested shader attribute not found");
			return -1;
			}
		}
		function fetchAttribute(name)
		{
			var attribute = gl.getAttribLocation(program, name);
			if(attribute != -1)
				gl.enableVertexAttribArray(attribute);
			return attribute;
		}

		var program = null;
		this.setProgram = function(prog)
		{
			program = prog;
		}
		this.getProgram = function()
		{
			return program;
		}

		var pMatUniformLocation  = null;
		var mvMatUniformLocation = null;
		var nMatUniformLocation  = null;
		var colourmapUniformLocation   = null;
		var normalmapUniformLocation   = null;
		var specularmapUniformLocation = null;

		var uniforms = [];
		function getUniformLocation(name)
		{
			//switch block may be unweildy but it replaces string comparison
			//with integer commparison
			switch(name)
			{
			case ShaderUniform.PMAT:
				if(pMatUniformLocation == null)
					pMatUniformLocation = gl.getUniformLocation(program, "uPMat");
			return pMatUniformLocation;
			case ShaderUniform.MVMAT:
				if(mvMatUniformLocation == null)
					mvMatUniformLocation = gl.getUniformLocation(program, "uMVMat");
			return mvMatUniformLocation;
			case ShaderUniform.NMAT:
				if(nMatUniformLocation == null)
					nMatUniformLocation = gl.getUniformLocation(program, "uNMat");
			return nMatUniformLocation;
			case ShaderUniform.COLOURMAP:
				if(colourmapUniformLocation == null)
					colourmapUniformLocation = gl.getUniformLocation(program, "uColourMap");
			return colourmapUniformLocation;
			case ShaderUniform.NORMALMAP:
				if(normalmapUniformLocation == null)
					normalmapUniformLocation = gl.getUniformLocation(program, "uNormalMap");
			return normalmapUniformLocation;
			case ShaderUniform.SPECULARMAP:
				if(specularmapUniformLocation == null)
					specularmapUniformLocation = gl.getUniformLocation(program, "uSpecularMap");
			return specularmapUniformLocation;
			default:
				console.log("unable to find shader uniform");
			return -1;
			}
		}

		this.setUniformVec2 = function(name, value)
		{
			gl.useProgram(program);
			var location = getUniformLocation(name);
			if(location != -1)
				gl.uniform2fv(location, value);
			gl.useProgram(activeProgram);
		}

		this.setUniformVec3 = function(name, value)
		{
			gl.useProgram(program);
			var location = getUniformLocation(name);
			if(location != -1)
				gl.uniform3fv(location, value);
			gl.useProgram(activeProgram);
		}

		this.setUniformVec4 = function(name, value)
		{
			gl.useProgram(program);
			var location = getUniformLocation(name);
			if(location != -1)
				gl.uniform4fv(location, value);
			gl.useProgram(activeProgram);
		}

		this.setUniformMat3 = function(name, value)
		{
			gl.useProgram(program);
			var location = getUniformLocation(name);
			if(location != -1)
				gl.uniformMatrix3fv(location, false, value);
			gl.useProgram(activeProgram);
		}

		this.setUniformMat4 = function(name, value)
		{
			gl.useProgram(program);
			var location = getUniformLocation(name);
			if(location)
				gl.uniformMatrix4fv(location, false, value);
			gl.useProgram(activeProgram);
		}

		var textures = [];
		this.setUniformTexture = function(name, value)
		{
			var location = getUniformLocation(name);
			if(location != -1) //TODO check available texture units
			{
				for(var i = 0; i < textures.length; ++i)
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
			for(var i = 0; i < textures.length; ++i)
			{
				gl.activeTexture(gl.TEXTURE0 + i);
				textures[i][1].bind();
				gl.uniform1i(textures[i][0], i);
			}
		}

		this.bind = function()
		{
			gl.useProgram(program);
			activeProgram = program;
			bindTextures();
		}
	}	
}
//TODO move shader strings into own files

//--------------------------------------------------------
var debugFrag = [
"	precision mediump float;",
"	varying vec4 vColour;",
"	void main()",
"	{",
"		gl_FragColor = vColour;",
"	}"].join("\n");

var debugVert = [
"	attribute vec3 aPosition;",
"	attribute vec4 aColour;",
"	varying vec4 vColour;",
"	uniform mat4 uMVMat;",
"	uniform mat4 uPMat;",
"	void main()",
"	{",
"		gl_Position = uPMat * uMVMat * vec4(aPosition, 1.0);",
"		vColour = aColour;",
"	}"].join("\n");


//--------------------------------------------------------
var phongFrag = [
"	precision mediump float;",
"	varying vec2 vTexCoord;",
"	varying vec3 vNormal;",
"	varying vec4 vPosition;",

"	uniform sampler2D uColourMap;",
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

"		vec4 diffuseColour = texture2D(uColourMap, vTexCoord.xy);",
"		vec3 finalColour = ambientColour + (diffuseColour.rgb * diffuseAmount) + (specularColour * specAmount);",

"		gl_FragColor = vec4(finalColour, diffuseColour.a);",
"	}"].join("\n");

var phongVert = [
"	attribute vec3 aPosition;",
"	attribute vec2 aTexCoord;",
"	attribute vec3 aNormal;",

"	uniform mat4 uMVMat;",
"	uniform mat4 uPMat;",
"	uniform mat3 uNMat;",

"	varying vec2 vTexCoord;",
"	varying vec3 vNormal;",
"	varying vec4 vPosition;",

"	void main(void)",
"	{",
"		vPosition = uMVMat * vec4(aPosition, 1.0);",
"		gl_Position = uPMat * vPosition;",
"		vTexCoord = aTexCoord;",
"		vNormal = uNMat * aNormal;",
"	}"].join("\n");

//---------------------------------------------------------

var normalFrag = [
"	precision mediump float;",
"	varying vec2 vTexCoord;",
"	varying vec3 vLightVec;",
"	varying vec3 vEyeVec;",


"	uniform sampler2D uColourMap;",
"	uniform sampler2D uSpecularMap;",
"	uniform sampler2D uNormalMap;",
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
"		vec4 baseColour = texture2D(uColourMap, vTexCoord.xy);",
"		vec3 bump = normalize(texture2D(uNormalMap, vTexCoord.xy).xyz * 2.0 - 1.0);",

"		vec3 lightDir = normalize(vLightVec);",
"		vec3 eyeDir = normalize(vEyeVec);",
"		vec3 reflectDir = reflect(-lightDir, bump);",

"		float specAmount = pow(max(dot(reflectDir, eyeDir), 0.0), shininess) * texture2D(uSpecularMap, vTexCoord.xy).r;",
"		float diffuseAmount = max(dot(bump, lightDir), 0.0);",

"		vec3 finalColour = ambientColour + (baseColour.rgb * diffuseAmount) + (specularColour * specAmount);",

"		gl_FragColor = vec4(finalColour, baseColour.a);",

"	}"].join("\n");

var normalVert = [
"	attribute vec3 aPosition;",
"	attribute vec2 aTexCoord;",
"	attribute vec3 aNormal;",
"	attribute vec3 aTan;",
"	attribute vec3 aBitan;",

"	uniform mat4 uMVMat;",
"	uniform mat4 uPMat;",
"	uniform mat3 uNMat;",

"	varying vec3 vLightVec;",
"	varying vec3 vEyeVec;",
"	varying vec2 vTexCoord;",

"	vec3 lightPosition = vec3(8.0, 8.0, 3.0);", //TODO make this a uniform

"	void main(void)",
"	{",
"		vec4 viewVert = uMVMat * vec4(aPosition, 1.0);",
"		gl_Position = uPMat * viewVert;",
"		vTexCoord = aTexCoord;",

"		vec3 n = normalize(uNMat * aNormal);",
"		vec3 t = normalize(uNMat * aTan);",
"		vec3 b = normalize(uNMat * aBitan);",

"		vec3 temp = lightPosition - viewVert.xyz;",
"		vLightVec.x = dot(temp, t);",
"		vLightVec.y = dot(temp, b);",
"		vLightVec.z = dot(temp, n);",

"		temp = -viewVert.xyz;",
"		vEyeVec.x = dot(temp, t);",
"		vEyeVec.y = dot(temp, b);",
"		vEyeVec.z = dot(temp, n);",

"	}"].join("\n");