'use strict';

// Configuration options:
const giffyAPIkey = 'LifqQYtiTIo3bDomGTB3jcQOa8jS5LQQ';
const gifsDisplayedPerRequest = 10;
const largeScreenSize = 968;
let topics = ['cats', 'dogs', 'guinea pigs', 'meerkats'];

// Initialization of variables:
let searchButtons = [], gifList = [];
let gifDisplayArea = $('#gif-display-area');
let animatedGifIdArray = []; // array of strings that store unique ID tags
let lastSearchTerm = null, searchOffset = 0, screenSmall;

function makeSearchButton (searchTerm) {
	let searchButton = $('<button>');
	searchButton.text(searchTerm);
	searchButton.attr('class', 'giffy-search-button');
	searchButton.attr('data-search-string', searchTerm);
	return searchButton;
}

function displaySearchButtons() {
	searchButtons = [];
	topics.forEach(function(searchTerm) {
		searchButtons.push(makeSearchButton(searchTerm));
	});
	$('#search-buttons-area').empty();
	$('#search-buttons-area').append(searchButtons);
	// For performance, append all elements at once to avoid excessive reflow.
	// Note: pure JS seems to be much faster than jquery, more info here:
	// https://howchoo.com/g/mmu0nguznjg/learn-the-slow-and-fast-way-to-append-elements-to-the-dom
}

function addNewSearchButton() {
	let newSearchTerm = $('#new-search-term-text').val();
	if (newSearchTerm !== "" && !topics.includes(newSearchTerm)) {
		topics.push(newSearchTerm);
		displaySearchButtons();
	}
	$('#new-search-term-text').val(''); // Clear out the text field for next entry.
}

function searchGiffy() {
	let searchTerm = $(this).attr('data-search-string');
	if (searchTerm === lastSearchTerm) {
		searchOffset += 10;
	}
	else {
		searchOffset = 0;
	}
	console.log('Searching for', searchTerm);
    searchTerm = searchTerm.replace(" ", "+");
	if (searchTerm !== lastSearchTerm) {
		gifList = [];
		$('#gif-display-area').empty()
	}
    let queryURL = `https://api.giphy.com/v1/gifs/search?q=${searchTerm}&limit=${gifsDisplayedPerRequest}&offset=${searchOffset}&api_key=${giffyAPIkey}`;
    $.ajax({
			url: queryURL,
			method: "GET"
		}).then(function(response) {
			for(let i=0; i < response.data.length; i++) {
				let theGif = new GiffyObject(response.data[i]);
				gifList.push(theGif);
			}
			displayGIFs();
			lastSearchTerm = searchTerm;
		}); //  end of ajax request
}

function displayGIFs() {
	let gifDivArray = [];
	//for(let i=0; i < gifList.length; i++) {
	for(let i=gifList.length-1; i >= 0; i--) { 
		gifDivArray.push(gifList[i].imageDiv)
	}
	gifDisplayArea.prepend(gifDivArray); // For performance, append all elements at once to avoid excessive reflow.
}

function GiffyObject(gifObject) {
	console.log(gifObject);
	console.log("URL is ", gifObject.images.fixed_height_small_still.url);
	this.staticSmallURL = gifObject.images.fixed_height_small_still.url;
	this.staticLargeURL = gifObject.images.fixed_height_still.url;
	this.animatedSmallURL = gifObject.images.fixed_height_small.url;
	this.animatedLargeURL = gifObject.images.fixed_height.url;
	this.title = gifObject.title.toLowerCase();
	this.rating = gifObject.rating;
	this.id = gifObject.id;
	this.imageElement = $('<img>');
	if (screen.isSmall) {
		this.imageElement.attr('src', this.staticSmallURL);
	}
	else {
		this.imageElement.attr('src', this.staticLargeURL);
	}
	this.imageElement.attr('alt', this.title);
	this.imageElement.attr('class', 'toggleable-gif');
	this.imageElement.attr('data-still-small-url', this.staticSmallURL);
	this.imageElement.attr('data-still-large-url', this.staticLargeURL);
	this.imageElement.attr('data-animated-small-url', this.animatedSmallURL);
	this.imageElement.attr('data-animated-large-url', this.animatedLargeURL);
	this.imageElement.attr('data-currently-animated', 'false');
	this.imageDiv = $('<div>');
	this.imageDiv.attr('class', 'image-div');
	this.imageDiv.append(this.imageElement);
	this.imageDiv.append(`<p>${this.title}</p>`);
	this.imageDiv.append(`<p>Rating: ${this.rating}</p>`);
	this.downloadLink = $('<a>');
	this.downloadLink.attr('href', this.animatedURL);
	this.downloadLink.attr('type', 'image/gif');
	this.downloadLink.attr('target', '_blank');
	this.downloadLink.attr('download', `${this.id}.gif`);
	this.downloadButton = $('<button>');
	this.downloadButton.text('Download');
	this.downloadButton.attr('class', 'download-button');
	this.downloadLink.append(this.downloadButton);
	this.imageDiv.append(this.downloadLink);
	console.log(this.imageDiv);
}

var screen = {
	isSmall: true, // default to small
	wasSmall: true,
	checkSize: function() {
		if ($(document).width() < largeScreenSize) {
			screen.isSmall = true;
		}
		else {
			screen.isSmall = false;
		}
	},
	resized: function() {
		// console.log("resized, checking size...");
		screen.wasSmall = screen.isSmall;
		// console.log("Screen was small?", screen.wasSmall);
		screen.checkSize();
		// console.log("Screen currently small?", screen.isSmall);
		if (screen.isSmall && !screen.wasSmall) {
			console.log("Screen was shrunk.");
			let gifs = $('.toggleable-gif');
			for(let i=0; i < gifs.length; i++) {
				console.log(gifs[i]);
				//gifs[i].attr() SCOTT WAS HERE
			}
		}
		else if (!screen.isSmall && screen.wasSmall) {
			console.log("Screen has grown.");
			let gifs = $('.toggleable-gif');
			for(let i=0; i < gifs.length; i++) {
				console.log(gifs[i]);
			}
		}
	}
}

function toggleGifAnimation() {
	let currentlyAnimated = $(this).attr('data-currently-animated');
	if (currentlyAnimated === 'false') {
		$(this).attr('data-currently-animated', true);
		if (screen.isSmall) {
			$(this).attr('src', $(this).attr('data-animated-small-url'));
		}
		else {
			$(this).attr('src', $(this).attr('data-animated-large-url'));
		}
	}
	else {
		$(this).attr('data-currently-animated', false);
		if (screen.isSmall) {
			$(this).attr('src', $(this).attr('data-still-small-url'));
		}
		else {
			$(this).attr('src', $(this).attr('data-still-large-url'));
		}
	}
}

// Initialize display and add event listeners:
screen.checkSize();
displaySearchButtons();
$('#add-new-search-term').on('click', addNewSearchButton);
$(document.documentElement).on('click', '.giffy-search-button', searchGiffy);
$(document.documentElement).on('click', '.toggleable-gif', toggleGifAnimation);
$('form').on('keypress', function() { // Catching enter key here to prevent page from reloading when ENTER key is pressed:
	if (event.key == 'Enter') {
		event.preventDefault();
		addNewSearchButton();
	}
});

$(window).resize(function() { // Essentially a debouncer to check screen size 250ms after a screen change event:
	if(this.resizeTO) clearTimeout(this.resizeTO);
	this.resizeTO = setTimeout(screen.resized, 250);
});