var TextureType = Object.freeze
({
	DIFFUSE  : 0,
	NORMAL   : 1,
	SPECULAR : 2,
	SKYBOX   : 3
})

function TextureResource()
{
	var textures = [];
	var cubeMaps = [];

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

	this.getCubeMap = function(gl, pathArray) //array of paths to images, +x, -x, +y, -y, +z, -z
	{
		for(var i = 0; i < cubeMaps.length; ++i)
		{
			if(cubeMaps[i].getName === pathArray[0])
				return cubeMaps[i];
		}

		var cubeMap = new CubeMap(gl, pathArray);
		cubeMaps.push(cubeMap);
		return cubeMap;
	}

	this.clear = function()
	{
		for(var i = 0; i < textures.length; ++i)
			textures[i].delete();

		while(textures.length) textures.pop();

		for(var i = 0; i < cubeMaps.length; ++i)
			cubeMaps[i].delete();

		while(cubeMaps.length) cubeMaps.pop();
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

	//---------------------------------------------------------//
	function CubeMap(gl, imageArray) //must contain paths to 6 images, +x, -x, +y, -y, +z, -z
	{
		var glTexture = gl.createTexture();
		//TODO create temp texture while loading?

		gl.bindTexture(gl.TEXTURE_CUBE_MAP, glTexture);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		var faces = [gl.TEXTURE_CUBE_MAP_POSITIVE_X,
					gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
					gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
					gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
					gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
					gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]

		for(var s = 0; s < 6; ++s)
		{
			//create temp texture data while images load
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, glTexture);
			gl.texImage2D(faces[s], 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

			var img = new Image();
			img.src = imageArray[s];	

			var face = faces[s];
			img.onload = function(texture, face, img)
			{
				return function()
				{
					gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
					gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
					gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
					gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
				}
			}(glTexture, face, img);
		}
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
		
		var name = imageArray[0];
		this.getName = function()
		{
			return name;
		}

		this.bind = function()
		{
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, glTexture);
		}

		this.delete = function()
		{
			gl.deleteTexture(glTexture);
		}
	}
}