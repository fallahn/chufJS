////////////////////////////////////////////////////////////////////
// creates an offscreen render target which can be used as a texture
////////////////////////////////////////////////////////////////////

var TargetType = Object.freeze
({
	TEXTURE_2D : 0,
	CUBEMAP    : 1
});

//if depthBuffer true then a depth buffer will be created
function RenderTexture(gl, width, height, createDepthBuffer, targetType)
{
	this.width = width;
	this.height = height;	

	//-----frame buffer generation------//
	var fbo = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

	var fboTexture = gl.createTexture();

	if(targetType === TargetType.TEXTURE_2D)
	{
		gl.bindTexture(gl.TEXTURE_2D, fboTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);		

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTexture, 0);	
		gl.bindTexture(gl.TEXTURE_2D, null);

	}
	else if(targetType === TargetType.CUBEMAP)
	{
		if(width !== height) console.log("WARNING: cubemap textures have non-square texture size.");

		gl.bindTexture(gl.TEXTURE_CUBE_MAP, fboTexture);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		for(var f = 0; f < 6; ++f)
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
	}

	//--------------optional depth attachment-------------//
	this.depthBufferEnabled = createDepthBuffer; //really this should be read-only. silly javascript.
	var renderBuffer = null;
	if(createDepthBuffer)
	{
		renderBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
	}	
	var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
	if (e !== gl.FRAMEBUFFER_COMPLETE) console.log("Framebuffer object is incomplete: " + e.toString());

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	this.delete = function()
	{
		gl.deleteTexture(fboTexture);
		if(this.depthBufferEnabled)
			gl.deleteRenderBuffer(renderBuffer);

		gl.deleteFramebuffer(fbo);
	}

	//binds the texture
	this.bind = function()
	{
		this.setActive(false);
		switch(targetType)
		{
		case TargetType.TEXTURE_2D:
			gl.bindTexture(gl.TEXTURE_2D, fboTexture);
			break;
		case TargetType.CUBEMAP:
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, fboTexture);
			break;
		}
	}

	//activates as render target
	this.setActive = function(bool, index)
	{
		if(bool)
		{
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

			if(index !== undefined)
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + index, fboTexture, 0);
		}
		else
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}
}