/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 
 http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */


var Stage = {};
Stage.scaleFactor = 1.0;

var Mouse = {};
Mouse.x = 0;
Mouse.y = 0;

Mouse.isTouchSupported = "ontouchstart" in window;
Mouse.START = Mouse.isTouchSupported ? "touchstart" : "mousedown";
Mouse.MOVE = Mouse.isTouchSupported ? "touchmove" : "mousemove";
Mouse.END = Mouse.isTouchSupported ? "touchend" : "mouseup";
	
Mouse.get = function(event, elem){
	if (elem == undefined){
		elem = document.body;
	}
	
	var isTouch = false;
	
	// touch screen events
	if (event.touches){
		if (event.touches.length){
			isTouch = true;
			Mouse.x = parseInt(event.touches[0].pageX);
			Mouse.y = parseInt(event.touches[0].pageY);
		}
	}else{
		// mouse events
		Mouse.x = parseInt(event.clientX);
		Mouse.y = parseInt(event.clientY);
	}
	
	// accounts for border
	Mouse.x -= elem.clientLeft;
	Mouse.y -= elem.clientTop;

	// parent offsets
	var par = elem;
	while (par !== null) {
		if (isTouch){
			// touch events offset scrolling with pageX/Y
			// so scroll offset not needed for them
			Mouse.x -= parseInt(par.offsetLeft);
			Mouse.y -= parseInt(par.offsetTop);
		}else{
			Mouse.x += parseInt(par.scrollLeft - par.offsetLeft);
			Mouse.y += parseInt(par.scrollTop - par.offsetTop);
		}

		par = par.offsetParent || null;
	}

	Mouse.x /= Stage.scaleFactor;
	Mouse.y /= Stage.scaleFactor;

	return Mouse;
}



var TextureAtlas = {
	textures:{},
	images:{}
};

TextureAtlas.getSubTextureByName = function(id, name){
	var textures = TextureAtlas.textures[id];
	if (textures == null){
		return null;
	}
	
	var subTextures = textures.SubTexture;
	var i = 0;
	var n = subTextures.length;
	for (i=0; i<n; i++){
		if (subTextures[i].name == name){
			return subTextures[i];
		}
	}
	
	return null;
};

TextureAtlas.getSubTexturesByPrefix = function(id, prefix){
	var result = [];
	var textures = TextureAtlas.textures[id];
	if (textures == null){
		return result;
	}
	
	var prefLen = prefix.length;
	var subTextures = textures.SubTexture;
	var subTexture = null;
	var i = 0;
	var n = subTextures.length;
	for (i=0; i<n; i++){
		subTexture = subTextures[i];
		if (subTexture.name && subTexture.name.substring(0, prefLen) == prefix){
			result.push(subTexture);
		}
	}
	
	return result;
};

TextureAtlas.getImage = function(src){
	return TextureAtlas.images[src];
}

TextureAtlas.addImage = function(image, src){
	TextureAtlas.images[src] = image;
}


function rad2deg(rad){
	return rad / Math.PI * 180.0;            
}
function deg2rad(deg){
	return deg / 180.0 * Math.PI;   
}

	
function Rect(x,y,w,h){
	this.x = x;
	this.y = y;
	this.width = w;
	this.height = h;
}
Rect.prototype.toString = function(){
	return "(" + this.x + "," + this.y
	 + "; " + this.width + "x" + this.height + ")";
}
Rect.prototype.top = function(){
	return this.y;
}
Rect.prototype.bottom = function(){
	return this.y + this.height;
}
Rect.prototype.left = function(){
	return this.x;
}
Rect.prototype.right = function(){
	return this.x + this.width;
}


function Matrix(a,b,c,d,tx,ty){
	this.a = a || 1;
	this.b = b || 0;
	this.c = c || 0;
	this.d = d || 1;
	this.tx = tx || 0;
	this.ty = ty || 0;
}

Matrix.temp = new Matrix();

Matrix.prototype.clone = function(){
	return new Matrix(this.a, this.b, this.c, this.d, this.tx, this.ty);
};

Matrix.prototype.copyFrom = function(m){
	this.a  = m.a;
	this.b  = m.b;
	this.c  = m.c;
	this.d  = m.d;
	this.tx = m.tx;
	this.ty = m.ty;
};

Matrix.prototype.identity = function(){
	this.a = 1;
	this.b = 0;
	this.c = 0;
	this.d = 1;
	this.tx = 0;
	this.ty = 0;
};

Matrix.prototype.rotate = function(angle){
	var u = (angle == 0) ? 1 : Math.cos(angle); // android bug may give bad 0 values
	var v = (angle == 0) ? 0 : Math.sin(angle);
	
	var result_a = u * this.a  - v * this.b;
	var result_b = v * this.a  + u * this.b;
	var result_c = u * this.c  - v * this.d;
	var result_d = v * this.c  + u * this.d;
	var result_tx = u * this.tx - v * this.ty;
	var result_ty = v * this.tx + u * this.ty;
	
	this.a  = result_a;
	this.b  = result_b;
	this.c  = result_c;
	this.d  = result_d;
	this.tx = result_tx;
	this.ty = result_ty;
};

Matrix.prototype.translate = function(x, y){
	this.tx += x;
	this.ty += y;
};

Matrix.prototype.scale = function(x, y) {
	this.a *= x;
	this.b *= y;
	this.c *= x;
	this.d *= y;
	this.tx *= x;
	this.ty *= y;
};

Matrix.prototype.concat = function(m){
	// Multiply the common terms
	var result_a = this.a * m.a;
	var result_b = 0.0;
	var result_c = 0.0;
	var result_d = this.d * m.d;
	var result_tx = this.tx * m.a + m.tx;
	var result_ty = this.ty * m.d + m.ty;
	
	// Include the less common terms
	if (this.b != 0.0 || this.c != 0.0 || m.b != 0.0 || m.c != 0.0) {
		result_a  += this.b * m.c;
		result_d  += this.c * m.b;
		result_b  += this.a * m.b + this.b * m.d;
		result_c  += this.c * m.a + this.d * m.c;
		result_tx += this.ty * m.c;
		result_ty += this.tx * m.b;
	}
	
	this.a  = result_a;
	this.b  = result_b;
	this.c  = result_c;
	this.d  = result_d;
	this.tx = result_tx;
	this.ty = result_ty;
}

function Sprite(){
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;
	this.rotation = 0;
	this.visible = true;
	this.children = [];
	this.parent = null;
	this.matrix = new Matrix();
}

Sprite.prototype.updateDisplayList = function(context, isRoot){
	if (!this.visible){
		return;
	}
	
	// update display list transform matrix 
	// to be referenced by children
	this.matrix.identity();
	this.matrix.rotate(this.rotation);
	this.matrix.translate(this.x, this.y);
	
	if (this.parent){
		this.matrix.concat(this.parent.matrix);
	}
	
	// perform draw/paint to screen
	this.paint(context);
	
	// update children
	var i = 0;
	var n = this.children.length;
	for (i=0; i<n; i++){
		this.children[i].updateDisplayList(context, false);
	}
}

Sprite.prototype.paint = function(context){
	// TODO: draw something into ctx here for Sprite? Or just a container?
}

Sprite.prototype.addChild = function(child){
	if (child.parent){
		child.parent.removeChild(child);
	}
	this.children.push(child);
	child.parent = this;
}

Sprite.prototype.removeChild = function(child){
	var i = 0;
	var n = this.children.length;
	for (i=0; i<n; i++){
		if (child == this.children[i]){
			this.children.splice(i, 1);
			child.parent = null;
			break;
		}
	}
}

function MovieClip(textures, fps){
	MovieClip.prototype._super.call(this);
	
	this.frame = 0; // goto frame
	this.frames = [];
	this.fps = fps || 30;
	this.frame = 0;
	this.startTime = new Date().getTime();
	
	if (textures){
		var i = 0;
		var n = textures.length;
		for (i=0; i<n; i++){
			this.addSubTexture(textures[i]);
		}
	}
}
MovieClip.prototype = new Sprite();
MovieClip.prototype._super = Sprite;
MovieClip.prototype.constructor = MovieClip;

MovieClip.prototype.play = function(){
	this.frame = 0;
}

MovieClip.prototype.gotoAndStop = function(frame){
	if (frame < 1){
		this.frame = 1;
	}else{
		var lastFrame = this.frames.length - 1;
		if (frame > lastFrame){
			this.frame = lastFrame;
		}else{
			this.frame = frame;
		}
	}
}

MovieClip.prototype.getFrame = function(){
	if (this.frame){
		// goto and stopped at this frame
		return this.frame;
	}
	
	// playing frames
	var totalTime = new Date().getTime() - this.startTime;
	var frames = Math.floor(this.fps * (totalTime ? totalTime/1000 : 0));
	return frames % this.frames.length;
}

MovieClip.prototype.addSubTexture = function(subTexture){
	this.frames.push(subTexture);
	this.width = subTexture.frameWidth || subTexture.width;
	this.height = subTexture.frameHeight || subTexture.height;
}

MovieClip.prototype.paint = function(context){
	if (this.frames.length){
		var subTexture = this.frames[this.getFrame()];
		if (subTexture){
			subTexture.paint(context, this.matrix);
		}
	}
	MovieClip.prototype._super.prototype.paint.call(this, context);
}

function TextureImage(subTexture){
	TextureImage.prototype._super.call(this);
	
	this.width = 0;
	this.height = 0;
	this.subTexture = subTexture;
	
	this.updateDimensions();
}

TextureImage.prototype = new Sprite();
TextureImage.prototype._super = Sprite;
TextureImage.prototype.constructor = TextureImage;

TextureImage.prototype.updateDimensions = function(){
	if (this.subTexture){
		this.width = this.subTexture.frameWidth || this.subTexture.width;
		this.height = this.subTexture.frameHeight || this.subTexture.height;
	}else{
		this.width = 0;
		this.height = 0;
	}
}
TextureImage.prototype.paint = function(context){
	if (this.subTexture){
		this.subTexture.paint(context, this.matrix);
	}
	TextureImage.prototype._super.prototype.paint.call(this, context);
}

function SubTexture(imageRef, jsonItem){
	this.image = imageRef;
	this.name = "";
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;
	this.frameX = 0;
	this.frameY = 0;
	this.frameWidth = 0;
	this.frameHeight = 0;
	
	if (jsonItem){
		this.defineFromJSON(jsonItem);
	}
}

SubTexture.fromList = function(imageRef, texs){
	var result = [];
	var i = 0;
	var n = texs.length;
	for (i=0; i<n; i++){
		result.push(new SubTexture(imageRef, texs[i]));
	}
	return result;
}
SubTexture.prototype.toString = function(){
	return "[SubTexture name=\""+this.name+"\", x="+this.x+", y="+this.y+", w="+this.width+", h="+this.height+"]";
}
SubTexture.prototype.attributes = [
	"name",
	"x","y","width","height",
	"frameX","frameY","frameWidth","frameHeight"
];

SubTexture.prototype.defineFromJSON = function(item){
	var i = 0;
	var n = this.attributes.length;
	var att = "";
	for (i=0; i<n; i++){
		att = this.attributes[i];
		if (att in item){
			this[att] = item[att];
		}
	}
}

SubTexture.prototype.paint = function(context, m){

	if (Stage.scaleFactor !== 1.0){
		Matrix.temp.copyFrom(m);
		m = Matrix.temp;
		m.scale(Stage.scaleFactor, Stage.scaleFactor);
	}

	context.setTransform(m.a,m.b,m.c,m.d, m.tx,m.ty);
	context.drawImage(this.image,							// source
		this.x,this.y, this.width,this.height,				// clip
		-this.frameX,-this.frameY, this.width,this.height	// position
	);
}

