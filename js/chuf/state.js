/////////////////////////////////////////////////
// Creates a template object for a new game state
/////////////////////////////////////////////////
/*
Usage:
Create a new instance of state then replace load(),
unload(), handleEvent(), update(dt) and draw() with
custom functions (if needed). eg:
var menuState = new State();
menuState.update = function(dt)
{
	//update your scene here
}

then add the scene to the scene array in chufApp.
To change states update the request value from -1
to the ID of the state you wish to change to.
See examples folder for more information
*/

var StateID = Object.freeze
({
	//add aliases for state IDs if required
	NONE         : -1,
	MAIN_MENU    :  0,
	OPTIONS_MENU :  1,
	MAIN_GAME    :  2
})

function State()
{
	//override these with custom functions
	this.load        = function(){}
	this.unload      = function(){}
	this.handleEvent = function(){}
	this.update      = function(dt){}
	this.draw        = function(){}

	//------------------------------------
	this.stateRequest = StateID.NONE;
}