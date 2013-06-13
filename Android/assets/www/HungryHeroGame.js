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




var GameConstants = {
	GAME_STATE_IDLE: 0,
	GAME_STATE_FLYING: 1,
	GAME_STATE_OVER: 2,
	HERO_STATE_IDLE: 0,
	HERO_STATE_FLYING: 1,
	HERO_STATE_HIT: 2,
	HERO_STATE_FALL: 3,
	ITEM_TYPE_1: 1,
	ITEM_TYPE_2: 2,
	ITEM_TYPE_3: 3,
	ITEM_TYPE_4: 4,
	ITEM_TYPE_5: 5,
	ITEM_TYPE_COFFEE: 6,
	ITEM_TYPE_MUSHROOM: 7,
	OBSTACLE_TYPE_1: 1,
	OBSTACLE_TYPE_2: 2,
	OBSTACLE_TYPE_3: 3,
	OBSTACLE_TYPE_4: 4,
	PARTICLE_TYPE_1: 1,
	PARTICLE_TYPE_2: 2,
	HERO_LIVES: 99,
	HERO_MIN_SPEED: 650,
	HERO_MAX_SPEED: 1400,
	OBSTACLE_GAP: 1200,
	OBSTACLE_SPEED: 300,
	BASE_WIDTH: 1024,
	BASE_HEIGHT: 512
};

function Pool(create, clean, minSize, maxSize){
	if (minSize == null){
		minSize = 50;
	}
	if (maxSize == null){
		maxSize = 200;
	}
	this.list = [];
	this.create = create;
	this.clean = clean;
	this.size = 0;
	this.length = 0;
	this.disposed = false;
	
	this.setMinSize(minSize);
	this.setMaxSize(maxSize);
	
	
	// Create minimum number of objects now. Later in run-time, if required, more objects will be created < maximum number.
	for(var i = 0; i < this.minSize; i++) this.add();
}
/**
 * Add new objects and check-in to the pool. 
 * 
 */
Pool.prototype.add = function(){
	this.list[this.length++] = this.create();
	this.size++;
}
/**
 * Sets the minimum size for the Pool.
 *
 */
Pool.prototype.setMinSize = function(num){
	this.minSize = num;
	if(this.minSize > this.maxSize) this.maxSize = this.minSize;
	if(this.maxSize < this.list.length) this.list.splice(this.maxSize, 1);
	this.size = this.list.length;
}
/**
 * Sets the maximum size for the Pool.
 *
 */
Pool.prototype.setMaxSize = function(num){
	this.maxSize = num;
	if(this.maxSize < this.list.length) this.list.splice(this.maxSize, 1);
	this.size = this.list.length;
	if(this.maxSize < this.minSize) this.minSize = this.maxSize;
}
/**
 * Checks out an Object from the pool.
 *
 */
Pool.prototype.checkOut = function(){
	if(this.length == 0) {
		if(this.size < this.maxSize) {
			this.size++;
			return this.create();
		} else {
			return null;
		}
	}
	
	return this.list[--this.length];
}
/**
 * Checks the Object back into the Pool.
 * @param item The Object you wish to check back into the Object Pool.
 *
 */
Pool.prototype.checkIn = function(item){
	if(this.clean != null) this.clean(item);
	this.list[this.length++] = item;
}
/**
 * Disposes the Pool ready for GC.
 *
 */
Pool.prototype.dispose = function(){
	if(this.disposed) return;
	this.disposed = true;
	this.create = null;
	this.clean = null;
	this.list = null;
}

function Game(width, height){
	Game.instance = this;
	Game.prototype._super.call(this);

	var sizeRatio = height/width;
	var baseRatio = GameConstants.BASE_HEIGHT/GameConstants.BASE_WIDTH;
	if (sizeRatio > baseRatio){
	
		this.width = GameConstants.BASE_WIDTH;
		Stage.scaleFactor = width/GameConstants.BASE_WIDTH;
		this.height = height / Stage.scaleFactor;

	}else{

		this.height = GameConstants.BASE_HEIGHT;
		Stage.scaleFactor = height/GameConstants.BASE_HEIGHT;
		this.width = width / Stage.scaleFactor;
	}

    console.log ("Dimensions: " + width + " x " + height + " (" + Stage.scaleFactor+ " scale)");

	this.screenInGame = null;
	this.screenWelcome = null;
	this.initScreens();
	this.initUserInteraction();
}

Game.instance = null;

Game.prototype = new Sprite();
Game.prototype._super = Sprite;
Game.prototype.constructor = Game;


Game.prototype.initUserInteraction = function(){
	if (!USER_INTERACTION_ENABLED){
		return;
	}

	//console.log( "initUserInteraction")	
	// create instance-specific handler closures securing 'this'
	this.handleMouseStart = this.handleMouseStart.bind(this);
	this.handleMouseMove = this.handleMouseMove.bind(this);
	this.handleMouseEnd = this.handleMouseEnd.bind(this);
	
	document.addEventListener(Mouse.START, this.handleMouseStart);
	document.addEventListener(Mouse.END, this.handleMouseEnd);
}

Game.prototype.handleMouseStart = function(event){
	//console.log( "handleMouseStart")
	Mouse.get(event);
	document.addEventListener(Mouse.MOVE, this.handleMouseMove);
	this.propagateEvent("handleMouseStart", event);
	event.preventDefault();
}

Game.prototype.handleMouseMove = function(event){
	//console.log( "handleMouseMove")
	Mouse.get(event);
	this.propagateEvent("handleMouseMove", event);
	event.preventDefault();
}

Game.prototype.handleMouseEnd = function(event){
	//console.log( "handleMouseEnd")
	Mouse.get(event);
	document.removeEventListener(Mouse.MOVE, this.handleMouseMove);
	this.propagateEvent("handleMouseEnd", event);
	event.preventDefault();
}

Game.prototype.propagateEvent = function(handlerType, event){
	var child = null;
	var i = 0;
	var n = this.children.length;
	for (i=0; i<n; i++){
		child = this.children[i];
		if (child.visible && typeof child[handlerType] == "function"){
			child[handlerType](event);
		}	
	}
}

Game.prototype.initScreens = function(){
	
	// Welcome screen.
	this.screenWelcome = new Welcome();
	this.screenWelcome.playGame = this.playGame.bind(this);
	this.addChild(this.screenWelcome);
	
	// InGame screen.
	this.screenInGame = new InGame();
	this.addChild(this.screenInGame);
	
	
	// Initialize the Welcome screen by default. 
	this.screenWelcome.initialize();
}

Game.prototype.onGameTick = function(){
	if (this.screenWelcome.visible){
		this.screenWelcome.onGameTick();
	}
	
	if (this.screenInGame.visible){
		this.screenInGame.onGameTick();
	}
	
    context.setTransform(1, 0, 0, 1, 0, 0);
	context.clearRect(0,0,canvas.width,canvas.height);
	this.updateDisplayList(context, true);
	FastCanvas.render();
}

Game.prototype.playGame = function(){
	this.screenWelcome.disposeTemporarily();
	this.screenInGame.initialize();
}

	
function Welcome(){
	Welcome.prototype._super.call(this);
	
	this.visible = false;
	this.startTime = new Date().getTime();
	this.playGame = null;
	var img = null;
	var image = null;
	
	var w = Game.instance.width;
	var h = Game.instance.height;
	
	var pad = 25;
	
	
	// welcome background
	img = TextureAtlas.getImage("media/graphics/bgWelcome.jpg");
	image = new TextureImage(new SubTexture(img, TextureAtlas.getSubTextureByName("bgWelcome", "full")));
	// centered
	image.x = (w - image.width)/2;
	image.y = (h - image.height)/2;
	this.addChild(image);
			
	img = TextureAtlas.getImage("media/graphics/mySpritesheet.png");
	
	this.title = new TextureImage(new SubTexture(img, TextureAtlas.getSubTextureByName("spritesheet", "welcome_title")));
	this.title.x = pad + w/2;
	this.title.y = -pad - this.title.height + h/2;
	this.addChild(this.title);
			
	this.hero = new TextureImage(new SubTexture(img, TextureAtlas.getSubTextureByName("spritesheet", "welcome_hero")));
	this.hero.x = -pad - this.hero.width + w/2;
	this.hero.y = (h - this.hero.width)/2;
	this.addChild(this.hero);
	
	this.playBtn = new TextureImage(new SubTexture(img, TextureAtlas.getSubTextureByName("spritesheet", "welcome_playButton")));
	this.playBtn.x = pad + w/2;
	this.playBtn.y = pad + h/2;
	this.addChild(this.playBtn);
	
	this.heroInitY = this.hero.y;
	this.playInitY = this.playBtn.y;
}

Welcome.prototype = new Sprite();
Welcome.prototype._super = Sprite;
Welcome.prototype.constructor = Welcome;

Welcome.prototype.initialize = function(){
	this.visible = true;
}

Welcome.prototype.handleMouseEnd = function(event){
	this.start();
}

Welcome.prototype.start = function(){

	if (!this.visible){
		return;
	}
	
	if (this.playGame){
		this.playGame();
	}

}

Welcome.prototype.onGameTick = function(){
	var time = new Date().getTime();
	this.hero.y = this.heroInitY + (Math.cos(time * 0.002)) * 25;
	this.playBtn.y = this.playInitY + (Math.cos(time * 0.002)) * 10;
	
	// ROBOT auto start
	if (ROBOT_ENABLED && new Date().getTime() - this.startTime > 3*1000){
		this.start();
	}
}

Welcome.prototype.disposeTemporarily = function(){
	this.visible = false;
}

function InGame(){
	InGame.prototype._super.call(this);
	
	this.visible = false;
	
	this.gameState = 0;
	this.gameArea = null;
	this.lives = 0;
	this.hitObstacle = 0;
	this.cameraShake = 0;
	this.playerSpeed = 0;
	this.scoreItems = 0;
	this.scoreDistance = 0;
	this.pattern = 1;
	this.patternPosY = 0;
	this.patternStep = 1;
	this.patternDirection = 1;
	this.patternGap = 1;
	this.patternGapCount = 0;
	this.patternChange = 100;
	this.patternLength = 50;
	this.patternOnce = true;
	this.coffee = 0;
	this.mushroom = 0;
	
	this.scoreItems = 0;
	
	this.obstaclesToAnimateLength = 0;
	this.obstacleGapCount = 0;
	this.hitObstacle = 0;
	
	this.itemsToAnimate = [];
	
	/** Total number of items. */
	this.itemsToAnimateLength = 0;
	
	/** Obstacles to animate. */
	this.obstaclesToAnimate = [];
	
	/** Obstacles to animate - array length. */		
	this.obstaclesToAnimateLength = 0;
	
	/** Collision detection for hero vs items. */
	this.heroItem_xDist = 0;
	this.heroItem_yDist = 0;
	this.heroItem_sqDist = 0;
	
	/** Collision detection for hero vs obstacles. */
	this.heroObstacle_xDist = 0;
	this.heroObstacle_yDist = 0;
	this.heroObstacle_sqDist = 0;

	this.touchX = 0;
	this.touchY = 0;
	this.heroX = 0;
	this.heroY = 0;
	
	this.timeCurrent = new Date().getTime(); 
	this.timePrevious = this.timeCurrent;
	this.elapsed = 0; 
	
	this.bg = new GameBackground();
	this.addChild(this.bg);
	
	this.hero = new Hero();
	this.addChild(this.hero);
	
	if (SHOW_JS_FPS_COUNTER) {
		this.fpsCounter = new FPSCounter(2);
		this.fpsCounter.x = 10;
		this.fpsCounter.y = 45;
		this.addChild(this.fpsCounter);
	}
	
	this.robotCounter = 1;
	this.robotNextCount = 2;
	
			
	// Initialize items-to-animate vector.
	this.itemsToAnimate = [];
	this.itemsToAnimateLength = 0;
	
	// Create items, add them to pool and place them outside the stage area.
	this.itemsPool = new Pool(this.foodItemCreate.bind(this), this.foodItemClean.bind(this));
	
	// Initialize obstacles-to-animate vector.
	this.obstaclesToAnimate = [];
	this.obstaclesToAnimateLength = 0;
	
	// Create obstacles pool.
	this.obstaclesPool = new Pool(this.obstacleCreate.bind(this), this.obstacleClean.bind(this), 4, 10);
}

InGame.prototype = new Sprite();
InGame.prototype._super = Sprite;
InGame.prototype.constructor = InGame;

InGame.prototype.initialize = function(){
	// Dispose screen temporarily.
	this.disposeTemporarily();
	
	this.visible = true;
	
	// Define game area.
	this.gameArea = new Rect(0, 100, Game.instance.width, Game.instance.height - 250);
	
	// Define lives.
	this.lives = GameConstants.HERO_LIVES;
	
	// Reset hit, camera shake and player speed.
	this.hitObstacle = 0;
	this.cameraShake = 0;
	this.playerSpeed = 0;
	
	// Reset score and distance travelled.
	this.scoreItems = 0;
	this.scoreDistance = 0;
	
	// Reset item pattern styling.
	this.pattern = 1;
	this.patternPosY = this.gameArea.top();
	this.patternStep = 15;
	this.patternDirection = 1;
	this.patternGap = 20;
	this.patternGapCount = 0;
	this.patternChange = 100;
	this.patternLength = 50;
	this.patternOnce = true;
	
	// Reset coffee and mushroom power.
	this.coffee = 0;
	this.mushroom = 0;
	
	// Reset game state to idle.
	this.gameState = GameConstants.GAME_STATE_IDLE;
	
	// Hero's initial position
	this.hero.x = -500;
	this.hero.y = Game.instance.height/2;
	
	// Reset hero's state to idle.
	this.hero.state = GameConstants.HERO_STATE_IDLE;
	
	// Reset background's state to idle.
	this.bg.state = GameConstants.GAME_STATE_IDLE;
	
	// Reset background speed.
	this.bg.speed = 0;
}



InGame.prototype.handleMouseStart = function(event){
	this.touchY = Mouse.y;
}

InGame.prototype.handleMouseMove = function(event){
	this.touchY = Mouse.y;
}


InGame.prototype.disposeTemporarily = function(){
	this.visible = false;
}

InGame.prototype.onGameTick = function(){
	if (ROBOT_ENABLED && this.robotCounter++ % this.robotNextCount == 0){
		this.touchY = 75 + Math.random()*(Game.instance.height-250);
		this.robotNextCount = (1 + Math.round(3*Math.random()))*60;
	}
	
	this.calculateElapsed();
	this.bg.onGameTick();
	
	
	
	switch(this.gameState)
	{
		// Before game starts.
		case  GameConstants.GAME_STATE_IDLE:
			// Take off.
			if (this.hero.x < Game.instance.width * 0.5 * 0.5)
			{
				this.hero.x += ((Game.instance.width * 0.5 * 0.5 + 10) - this.hero.x) * 0.05;
				this.hero.y -= (this.hero.y - this.touchY) * 0.1;
				
				this.playerSpeed += (GameConstants.HERO_MIN_SPEED - this.playerSpeed) * 0.05;
				this.bg.speed = this.playerSpeed * this.elapsed;
			}
			else
			{
				this.gameState = GameConstants.GAME_STATE_FLYING;
				this.hero.state = GameConstants.HERO_STATE_FLYING;
			}
			
			// Rotate this.hero based on mouse position.
			if ((-(this.hero.y - this.touchY) * 0.2) < 30 && (-(this.hero.y - this.touchY) * 0.2) > -30) this.hero.rotation = deg2rad(-(this.hero.y - this.touchY) * 0.2);
			
			// Limit the this.hero's rotation to < 30.
			if (rad2deg(this.hero.rotation) > 30 ) this.hero.rotation = rad2deg(30);
			if (rad2deg(this.hero.rotation) < -30 ) this.hero.rotation = -rad2deg(30);
			
			// Confine the this.hero to stage area limit
			if (this.hero.y > this.gameArea.bottom() - this.hero.height * 0.5)    
			{
				this.hero.y = this.gameArea.bottom() - this.hero.height * 0.5;
				this.hero.rotation = deg2rad(0);
			}
			if (this.hero.y < this.gameArea.top() + this.hero.height * 0.5)    
			{
				this.hero.y = this.gameArea.top() + this.hero.height * 0.5;
				this.hero.rotation = deg2rad(0);
			}
			break;
		
		// When game is in progress.
		case GameConstants.GAME_STATE_FLYING:
			
			// If drank this.coffee, fly faster for a while.
			if (this.coffee > 0)
			{
				this.playerSpeed += (GameConstants.HERO_MAX_SPEED - this.playerSpeed) * 0.2;
			}
			
			// If not hit by obstacle, fly normally.
			if (this.hitObstacle <= 0)
			{
				this.hero.y -= (this.hero.y - this.touchY) * 0.1;
				
				// If this.hero is flying extremely fast, create a wind effect and show force field around this.hero.
				if (this.playerSpeed > GameConstants.HERO_MIN_SPEED + 100)

				{
					// Animate this.hero faster.
					this.hero.setHeroAnimationSpeed(1);
				}
				else
				{
					// Animate this.hero normally.
					this.hero.setHeroAnimationSpeed(0);
				}
				
				// Rotate this.hero based on mouse position.
				if ((-(this.hero.y - this.touchY) * 0.2) < 30 && (-(this.hero.y - this.touchY) * 0.2) > -30) this.hero.rotation = deg2rad(-(this.hero.y - this.touchY) * 0.2);
				
				// Limit the this.hero's rotation to < 30.
				if (rad2deg(this.hero.rotation) > 30 ) this.hero.rotation = rad2deg(30);
				if (rad2deg(this.hero.rotation) < -30 ) this.hero.rotation = -rad2deg(30);
				
				// Confine the this.hero to stage area limit
				if (this.hero.y > this.gameArea.bottom() - this.hero.height * 0.5)    
				{
					this.hero.y = this.gameArea.bottom() - this.hero.height * 0.5;
					this.hero.rotation = deg2rad(0);
				}
				if (this.hero.y < this.gameArea.top() + this.hero.height * 0.5)    
				{
					this.hero.y = this.gameArea.top() + this.hero.height * 0.5;
					this.hero.rotation = deg2rad(0);
				}
			}
			else
			{
				// Hit by obstacle
				
				if (this.coffee <= 0)
				{
					// Play this.hero animation for obstacle hit.
					if (this.hero.state != GameConstants.HERO_STATE_HIT)
					{
						this.hero.state = GameConstants.HERO_STATE_HIT;
					}
					
					// Move this.hero to center of the screen.
					this.hero.y -= (this.hero.y - (this.gameArea.top() + this.gameArea.height)/2) * 0.1;
					
					// Spin the this.hero.
					if (this.hero.y > Game.instance.height * 0.5) this.hero.rotation -= deg2rad(this.hitObstacle * 2);
					else this.hero.rotation += deg2rad(this.hitObstacle * 2);
				}
				
				// If hit by an obstacle.
				this.hitObstacle--;
				
				// Camera shake.
				this.cameraShake = this.hitObstacle;
				this.shakeAnimation();
			}
			
			// If we have a this.mushroom, reduce the value of the power.
			if (this.mushroom > 0) this.mushroom -= this.elapsed;
			
			// If we have a this.coffee, reduce the value of the power.
			if (this.coffee > 0) this.coffee -= this.elapsed;
			
			this.playerSpeed -= (this.playerSpeed - GameConstants.HERO_MIN_SPEED) * 0.01;
			
			// Create food items.
			this.setFoodItemsPattern();
			this.createFoodItemsPattern();
			
			// Create obstacles.
			this.initObstacle();
			
			// Store the this.hero's current x and y positions (needed for animations below).
			this.heroX = this.hero.x;
			this.heroY = this.hero.y;
			
			// Animate elements.
			this.animateFoodItems();
			this.animateObstacles();
			
			// Set the background's speed based on this.hero's speed.
			this.bg.speed = this.playerSpeed * this.elapsed;
			
			// Calculate maximum distance travelled.
			this.scoreDistance += (this.playerSpeed * this.elapsed) * 0.1;
			
			break;
		
		// Game over.
		case GameConstants.GAME_STATE_OVER:
			
			for(var i = 0; i < this.itemsToAnimateLength; i++)
			{
				if (this.itemsToAnimate[i] != null)
				{
					// Dispose the item temporarily.
					this.disposeItemTemporarily(i, this.itemsToAnimate[i]);
				}
			}
			
			for(var j = 0; j < this.obstaclesToAnimateLength; j++)
			{
				if (this.obstaclesToAnimate[j] != null)
				{
					// Dispose the obstacle temporarily.
					this.disposeObstacleTemporarily(j, this.obstaclesToAnimate[j]);
				}
			}
			
			// Spin the this.hero.
			this.hero.rotation -= deg2rad(30);
			
			// Make the this.hero fall.
			
			// If this.hero is still on screen, push him down and outside the screen. Also decrease his speed.
			// Checked for +width below because width is > height. Just a safe value.
			if (this.hero.y < Game.instance.height + this.hero.width)
			{
				this.playerSpeed -= this.playerSpeed * this.elapsed;
				this.hero.y += Game.instance.height * this.elapsed; 
			}
			else
			{
				// Once he moves out, reset speed to 0.
				this.playerSpeed = 0;
				// Game over.
			}
			
			// Set the background's speed based on this.hero's speed.
			this.bg.speed = Math.floor(this.playerSpeed * this.elapsed);
			
			break;
	}
}

InGame.prototype.setFoodItemsPattern = function(){
	
	// If hero has not travelled the required distance, don't change the pattern.
	if (this.patternChange > 0)
	{
		this.patternChange -= this.playerSpeed * this.elapsed;
	}
	else
	{
		// If hero has travelled the required distance, change the pattern.
		if ( Math.random() < 0.7 )
		{
			// If random number is < normal item chance (0.7), decide on a random pattern for items.
			this.pattern = Math.ceil(Math.random() * 4); 
		}
		else
		{
			// If random number is > normal item chance (0.3), decide on a random special item.
			this.pattern = Math.ceil(Math.random() * 2) + 9;
		}
		
		if (this.pattern == 1)  
		{
			// Vertical Pattern
			this.patternStep = 15;
			this.patternChange = Math.random() * 500 + 500;
		}
		else if (this.pattern == 2)
		{
			// Horizontal Pattern
			this.patternOnce = true;
			this.patternStep = 40;
			this.patternChange = this.patternGap * Math.random() * 3 + 5;
		}
		else if (this.pattern == 3)
		{
			// ZigZag Pattern
			this.patternStep = Math.round(Math.random() * 2 + 2) * 10;
			if ( Math.random() > 0.5 )
			{
				this.patternDirection *= -1;
			}
			this.patternChange = Math.random() * 800 + 800;
		}
		else if (this.pattern == 4)
		{
			// Random Pattern
			this.patternStep = Math.round(Math.random() * 3 + 2) * 50;
			this.patternChange = Math.random() * 400 + 400;
		}
		else  
		{
			this.patternChange = 0;
		}
	}
}
InGame.prototype.createFoodItemsPattern = function(){

	// Create a food item after we pass some distance (patternGap).
	if (this.patternGapCount < this.patternGap )
	{
		this.patternGapCount += this.playerSpeed * this.elapsed;
	}
	else if (this.pattern != 0)
	{
		// If there is a pattern already set.
		this.patternGapCount = 0;
		
		// Reuse and configure food item.
		this.reuseAndConfigureFoodItem();
	}
}
InGame.prototype.reuseAndConfigureFoodItem = function(){

	var itemToTrack = null;
	
	switch (this.pattern)
	{
		case 1:
			// Horizonatl, creates a single food item, and changes the position of the pattern randomly.
			if (Math.random() > 0.9)
			{
				// Set a new random position for the item, making sure it's not too close to the edges of the screen.
				this.patternPosY = Math.floor(Math.random() * (this.gameArea.bottom() - this.gameArea.top() + 1)) + this.gameArea.top();
			}
			
			// Checkout item from pool and set the type of item.
			itemToTrack = this.itemsPool.checkOut();
			if (itemToTrack){
				itemToTrack.setFoodItemType(Math.ceil(Math.random() * 5));
				
				// Reset position of item.
				itemToTrack.x = Game.instance.width + itemToTrack.width;
				itemToTrack.y = this.patternPosY;
				
				// Mark the item for animation.
				this.itemsToAnimate[this.itemsToAnimateLength++] = itemToTrack;
			}
				
			break;
		
		case 2:
			// Vertical, creates a line of food items that could be the height of the entire screen or just a small part of it.
			if (this.patternOnce == true)
			{
				this.patternOnce = false;
				
				// Set a random position not further than half the screen.
				this.patternPosY = Math.floor(Math.random() * (this.gameArea.bottom() - this.gameArea.top() + 1)) + this.gameArea.top();
				
				// Set a random length not shorter than 0.4 of the screen, and not longer than 0.8 of the screen.
				this.patternLength = (Math.random() * 0.4 + 0.4) * Game.instance.height;
			}
			
			// Set the start position of the food items pattern.
			this.patternPosYstart = this.patternPosY; 
			
			// Create a line based on the height of patternLength, but not exceeding the height of the screen.
			while (this.patternPosYstart + this.patternStep < this.patternPosY + this.patternLength 
			&& this.patternPosYstart + this.patternStep < Game.instance.height * 0.8)
			{
				// Checkout item from pool and set the type of item.
				itemToTrack = this.itemsPool.checkOut();
				if (itemToTrack){
					itemToTrack.setFoodItemType(Math.ceil(Math.random() * 5));
					
					// Reset position of item.
					itemToTrack.x = Game.instance.width + itemToTrack.width;
					itemToTrack.y = this.patternPosYstart;
					
					// Mark the item for animation.
					this.itemsToAnimate[this.itemsToAnimateLength++] = itemToTrack;
					
					// Increase the position of the next item based on patternStep.
					this.patternPosYstart += this.patternStep;
				}
			}
			break;
		
		case 3:
			// ZigZag, creates a single item at a position, and then moves bottom
			// until it hits the edge of the screen, then changes its direction and creates items
			// until it hits the upper edge.
			
			// Switch the direction of the food items pattern if we hit the edge.
			if (this.patternDirection == 1 && this.patternPosY > this.gameArea.bottom() - 50)
			{
				this.patternDirection = -1;
			}
			else if ( this.patternDirection == -1 && this.patternPosY < this.gameArea.top() )
			{
				this.patternDirection = 1;
			}
			
			if (this.patternPosY >= this.gameArea.top() && this.patternPosY <= this.gameArea.bottom())
			{
				// Checkout item from pool and set the type of item.
				itemToTrack = this.itemsPool.checkOut();
				if (itemToTrack){
					itemToTrack.setFoodItemType(Math.ceil(Math.random() * 5));
					
					// Reset position of item.
					itemToTrack.x = Game.instance.width + itemToTrack.width;
					itemToTrack.y = this.patternPosY;
					
					// Mark the item for animation.
					this.itemsToAnimate[this.itemsToAnimateLength++] = itemToTrack;
					
					// Increase the position of the next item based on patternStep and patternDirection.
					this.patternPosY += this.patternStep * this.patternDirection;
				}
			}
			else
			{
				this.patternPosY = this.gameArea.top();
			}
			
			break;
		
		case 4:
			// Random, creates a random number of items along the screen.
			if (Math.random() > 0.3)
			{
				// Choose a random starting position along the screen.
				this.patternPosY = Math.floor(Math.random() * (this.gameArea.bottom() - this.gameArea.top() + 1)) + this.gameArea.top();
				
				// Place some items on the screen, but don't go past the screen edge
				while (this.patternPosY + this.patternStep < this.gameArea.bottom())
				{
					// Checkout item from pool and set the type of item.
					itemToTrack = this.itemsPool.checkOut();
					if (itemToTrack){
						itemToTrack.setFoodItemType(Math.ceil(Math.random() * 5));
						
						// Reset position of item.
						itemToTrack.x = Game.instance.width + itemToTrack.width;
						itemToTrack.y = this.patternPosY;
						
						// Mark the item for animation.
						this.itemsToAnimate[this.itemsToAnimateLength++] = itemToTrack;
						
						// Increase the position of the next item by a random value.
						this.patternPosY += Math.round(Math.random() * 100 + 100);
					}
				}
			}
			break;
		
		case 10:
			// Coffee, this item gives you extra speed for a while, and lets you break through obstacles.
			
			// Set a new random position for the item, making sure it's not too close to the edges of the screen.
			this.patternPosY = Math.floor(Math.random() * (this.gameArea.bottom() - this.gameArea.top() + 1)) + this.gameArea.top();
			
			// Checkout item from pool and set the type of item.
			itemToTrack = this.itemsPool.checkOut();
			if (itemToTrack){
				itemToTrack.setFoodItemType(Math.ceil(Math.random() * 2) + 5);
				
				// Reset position of item.
				itemToTrack.x = Game.instance.width + itemToTrack.width;
				itemToTrack.y = this.patternPosY;
				
				// Mark the item for animation.
				this.itemsToAnimate[this.itemsToAnimateLength++] = itemToTrack;
			}
				
			break;
		
		case 11:
			// Mushroom, this item makes all the food items fly towards the hero for a while.
			
			// Set a new random position for the food item, making sure it's not too close to the edges of the screen.
			this.patternPosY = Math.floor(Math.random() * (this.gameArea.bottom() - this.gameArea.top() + 1)) + this.gameArea.top();
			
			// Checkout item from pool and set the type of item.
			itemToTrack = this.itemsPool.checkOut();
			if (itemToTrack){
				itemToTrack.setFoodItemType(Math.ceil(Math.random() * 2) + 5);
				
				// Reset position of item.
				itemToTrack.x = Game.instance.width + itemToTrack.width;
				itemToTrack.y = this.patternPosY;
				
				// Mark the item for animation.
				this.itemsToAnimate[this.itemsToAnimateLength++] = itemToTrack;
			}
				
			
			break;
	}
}
InGame.prototype.initObstacle = function(){
	// Create an obstacle after hero travels some distance (obstacleGap).
	if (this.obstacleGapCount < GameConstants.OBSTACLE_GAP)
	{
		this.obstacleGapCount += this.playerSpeed * this.elapsed;
	}
	else if (this.obstacleGapCount != 0)
	{
		this.obstacleGapCount = 0;
		
		// Create any one of the obstacles.
		this.createObstacle(Math.ceil(Math.random() * 4), Math.random() * 1000 + 1000);
	}
}
InGame.prototype.createObstacle = function(type, distance){
	if (type == null){
		type = 1;
	}
	if (distance == null){
		distance = 0;
	}
	
	// Create a new obstacle.
	var obstacle = this.obstaclesPool.checkOut();
	obstacle.setType(type);
	obstacle.distance = distance;
	obstacle.x = Game.instance.width;
	
	// For only one of the obstacles, make it appear in either the top or bottom of the screen.
	if (this.type <= GameConstants.OBSTACLE_TYPE_3)
	{
		// Place it on the top of the screen.
		if (Math.random() > 0.5)
		{
			obstacle.y = this.gameArea.top();
			obstacle.position = "top";
		}
		else
		{
			// Or place it in the bottom of the screen.
			obstacle.y = this.gameArea.bottom() - obstacle.height;
			obstacle.position = "bottom";
		}
	}
	else
	{
		// Otherwise, if it's any other obstacle type, put it somewhere in the middle of the screen.
		obstacle.y = Math.floor(Math.random() * (this.gameArea.bottom() - obstacle.height - this.gameArea.top() + 1)) + this.gameArea.top();
		obstacle.position = "middle";
	}
	
	// Set the obstacle's speed.
	obstacle.speed = GameConstants.OBSTACLE_SPEED;
	
	// Set look out mode to true, during which, a look out text appears.
	obstacle.setLookOut(true);
	
	// Animate the obstacle.
	this.obstaclesToAnimate[this.obstaclesToAnimateLength++] = obstacle;
}

InGame.prototype.animateFoodItems = function(){
	
	var itemToTrack = null;
	
	for(var i = 0;i<this.itemsToAnimateLength;i++)
	{
		itemToTrack = this.itemsToAnimate[i];
		
		if (itemToTrack != null)
		{
			// If hero has eaten a mushroom, make all the items move towards him.
			if (this.mushroom > 0 && itemToTrack.foodItemType <= GameConstants.ITEM_TYPE_5)
			{
				// Move the item towards the player.
				itemToTrack.x -= (itemToTrack.x - this.heroX) * 0.2;
				itemToTrack.y -= (itemToTrack.y - this.heroY) * 0.2;
			}
			else
			{
				// If hero hasn't eaten a mushroom,
				// Move the items normally towards the left.
				itemToTrack.x -= this.playerSpeed * this.elapsed; 
			}
			
			// If the item passes outside the screen on the left, remove it (check-in).
			
			if (itemToTrack.x < -80 || this.gameState == GameConstants.GAME_STATE_OVER)
			{
				this.disposeItemTemporarily(i, itemToTrack);
			}
			else
			{
				// Collision detection - Check if the hero eats a food item.
				this.heroItem_xDist = itemToTrack.x - this.heroX;
				this.heroItem_yDist = itemToTrack.y - this.heroY;
				this.heroItem_sqDist = this.heroItem_xDist * this.heroItem_xDist 
					+ this.heroItem_yDist * this.heroItem_yDist;
				
				if (this.heroItem_sqDist < 5000)
				{
					// If hero eats an item, add up the score.
					if (itemToTrack.foodItemType <= GameConstants.ITEM_TYPE_5)
					{
						this.scoreItems += itemToTrack.foodItemType;
					}
					else if (itemToTrack.foodItemType == GameConstants.ITEM_TYPE_COFFEE) 
					{
						// If hero drinks coffee, add up the score.
						this.scoreItems += 1;
						
						// How long does coffee power last? (in seconds)
						this.coffee = 5;
					}
					else if (itemToTrack.foodItemType == GameConstants.ITEM_TYPE_MUSHROOM) 
					{
						// If hero eats a mushroom, add up the score.
						this.scoreItems += 1;
						
						// How long does mushroom power last? (in seconds)
						this.mushroom = 4;
					}
					
					// Dispose the food item.
					this.disposeItemTemporarily(i, itemToTrack);
				}
			}
		}
	}
}
InGame.prototype.setFoodItemsPattern = function(){
	// If hero has not travelled the required distance, don't change the pattern.
	if (this.patternChange > 0)
	{
		this.patternChange -= this.playerSpeed * this.elapsed;
	}
	else
	{
		// If hero has travelled the required distance, change the pattern.
		if ( Math.random() < 0.7 )
		{
			// If random number is < normal item chance (0.7), decide on a random pattern for items.
			this.pattern = Math.ceil(Math.random() * 4); 
		}
		else
		{
			// If random number is > normal item chance (0.3), decide on a random special item.
			this.pattern = Math.ceil(Math.random() * 2) + 9;
		}
		
		if (this.pattern == 1)  
		{
			// Vertical Pattern
			this.patternStep = 15;
			this.patternChange = Math.random() * 500 + 500;
		}
		else if (this.pattern == 2)
		{
			// Horizontal Pattern
			this.patternOnce = true;
			this.patternStep = 40;
			this.patternChange = this.patternGap * Math.random() * 3 + 5;
		}
		else if (this.pattern == 3)
		{
			// ZigZag Pattern
			this.patternStep = Math.round(Math.random() * 2 + 2) * 10;
			if ( Math.random() > 0.5 )
			{
				this.patternDirection *= -1;
			}
			this.patternChange = Math.random() * 800 + 800;
		}
		else if (this.pattern == 4)
		{
			// Random Pattern
			this.patternStep = Math.round(Math.random() * 3 + 2) * 50;
			this.patternChange = Math.random() * 400 + 400;
		}
		else  
		{
			this.patternChange = 0;
		}
	}
}
InGame.prototype.animateObstacles = function(){
	
	var obstacleToTrack;
	var heroRect;
	var obstacleRect;
	
	for (var i = 0; i < this.obstaclesToAnimateLength ; i ++)
	{
		obstacleToTrack = this.obstaclesToAnimate[i];
		
		// If the distance is still more than 0, keep reducing its value, without moving the obstacle.
		if (obstacleToTrack.distance > 0 ) 
		{
			obstacleToTrack.distance -= this.playerSpeed * this.elapsed;  
		}
		else  
		{
			// Otherwise, move the obstacle based on hero's speed, and check if he hits it. 
			
			// Remove the look out sign.
			if (obstacleToTrack.lookOut == true )
			{
				obstacleToTrack.setLookOut(false);
			}
			
			// Move the obstacle based on hero's speed.
			obstacleToTrack.x -= (this.playerSpeed + obstacleToTrack.speed) * this.elapsed; 
		}
		
		// If the obstacle passes beyond the screen, remove it.
		if (obstacleToTrack.x < -obstacleToTrack.width 
		|| this.gameState == GameConstants.GAME_STATE_OVER)
		{
			this.disposeObstacleTemporarily(i, obstacleToTrack);
		}
		
		// Collision detection - Check if hero collides with any obstacle.
		this.heroObstacle_xDist = obstacleToTrack.x - this.heroX;
		this.heroObstacle_yDist = obstacleToTrack.y - this.heroY;
		this.heroObstacle_sqDist = this.heroObstacle_xDist * this.heroObstacle_xDist 
			+ this.heroObstacle_yDist * this.heroObstacle_yDist;

		if (this.heroObstacle_sqDist < 5000 && !obstacleToTrack.alreadyHit)
		{
			obstacleToTrack.setAlreadyHit(true);
			
			if (this.coffee > 0) 
			{
				// If hero has a coffee item, break through the obstacle.
				if (obstacleToTrack.position == "bottom") obstacleToTrack.rotation = deg2rad(100);
				else obstacleToTrack.rotation = deg2rad(-100);
				
				// Set hit obstacle value.
				this.hitObstacle = 30;
				
				// Reduce hero's speed
				this.playerSpeed *= 0.8; 
			}
			else 
			{
				if (obstacleToTrack.position == "bottom") obstacleToTrack.rotation = deg2rad(70);
				else obstacleToTrack.rotation = deg2rad(-70);
				
				// Otherwise, if hero doesn't have a coffee item, set hit obstacle value.
				this.hitObstacle = 30; 
				
				// Reduce hero's speed.
				this.playerSpeed *= 0.5; 
				
				// Update lives.
				this.lives--;
				
				if (this.lives <= 0)
				{
					this.lives = 0;
					console.log("Game Over");
				}
			}
		}
		
		// If the game has ended, remove the obstacle.
		if (this.gameState == GameConstants.GAME_STATE_OVER)
		{
			this.disposeObstacleTemporarily(i, obstacleToTrack);
		}
	}
}

InGame.prototype.obstacleCreate = function(){
	var obstacle = new Obstacle(Math.ceil(Math.random() * 4), Math.random() * 1000 + 1000);
	obstacle.x = Game.instance.width + obstacle.width * 2;
	this.addChild(obstacle);
	
	return obstacle;
}
InGame.prototype.obstacleClean = function(obstacle){
	obstacle.x = Game.instance.width + obstacle.width * 2;
}
InGame.prototype.foodItemCreate = function(){
	var foodItem = new Item(Math.ceil(Math.random() * 5));
	foodItem.x = Game.instance.width + foodItem.width * 2;
	this.addChild(foodItem);
	
	return foodItem;
}
InGame.prototype.foodItemClean = function(item){
	item.x = Game.instance.width + 100;
}

InGame.prototype.shakeAnimation = function(){
	// Animate quake effect, shaking the camera a little to the sides and up and down.
	if (this.cameraShake > 0)
	{
		this.cameraShake -= 0.1;
		// Shake left right randomly.
		this.x = parseInt(Math.random() * this.cameraShake - this.cameraShake * 0.5); 
		// Shake up down randomly.
		this.y = parseInt(Math.random() * this.cameraShake - this.cameraShake * 0.5); 
	}
	else if (this.x != 0) 
	{
		// If the shake value is 0, reset the stage back to normal.
		// Reset to initial position.
		this.x = 0;
		this.y = 0;
	}
}

InGame.prototype.disposeItemTemporarily = function(animateId, item){
	this.itemsToAnimate.splice(animateId, 1);
	this.itemsToAnimateLength--;
	item.x = Game.instance.width + item.width * 2;
	this.itemsPool.checkIn(item);
}
InGame.prototype.disposeObstacleTemporarily = function(animateId, obstacle){
	this.obstaclesToAnimate.splice(animateId, 1);
	this.obstaclesToAnimateLength--;
	this.obstaclesPool.checkIn(obstacle);
}
InGame.prototype.calculateElapsed = function(){
	
	// Set the current time as the previous time.
	this.timePrevious = this.timeCurrent;
	// Get teh new current time.
	this.timeCurrent = new Date().getTime(); 
	// Calcualte the time it takes for a frame to pass, in milliseconds.
	this.elapsed = (this.timeCurrent - this.timePrevious) * 0.001; 
}

function Hero(){
	Hero.prototype._super.call(this);
	
	this.state = 0;
	this.heroArt = null;
	
	this.fps = 20;
	this.createHeroArt();
}
Hero.prototype = new Sprite();
Hero.prototype._super = Sprite;
Hero.prototype.constructor = Hero;

Hero.prototype.createHeroArt = function() {
	this.heroArt = new HeroArt();
	this.heroArt.x = Math.ceil(-this.heroArt.width/2);
	this.heroArt.y = Math.ceil(-this.heroArt.height/2);
	this.addChild(this.heroArt);
}

Hero.prototype.setHeroAnimationSpeed = function(speed){
	if (speed == 0) this.fps = 20;
	else this.fps = 60;
}

function HeroArt(){
	HeroArt.prototype._super.call(this);
	
	var img = TextureAtlas.getImage("media/graphics/mySpritesheet.png");
	var textures = TextureAtlas.getSubTexturesByPrefix("spritesheet", "fly_");
	var i = 0;
	var n = textures.length;
	
	for (i=0; i<n; i++){
		this.addSubTexture(new SubTexture(img, textures[i]));
	}
}
HeroArt.prototype = new MovieClip();
HeroArt.prototype._super = MovieClip;
HeroArt.prototype.constructor = HeroArt;


function GameBackground(){
	GameBackground.prototype._super.call(this);
	
	this.bgLayer1 = new BgLayer(1);
	this.bgLayer1.parallaxDepth = 0.02;
	this.addChild(this.bgLayer1);
	
	this.bgLayer2 = new BgLayer(2);
	this.bgLayer2.parallaxDepth = 0.2;
	this.addChild(this.bgLayer2);
	
	this.bgLayer3 = new BgLayer(3);
	this.bgLayer3.parallaxDepth = 0.5;
	this.addChild(this.bgLayer3);
	
	this.bgLayer4 = new BgLayer(4);
	this.bgLayer4.parallaxDepth = 1;
	this.addChild(this.bgLayer4);
	
	this.speed = 0;
	this.state = 0;
}
GameBackground.prototype = new Sprite();
GameBackground.prototype._super = Sprite;
GameBackground.prototype.constructor = GameBackground;

GameBackground.prototype.onGameTick = function(){
	
	// Background 1 - Sky
	this.bgLayer1.x -= Math.ceil(this.speed * this.bgLayer1.parallaxDepth);
	// Hero flying right
	if (this.bgLayer1.x < -this.bgLayer1.offset ) this.bgLayer1.x += this.bgLayer1.offset;
	
	// Background 2 - Hills
	this.bgLayer2.x -= Math.ceil(this.speed * this.bgLayer2.parallaxDepth);
	// Hero flying right
	if (this.bgLayer2.x < -this.bgLayer2.offset ) this.bgLayer2.x += this.bgLayer2.offset;
	
	// Background 3 - Buildings
	this.bgLayer3.x -= Math.ceil(this.speed * this.bgLayer3.parallaxDepth);
	// Hero flying right
	if (this.bgLayer3.x < -this.bgLayer3.offset ) this.bgLayer3.x += this.bgLayer3.offset;
	
	// Background 4 - Trees
	this.bgLayer4.x -= Math.ceil(this.speed * this.bgLayer4.parallaxDepth);
	// Hero flying right
	if (this.bgLayer4.x < -this.bgLayer4.offset ) this.bgLayer4.x += this.bgLayer4.offset;
}

function BgLayer(layer){
	BgLayer.prototype._super.call(this);
	
	this.image1 = null;
	this.image2 = null;
	this.parallaxDepth = 1;
	this.layer = layer;
	this.offset = 0;
	
	var img = null;
	var tex = null;
	var subTextures = null;
	
	
	if (this.layer == 1){
		img = TextureAtlas.getImage("media/graphics/bgLayer1.jpg");
		tex = new SubTexture(img, TextureAtlas.getSubTextureByName("bgLayer1", "full"));
		// positioned at top
		this.y = 0; 
	}else{
		img = TextureAtlas.getImage("media/graphics/mySpritesheet.png");
		tex = new SubTexture(img, TextureAtlas.getSubTextureByName("spritesheet", "bgLayer" + this.layer));
		// positioned at bottom
		this.y = Game.instance.height - tex.height; 
	}
	
	this.offset = tex.width;
	
	var i = 0;
	var n = 1 + Math.ceil(Game.instance.width/this.offset);
	var child;
	for (i=0; i<n; i++){
		child = new TextureImage(tex);
		child.x = i * this.offset;
		this.addChild(child);
	}
}

BgLayer.prototype = new Sprite();
BgLayer.prototype._super = Sprite;
BgLayer.prototype.constructor = BgLayer;


function Item(foodItemType){
	Item.prototype._super.call(this);
	
	this.itemImage = null;
	this.foodItemType = foodItemType;
}

Item.prototype = new Sprite();
Item.prototype._super = Sprite;
Item.prototype.constructor = Item;

/**
 * Set the type of food item (visuals) to show. 
 * @param value
 * 
 */
Item.prototype.setFoodItemType = function(value){
	this.foodItemType = value;

	var img = TextureAtlas.getImage("media/graphics/mySpritesheet.png");
	
	if (this.itemImage == null)
	{
		// If the item is created for the first time.
		tex = TextureAtlas.getSubTextureByName("spritesheet", "item" + this.foodItemType);
		
		this.itemImage = new TextureImage(new SubTexture(img, tex));
		this.itemImage.x = -this.itemImage.width/2;
		this.itemImage.y = -this.itemImage.height/2;
		this.addChild(this.itemImage);
	}
	else
	{
		// If the item is reused.
		tex = TextureAtlas.getSubTextureByName("spritesheet", "item" + this.foodItemType);
		
		this.itemImage.subTexture = new SubTexture(img, tex);
		this.itemImage.updateDimensions();
		this.itemImage.x = -this.itemImage.width/2;
		this.itemImage.y = -this.itemImage.height/2;
	}
}

function Obstacle(type, distance, lookOut, speed){
	Obstacle.prototype._super.call(this);
	
	if (speed == null){
		speed = 0;
	}
	if (lookOut == null){
		lookOut = false;
	}
	
	this.distance = distance;
	this.speed = speed;
	this.position = "";
	this.hitArea = null;
	this.obstacleImage = null;
	this.obstacleAnimation = null;
	this.obstacleCrashImage = null;
	this.lookOutAnimation = null;
		
	this.alreadyHit = false;
	this.setType(type);
	this.setLookOut(lookOut);
}

Obstacle.prototype = new Sprite();
Obstacle.prototype._super = Sprite;
Obstacle.prototype.constructor = Obstacle;
/**
 * Create the art of the obstacle based on - animation/image and new/reused object. 
 * 
 */
Obstacle.prototype.createObstacleArt = function(){
	var img = TextureAtlas.getImage("media/graphics/mySpritesheet.png");
	var texs = null;
	
	// Animated obstacle.
	if (this.type == GameConstants.OBSTACLE_TYPE_4)
	{
		// If this is the first time the object is being used.
		if (this.obstacleAnimation == null)
		{
			texs = TextureAtlas.getSubTexturesByPrefix("spritesheet", "obstacle" + this.type + "_0");
			this.obstacleAnimation = new MovieClip(SubTexture.fromList(img, texs), 10);
			this.addChild(this.obstacleAnimation);
		}
		else
		{
			// If this object is being reused. (Last time also this object was an animation).
			this.obstacleAnimation.visible = true;
		}
		
		this.obstacleAnimation.x = 0;
		this.obstacleAnimation.y = 0;
	}
	else
	{
		// Static obstacle.
		
		// If this is the first time the object is being used.
		if (this.obstacleImage == null)
		{
			tex = TextureAtlas.getSubTextureByName("spritesheet", "obstacle" + this.type);
			this.obstacleImage = new TextureImage(new SubTexture(img, tex)); 
			this.addChild(this.obstacleImage);
		}
		else
		{
			// If this object is being reused.
			tex = TextureAtlas.getSubTextureByName("spritesheet", "obstacle" + this.type);
			this.obstacleImage.subTexture = new SubTexture(img, tex);
			this.obstacleImage.updateDimensions();
			this.obstacleImage.visible = true;
		}
		
		//this.obstacleImage.readjustSize(); // TODO
		this.obstacleImage.x = 0;
		this.obstacleImage.y = 0;
	}
}

/**
 * Create the crash art of the obstacle based on - animation/image and new/reused object. 
 * 
 */
Obstacle.prototype.createObstacleCrashArt = function(){
	var img = TextureAtlas.getImage("media/graphics/mySpritesheet.png");
	
	if (this.obstacleCrashImage == null)
	{
		// If this is the first time the object is being used.
		this.obstacleCrashImage = new TextureImage(new SubTexture(img, TextureAtlas.getSubTextureByName("spritesheet", "obstacle" + this.type + "_crash")));
		this.addChild(this.obstacleCrashImage);
	}
	else
	{
		// If this object is being reused.
		this.obstacleCrashImage.subTexture = new SubTexture(img, TextureAtlas.getSubTextureByName("spritesheet", "obstacle" + this.type + "_crash"));
		this.obstacleCrashImage.updateDimensions();
	}
	
	// Hide the crash image by default.
	this.obstacleCrashImage.visible = false;
}

/**
 * Create the look out animation. 
 * 
 */
Obstacle.prototype.createLookOutAnimation = function(){
	if (this.lookOutAnimation == null)
	{
		// If this is the first time the object is being used.
		var img = TextureAtlas.getImage("media/graphics/mySpritesheet.png");
		var texs = TextureAtlas.getSubTexturesByPrefix("spritesheet", "watchOut");
		this.lookOutAnimation = new MovieClip(SubTexture.fromList(img, texs), 10);
		this.addChild(this.lookOutAnimation);
	}
	else
	{
		// If this object is being reused.
		this.lookOutAnimation.visible = true;
	}
	
	// Reset the positioning of look-out animation based on the new obstacle type.
	if (this.type == GameConstants.OBSTACLE_TYPE_4)
	{
		this.lookOutAnimation.x = -this.lookOutAnimation.width;
		this.lookOutAnimation.y = this.obstacleAnimation.y + (this.obstacleAnimation.height * 0.5) - (this.obstacleAnimation.height * 0.5);
	}
	else
	{
		this.lookOutAnimation.x = -this.lookOutAnimation.width;
		this.lookOutAnimation.y = this.obstacleImage.y + (this.obstacleImage.height * 0.5) - (this.lookOutAnimation.height * 0.5);
	}
	
	this.lookOutAnimation.visible = false;
}

/**
 * If reusing, hide previous animation/image, based on what is necessary this time. 
 * 
 */
Obstacle.prototype.hidePreviousInstance = function(){
	// If this item is being reused and was an animation the last time, remove it from juggler.
	// Only don't remove it if it is an animation this time as well.
	if (this.obstacleAnimation != null && this.type != GameConstants.OBSTACLE_TYPE_4)
	{
		this.obstacleAnimation.visible = false;
	}
	
	// If this item is being reused and was an image the last time, hide it.
	if (this.obstacleImage != null) this.obstacleImage.visible = false;
}

/**
 * Set the art, crash art, hit area and Look Out animation based on the new obstacle type. 
 * @param value
 * 
 */
Obstacle.prototype.setType = function(value) {
	this.type = value;
	
	this.resetForReuse();
	
	// If reusing, hide previous animation/image, based on what is necessary this time.
	this.hidePreviousInstance();
	
	// Create Obstacle Art.
	this.createObstacleArt();
	
	// Create the Crash Art.
	this.createObstacleCrashArt();
	
	// Create look-out animation.
	this.createLookOutAnimation();
}

/**
 * Look out sign status. 
 * 
 */
Obstacle.prototype.setLookOut = function(value){
	this.lookOut = value;
	
	if (this.lookOutAnimation)
	{
		this.lookOutAnimation.visible = this.lookOut;
	}
}

/**
 * Has the hero collided with the obstacle? 
 * 
 */
Obstacle.prototype.setAlreadyHit = function(value){
	this.alreadyHit = value;
	
	if (value)
	{
		this.obstacleCrashImage.visible = true;
		if (this.type == GameConstants.OBSTACLE_TYPE_4)
		{
			this.obstacleAnimation.visible = false;
		}
		else
		{
			this.obstacleImage.visible = false;
		}
	}
}


/**
 * Width of the texture that defines the image of this Sprite. 
 */
Obstacle.prototype.getWidth = function() {
	if (this.obstacleImage) return this.obstacleImage.width;
	else return 0;
}

/**
 * Height of the texture that defines the image of this Sprite. 
 */
Obstacle.prototype.getHeight = function(){
	if (this.obstacleImage) return this.obstacleImage.height;
	else return 0;
}

/**
 * Reset the obstacle object for reuse. 
 * 
 */
Obstacle.prototype.resetForReuse = function(){
	this.setAlreadyHit(false);
	this.rotation = deg2rad(0);
	this.setLookOut(true);
}


function Digit(){
	Digit.prototype._super.call(this);
	this.addNumTextures();
	this.gotoAndStop(1);
}

Digit.prototype = new MovieClip();
Digit.prototype._super = MovieClip;
Digit.prototype.constructor = Digit;


Digit.prototype.addNumTextures = function(){
	
	var img = TextureAtlas.getImage("media/graphics/mySpritesheet.png");
	var textures = TextureAtlas.getSubTexturesByPrefix("spritesheet", "num_");
	
	var i = 0;
	var n = textures.length;
	for (i=0; i<n; i++){
		this.addSubTexture(new SubTexture(img, textures[i]));
	}
}

function FPSCounter(digitCount, updateInterval){
	FPSCounter.prototype._super.call(this);
	
	this.time = new Date().getTime();
	this.data = [];
	this.updateCounter = 0;
	this.updateInterval = updateInterval || 60;
	
	if (!digitCount || digitCount < 0){
		digitCount = 1;
	}
	this.addDigits(digitCount);
}

FPSCounter.prototype = new Sprite();
FPSCounter.prototype._super = Sprite;
FPSCounter.prototype.constructor = FPSCounter;

FPSCounter.prototype.addDigits = function(digitCount){
	var digit = null;
	var i = 0;
	for (i=0; i<digitCount; i++){
		digit = new Digit();
		digit.x = i * digit.width;
		this.addChild(digit);
	}
}

FPSCounter.prototype.setValue = function(value){
	var frameNum = 0;
	var i = 0;
	var n = this.children.length;
	for (i=0; i<n; i++){
		frameNum = Math.floor(value / Math.pow(10, i)) % 10;
		// update digits right to left
		this.children[n - i - 1].gotoAndStop(frameNum);
	}
}

FPSCounter.prototype.updateDigits = function(){
	var total = 0;
	var i = 0;
	var n = this.data.length;
	
	if (n > 0){
		for (i=0; i<n; i++){
			total += this.data[i];
		}
		
		var avg = Math.floor(total/n)
		this.setValue(avg);
	}else{
		this.setValue(0);
	}
}

FPSCounter.prototype.paint = function(){
	var fps = 0;
	
	var nowTime = new Date().getTime();
	var diff = nowTime - this.time;
	
	if (diff > 0){
		fps = Math.floor(1000 / diff);
	}	
	
	this.data[this.updateCounter] = fps;
	
	this.updateCounter++;
	if (this.updateCounter >= this.updateInterval){
		this.updateDigits();
		this.updateCounter = 0;
	}
	
	this.time = nowTime;
	
	FPSCounter.prototype._super.prototype.paint.call(this);
}