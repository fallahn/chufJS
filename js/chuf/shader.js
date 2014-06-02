///////////////////////////////////////////
// webGL shaders 
///////////////////////////////////////////

var ShaderName = Object.freeze
({
	PHONG     : 0,
	NORMALMAP : 1,
	DEBUG     : 2,
	SKYBOX    : 3
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
	CMAT        : 2,
	NMAT        : 3,
	//maps
	COLOURMAP   : 4,
	NORMALMAP   : 5,
	SPECULARMAP : 6,
	SKYBOXMAP   : 7
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
			fragShader = getShader(gl, readFile("/js/chuf/glsl/fs_Phong.txt"), ShaderType.FRAGMENT);
			vertShader = getShader(gl, readFile("/js/chuf/glsl/vs_Phong.txt"), ShaderType.VERTEX);
		break;
		case ShaderName.NORMALMAP:
			fragShader = getShader(gl, readFile("/js/chuf/glsl/fs_PhongBump.txt"), ShaderType.FRAGMENT);
			vertShader = getShader(gl, readFile("/js/chuf/glsl/vs_PhongBump.txt"), ShaderType.VERTEX);
		break;
		case ShaderName.DEBUG:
			fragShader = getShader(gl, readFile("/js/chuf/glsl/fs_Debug.txt"), ShaderType.FRAGMENT);
			vertShader = getShader(gl, readFile("/js/chuf/glsl/vs_Debug.txt"), ShaderType.VERTEX);
		break;
		case ShaderName.SKYBOX:
			fragShader = getShader(gl, readFile("/js/chuf/glsl/fs_SkyBox.txt"), ShaderType.FRAGMENT);
			vertShader = getShader(gl, readFile("/js/chuf/glsl/vs_CubeMap.txt"), ShaderType.VERTEX);
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
		//use ajax to read shader files from server
		function readFile(file)
		{
			//NOTE this probably requires the use of .txt as shader source
			//file extension, depending on webserver file permissions.
			var rq = new XMLHttpRequest(); //TODO cross browserise

		    rq.open('GET', file, false);
		    rq.send(null);

		    if (rq.status >= 200 && rq.status < 400)
		    {
		        //TODO file parsing for complex shaders
		        //such as those with pragma directives
		        return rq.responseText;
		    }
		    else
		    {
		    	console.log("Failed to open shader source file " + file + "Error: " + rq.status.toString());
		    }
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
		var cMatUniformLocation  = null;
		var nMatUniformLocation  = null;
		var colourmapUniformLocation   = null;
		var normalmapUniformLocation   = null;
		var specularmapUniformLocation = null;
		var skyboxmapUniformLocation   = null;

		var uniforms = [];
		function getUniformLocation(name)
		{
			//switch block may be unweildy but it replaces string comparison
			//with integer comparison
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
			case ShaderUniform.CMAT:
				if(cMatUniformLocation == null)
					cMatUniformLocation = gl.getUniformLocation(program, "uCMat");
			return cMatUniformLocation;
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
			case ShaderUniform.SKYBOXMAP:
				if(skyboxmapUniformLocation == null)
					skyboxmapUniformLocation = gl.getUniformLocation(program, "uSkyboxMap");
			return skyboxmapUniformLocation;
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