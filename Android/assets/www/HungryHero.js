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


var USER_INTERACTION_ENABLED = true; // recognizes mouse and touch events
var ROBOT_ENABLED = false; // auto controls game without user interaction
var SHOW_JS_FPS_COUNTER = true; // JavaScript FPS counter based on requestAnimationFrame()
var USE_FAST_CANVAS = true;


var canvas = null; // current canvas
var context = null; // current context (from canvas.getContext)
var game = null; // main game object
var loader = null;
var readyTimeoutID = -1; // timeout id for checking deviceready event

var paused = false;

function initialize(){
	console.log("initialize()");
	document.addEventListener("deviceready", onDeviceReady, false);
	readyTimeoutID = setTimeout(onDeviceReadyTimeout, 2000);
}

function onDeviceReadyTimeout() {
	// device ready not called; must be in a browser
	console.log("onDeviceReadyTimeout()");
	init();
}


function onDeviceReady() {
	console.log("onDeviceReady()");
	clearTimeout(readyTimeoutID);
	
	document.addEventListener("pause", onPause, false);
	document.addEventListener("resume", onResume, false);
    
	init();
}

function init(){
	console.log("init()");
	
	var forceHTMLCanvas = !USE_FAST_CANVAS;
	canvas = FastCanvas.create(forceHTMLCanvas);
	context = canvas.getContext("2d");
	console.log("Using canvas: " + canvas);
    
	loader = new ImagesLoader();
	loader.load([
                 "media/graphics/bgWelcome.jpg",
                 "media/graphics/bgLayer1.jpg",
                 "media/graphics/mySpritesheet.png"
                 ], onImagesLoaded);
	
}

function onImagesLoaded(){
	console.log ("onImagesLoaded()");
	
	var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
	var height = (window.innerHeight > 0) ? window.innerHeight : screen.height;
    
	game = new Game(width, height);
	requestAnimationFrame(render);
}

function onPause() {
    // Pause the run loop
    paused = true;
}

function onResume() {
    // Resume the run loop
    paused = false;
    requestAnimationFrame(render);
}

function render(){
    if (paused === true) {
        return;
    }
    
    game.onGameTick();
	requestAnimationFrame(render);
}

// ImagesLoader
function ImagesLoader(){
	this.imageCount = 0;
	this.completeCallback = null;
	
	this.handleOnComplete = this.handleOnComplete.bind(this);
	this.handleErrorOnComplete = this.handleErrorOnComplete.bind(this);
}

ImagesLoader.prototype.load = function(srcList, completeCallback){
	this.completeCallback = completeCallback;
	
	var i = 0;
	this.imageCount = srcList.length;
	for (i=0; i<this.imageCount; i++){
		this.loadImage(srcList[i]);
	}
};

ImagesLoader.prototype.loadImage = function(src){
	var image = FastCanvas.createImage();
	TextureAtlas.addImage(image, src);
    
	console.log("loading: " + src + (image.id ? (", ID: " + image.id) : ""));
	image.onload = this.handleOnComplete;
	image.onerror = this.handleErrorOnComplete;
	image.src = src;
};

ImagesLoader.prototype.handleOnComplete = function(){
	this.checkComplete();
};

ImagesLoader.prototype.handleErrorOnComplete = function(msg){
    console.log("Error loading image: " + msg);
	this.checkComplete();
};

ImagesLoader.prototype.checkComplete = function(){
	if (--this.imageCount <= 0){
		if (this.completeCallback != null){
			this.completeCallback();
		}
	}
};