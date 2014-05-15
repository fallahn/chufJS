function Texture(glContext, name)
{
	var glTexture = glContext.createTexture();
	//bind a temp texture / colour while waiting for image to load
	glContext.bindTexture(glContext.TEXTURE_2D, glTexture);
	glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGBA, 1, 1, 0, glContext.RGBA, glContext.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));
	glContext.bindTexture(glContext.TEXTURE_2D, null);

	var image = new Image();
	image.src = name;	
	image.onload = function()
	{
		glContext.bindTexture(glContext.TEXTURE_2D, glTexture);
		glContext.pixelStorei(glContext.UNPACK_FLIP_Y_WEBGL, true);
		glContext.texImage2D(glContext.TEXTURE_2D, 0, glContext.RGBA, glContext.RGBA, glContext.UNSIGNED_BYTE, image);
		glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MAG_FILTER, glContext.LINEAR);
		//generate mipmaps if possible
		if(isPowTwo(image.width) && isPowTwo(image.height))
		{
			glContext.generateMipmap(glContext.TEXTURE_2D);		
			glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MIN_FILTER, glContext.LINEAR_MIPMAP_LINEAR);
		}
		else
		{
			glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_MIN_FILTER, glContext.LINEAR);
			glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_S, glContext.CLAMP_TO_EDGE);
			glContext.texParameteri(glContext.TEXTURE_2D, glContext.TEXTURE_WRAP_T, glContext.CLAMP_TO_EDGE);
		}

		glContext.bindTexture(glContext.TEXTURE_2D, null);

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
		glContext.bindTexture(glContext.TEXTURE_2D, glTexture);
	}
}

function TextureResource()
{
	var textures = [];

	this.getTexture = function(glContext, textureName)
	{
		//check texture exists
		for(i = 0; i < textures.length; ++i)
		{
			if(textures[i].getName() === textureName)
			{
				return textures[i];
			}
		}

		//else create
		var texture = new Texture(glContext, textureName);
		textures.push(texture);
		return texture;
	}
}