'use strict';

// Configuration options:
const giffyAPIkey = 'LifqQYtiTIo3bDomGTB3jcQOa8jS5LQQ';
const gifsDisplayedPerRequest = 10;
const largeScreenSize = 968;
let topics = ['thumbsup', 'highfive', 'cheers', 'slow clap', 'good job', 'applause', 'grin'];

// Initialization of variables:
let searchButtons = [], // list of search Giffy search terms/buttons
	giffyLastQueryResponses = [], // stores the last giffy query as array of JSON objects
	giffyAllResponses = []; // stores all responses for a given search term (appends if you repeat a search) as array of JSON
let gifDisplayArea = $('#gif-display-area');
let lastSearchTerm = null, searchOffset = 0;

let screen = { // object to track screen size and resize gifs if screen grows or shrinks
	isSmall: true,
	wasSmall: true,
	checkSize: function() {
		if ($(document).width() < largeScreenSize) {
			screen.isSmall = true;
		}
		else {
			screen.isSmall = false;
		}
	},
	resized: function() { // resized is called by a debounced window.resize event
		screen.wasSmall = screen.isSmall;
		screen.checkSize();
		if (screen.isSmall && !screen.wasSmall) {
			redisplayAllGifs('small');
		}
		else if (!screen.isSmall && screen.wasSmall) {
			redisplayAllGifs('large');
		}
	}
}

function addNewSearchButton() {
	let newSearchTerm = $('#new-search-term-text').val().trim().toLowerCase();
	if (newSearchTerm !== "" && !topics.includes(newSearchTerm)) {
		// Don't create empty search buttons, nor allow repeated search terms.
		topics.push(newSearchTerm);
		displaySearchButtons();
	}
	$('#new-search-term-text').val(''); // Clear out the text field for next entry.
}

function animateAllGIFs() { // AKA the fun button
	jQuery.each($('.animated-gif'), function() { 
		enableAnimation($(this));
	});
}

function disableAnimation(image) {
	image.attr('src', image.attr('data-url-still'));
	image.attr('data-animated', 'false');
}

function displaySearchButtons() {
	searchButtons = [];
	topics.forEach(function(searchTerm) {
		searchButtons.push(makeSearchButton(searchTerm));
	});
	$('#search-buttons-area').empty();
	// For performance, append all elements at once to avoid excessive reflow:
	$('#search-buttons-area').append(searchButtons);
}

function enableAnimation(image) {
	image.attr('src', image.attr('data-url-animated'));
	image.attr('data-animated', 'true');
}

function makeImage(giffyJSON) {
	let image = $('<img>');
	image.attr('alt', giffyJSON.title.toLowerCase());
	image.attr('data-animated', 'false');
	image.attr('class', 'animated-gif');
	if (screen.isSmall) {
		image.attr('data-size', 'small');
		image.attr('src', giffyJSON.images.fixed_height_small_still.url);
		image.attr('data-url-still', giffyJSON.images.fixed_height_small_still.url)
		image.attr('data-url-animated', giffyJSON.images.fixed_height_small.url)
	}
	else {
		image.attr('data-size', 'large');
		image.attr('src', giffyJSON.images.fixed_height_still.url);
		image.attr('data-url-still', giffyJSON.images.fixed_height_still.url)
		image.attr('data-url-animated', giffyJSON.images.fixed_height.url)
	}
	return image;
}

function makeImageDiv(giffyJSON) {
	let div = $('<div>');
	div.attr('class', 'toggleable-animation-div');
	let image = makeImage(giffyJSON);
	div.append(image);
	let title = $('<p>').attr('class', 'gif-caption');
	title.text(giffyJSON.title.toLowerCase());
	setTimeout(function() { // resizing the div via timeout in case caption/title is wider than pic
		// Can't resize until we have the width of the element after downloading it.
		let width = image.width() + 'px'
		title.attr('style', `width: ${width};`);
	}, 333);
	let rating = $('<p>').attr('class', 'gif-caption');
	rating.text('Rating: ' + giffyJSON.rating);
	let downloadFileName = giffyJSON.title.toLowerCase() + '.gif'
	let downloadButton = $('<button>');
	downloadButton.text('download');
	downloadButton.attr('data-filename', downloadFileName);
	downloadButton.attr('data-href', giffyJSON.images.original.url)
	downloadButton.attr('class', 'download-button');
	div.append(title);
	div.append(rating);
	div.append(downloadButton);
	return div;
}

function makeSearchButton (searchTerm) { // generates a new button element for new search query
	let searchButton = $('<button>');
	searchButton.text(searchTerm);
	searchButton.attr('class', 'giffy-search-button');
	searchButton.attr('data-search-string', searchTerm);
	return searchButton;
}

function redisplayAllGifs(displaySize) { // necessary after changing screen size
	let gifDivArray = [];
	for (let i = 0; i < giffyAllResponses.length; i++) {
		gifDivArray.push(makeImageDiv(giffyAllResponses[i]));
	}
	$('#gif-display-area').empty();
	gifDisplayArea.append(gifDivArray);
}

function searchGiffy() {
	let searchTerm = $(this).attr('data-search-string');
	if (searchTerm === lastSearchTerm) {
		searchOffset += 10;
	}
	else {
		searchOffset = 0;
	}
    searchTerm = searchTerm.replace(" ", "+");
    giffyLastQueryResponses = [];
	if (searchTerm !== lastSearchTerm) {
		//giffyLastQueryResponses = [];
		giffyAllResponses = [];
		$('#gif-display-area').empty();
	}
    let queryURL = `https://api.giphy.com/v1/gifs/search?q=${searchTerm}&limit=${gifsDisplayedPerRequest}&offset=${searchOffset}&api_key=${giffyAPIkey}`;
    $.ajax({
			url: queryURL,
			method: "GET"
		}).then(function(response) {
			for(let i = 0; i < response.data.length; i++) {
				giffyLastQueryResponses.push(response.data[i]);
				giffyAllResponses.push(response.data[i]);
			}
			let gifDivArray = [];
			for(let i = giffyLastQueryResponses.length - 1; i >= 0; i--) { 
				gifDivArray.push(makeImageDiv(giffyLastQueryResponses[i]));
			} // For performance, append all elements at once to avoid excessive reflow:
			gifDisplayArea.append(gifDivArray);
			lastSearchTerm = searchTerm;
		});
}

function stopAllAnimations() { // aka the no more fun button
	jQuery.each($('.animated-gif'), function() { 
		disableAnimation($(this));
	});
}

function toggleGifAnimation() { // toggle an individual gif's animation on or off
	if ($(this).attr('data-animated') === 'false') {
		enableAnimation($(this));
	}
	else {
		disableAnimation($(this));
	}
}

// Initialize:
screen.checkSize();
displaySearchButtons();

// Events:
$('#add-new-search-term').on('click', addNewSearchButton);

$('#animate-all').on('click', animateAllGIFs);

$('#animate-none').on('click', stopAllAnimations);

$(document.documentElement).on('click', '.giffy-search-button', searchGiffy);

$(document.documentElement).on('click', '.animated-gif', toggleGifAnimation);

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

$(document.documentElement).on('click', '.download-button', function () {
	let link = $(this).attr('data-href');
	let fileName = $(this).attr('data-filename');
    $.ajax({
        url: link,
        method: 'GET',
        xhrFields: {
            responseType: 'blob'
        },
        success: function (data) {
            let a = document.createElement('a');
            let url = window.URL.createObjectURL(data);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        }
    });
});