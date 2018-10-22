'use strict';

// todo: remove redundant use of searchterm?

// Configuration options:
const giffyAPIkey = 'LifqQYtiTIo3bDomGTB3jcQOa8jS5LQQ';
const preLoadGIFsInBackground = false;
const gifsDisplayedPerRequest = 10;
var topics = ['cats', 'dogs', 'guinea pigs', 'meerkats'];

// Initialization of variables:
var searchButtons = [], gifList = [];
var gifDisplayArea = $('#gif-display-area');
var animatedGifPreloadArray = []; // array of images
var animatedGifIdArray = []; // array of strings that store unique ID tags
var lastSearchTerm = null, searchOffset = 0;

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
	$('#search-buttons-area').append(searchButtons); // for performance, append all elements at once to avoid excessive reflow.
	// Note: pure JS seems to be much faster than jquery, more info here:
	// https://howchoo.com/g/mmu0nguznjg/learn-the-slow-and-fast-way-to-append-elements-to-the-dom
	// I'm only using jQuery because of assignment guidelines in this case.
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
	// todo: consider caching search results? wouldn't work easily with pagination, however. And where to store the results?
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
		}); // end of ajax request
}

function displayGIFs() {
	// todo: append all items at once for performance!!!
	for(let i=0; i < gifList.length; i++) {
		let gifDiv = $('<div>');
		gifDisplayArea.append(gifList[i].imageDiv);
	}
	if (preLoadGIFsInBackground)
	{ // after displaying the still images, pre-load all animated gifs:
		for(let i=0; i < gifList.length; i++) {
			if (!animatedGifIdArray.contains(gifList[i].id)) {
				animatedGifIdArray.push(gifList[i].id);
				let gifToPreload = new Image();
				gifToPreload.src = gifList[i].animatedURL;
				animatedGifPreloadArray.push(gifToPreload);
			}
		}
	}
}

function GiffyObject(gifObject) {
	console.log(gifObject);
	this.staticURL = gifObject.images.original_still.url;
	this.animatedURL = gifObject.images.original.url;
	this.title = gifObject.title;
	this.rating = gifObject.rating;
	this.id = gifObject.id;
	this.imageElement = $('<img>');
	this.imageElement.attr('src', this.staticURL);
	this.imageElement.attr('alt', this.title);
	this.imageElement.attr('class', 'toggleable-gif');
	this.imageElement.attr('data-still-url', this.staticURL);
	this.imageElement.attr('data-animated-url', this.animatedURL);
	this.imageElement.attr('data-currently-animated', 'false');
	this.imageDiv = $('<div>');
	this.imageDiv.attr('class', 'image-div');
	this.imageDiv.append(this.imageElement);
	this.imageDiv.append(`<p>Title: ${this.title}</p>`);
	this.imageDiv.append(`<p>Rating: ${this.rating}</p>`);
	this.downloadButton = $('<button>');
	this.downloadButton.text('Download');
	this.downloadButton.attr('data-download-src', this.animatedURL); // allows default action to be download.
	this.downloadButton.attr('class', 'download-button');
	this.imageDiv.append(this.downloadButton);
	console.log(this.imageDiv);

	// One proposed solution:
	//$("#fileRequest").click(function() {
    // // hope the server sets Content-Disposition: attachment!
    //window.location = 'file.doc';
	//});

	// another:
	// <input type="button" value="Download Now!" onclick="window.location = 'file.doc';">

}

function toggleGifAnimation() {
	let currentlyAnimated = $(this).attr('data-currently-animated');
	if (currentlyAnimated === 'false') {
		$(this).attr('src', $(this).attr('data-animated-url'))
		$(this).attr('data-currently-animated', true);
	}
	else {
		$(this).attr('src', $(this).attr('data-still-url'))
		$(this).attr('data-currently-animated', false);
	}
}

function downloadGif() {
	console.log("Downloading this...");
	console.log(this);
	let downloadURL = $(this).attr('data-download-src');
	window.location.href = downloadURL;
}

// Initialize display and add event listeners:
displaySearchButtons();
$('#add-new-search-term').on('click', addNewSearchButton);
$(document.documentElement).on('click', '.giffy-search-button', searchGiffy);
$(document.documentElement).on('click', '.toggleable-gif', toggleGifAnimation);
$('form').on('keypress', function() {
	// Catching enter key here to prevent page from reloading when ENTER key is pressed.
	if (event.key == 'Enter') {
		event.preventDefault();
		addNewSearchButton();
	}
});
$(document.documentElement).on('click', '.download-button', downloadGif);