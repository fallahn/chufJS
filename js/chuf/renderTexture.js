////////////////////////////////////////////////////////////////////
// creates an offscreen render target which can be used as a texture
////////////////////////////////////////////////////////////////////

//if depthBuffer true then a depth buffer will be created
function RenderTexture(gl, width, height, createDepthBuffer)
{
	var fbo = gl.createFramebuffer();
	fbo.width = width;
	fbo.height = height;
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

	var fboTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, fboTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	//generate mipmaps if possible
	if(isPowTwo(width) && isPowTwo(height))
	{
		gl.generateMipmap(gl.TEXTURE_2D);		
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	}
	else
	{
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);		
	}
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTexture, 0);	
	gl.bindTexture(gl.TEXTURE_2D, null);

	function isPowTwo(num)
	{
		return (num & (num - 1)) === 0;
	}


	//--------------optional depth attachment-------------//
	this.depthBufferEnabled = createDepthBuffer; //really this should be read-only. silly javascript.
	var renderBuffer = null;
	if(createDepthBuffer)
	{
		renderBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	}
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	this.delete = function()
	{
		gl.deleteTexture(fboTexture);
		if(this.depthBufferEnabled)
			gl.deleteRenderBuffer(renderBuffer);
		gl.deleteFramebuffer(fbo);
	}

	//binds the texture so it can be used on geometry
	this.bind = function()
	{
		//TODO do we want to make sure the fbo is unbound first before attempting to draw with it?
		this.setActive(false);
		gl.bindTexture(gl.TEXTURE_2D, fboTexture);
	}

	//activates as render target
	this.setActive = function(bool) //TODO are we suppose to bind any attachments at the same time?
	{
		if(bool)
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		else
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}
}