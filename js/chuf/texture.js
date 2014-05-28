var TextureType = Object.freeze
({
	DIFFUSE  : 0,
	NORMAL   : 1,
	SPECULAR : 2
})

function TextureResource()
{
	var textures = [];

	this.getTexture = function(gl, textureName)
	{
		//check texture exists
		for(var i = 0; i < textures.length; ++i)
		{
			if(textures[i].getName() === textureName)
			{
				return textures[i];
			}
		}

		//else create
		var texture = new Texture(gl, textureName);
		textures.push(texture);
		return texture;
	}

	this.clear = function(gl)
	{
		for(var i = 0; i < textures.length; ++i)
			textures[i].delete();

		while(textures.length) textures.pop();
	}

	//---------------------------------------------------------//
	function Texture(gl, name)
	{
		var glTexture = gl.createTexture();
		//bind a temp texture / colour while waiting for image to load
		gl.bindTexture(gl.TEXTURE_2D, glTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));
		gl.bindTexture(gl.TEXTURE_2D, null);

		var image = new Image();
		image.src = name;	
		image.onload = function()
		{
			gl.bindTexture(gl.TEXTURE_2D, glTexture);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			//generate mipmaps if possible
			if(isPowTwo(image.width) && isPowTwo(image.height))
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

			gl.bindTexture(gl.TEXTURE_2D, null);

			function isPowTwo(num)
			{
				return (num & (num - 1)) === 0;
			}
		}

		this.getName = function()
		{
			return image.src.name;
		}

		this.bind = function()
		{
			gl.bindTexture(gl.TEXTURE_2D, glTexture);
		}

		this.delete = function()
		{
			gl.deleteTexture(glTexture);
		}
	}
}