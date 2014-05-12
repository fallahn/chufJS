///////////////////////////////////////////
// webGL shaders 
///////////////////////////////////////////

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

var phongFrag = //TODO make this actually a phong shader
"	precision mediump float;" +

"	void main(void)" +
"	{" +
"		gl_FragColor = vec4(0.0, 0.5, 1.0, 1.0);" +
"	}";

var phongVert = //TODO make this actually a phong shader
"	attribute vec3 vertPos;" +

"	uniform mat4 mvMat;" +
"	uniform mat4 pMat;" +

"	void main(void)" +
"	{" +
"		gl_Position = pMat * mvMat * vec4(vertPos, 1.0);" +
"	}";