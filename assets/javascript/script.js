'use strict';

// Configuration options:
const giffyAPIkey = 'LifqQYtiTIo3bDomGTB3jcQOa8jS5LQQ';
const gifsDisplayedPerRequest = 10;
const largeScreenSize = 968;
let topics = ['thumbsup', 'highfive', 'smile', 'cheers', 'slow clap'];
let tempImage;

// Initialization of variables:
let searchButtons = [], giffyLastQueryResponses = [], giffyAllReponses = [], thumbnails = [];
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
	// console.log('Searching for', searchTerm);
    searchTerm = searchTerm.replace(" ", "+");
	if (searchTerm !== lastSearchTerm) {
		giffyLastQueryResponses = [];
		giffyAllReponses = [];
		$('#gif-display-area').empty();
	}
    let queryURL = `https://api.giphy.com/v1/gifs/search?q=${searchTerm}&limit=${gifsDisplayedPerRequest}&offset=${searchOffset}&api_key=${giffyAPIkey}`;
    $.ajax({
			url: queryURL,
			method: "GET"
		}).then(function(response) {
			// console.log(response);
			for(let i = 0; i < response.data.length; i++) {
				giffyLastQueryResponses.push(response.data[i]);
				giffyAllReponses.push(response.data[i]);
			}
			let gifDivArray = [];
			for(let i = giffyLastQueryResponses.length - 1; i >= 0; i--) { 
				gifDivArray.push(makeImageDiv(giffyLastQueryResponses[i]));
			} // For performance, append all elements at once to avoid excessive reflow:
			gifDisplayArea.append(gifDivArray);
			lastSearchTerm = searchTerm;
		}); //  end of ajax request
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
		// ajax call sorta worked (timing wise it was fine)
		// however, images don't have width until they're displayed on the page.
		// $.ajax({
		// 	url: giffyJSON.images.fixed_height_small_still.url,
		// 	method: "GET"
		// }).then(function() {
		// 	return image;
		// });
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
	setTimeout(function() {
		let width = image.width() + 'px'
		title.attr('style', `width: ${width};`);
	}, 333);
	let rating = $('<p>').attr('class', 'gif-caption');
	rating.text('Rating: ' + giffyJSON.rating);
	div.append(title);
	div.append(rating);
	// let innerDiv = $('<div>');
	// innerDiv.append(title);
	// innerDiv.append(rating);
	// innerDiv.append(innerDiv);
	// div.append(innerDiv);
	return div;
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
			// console.log("Screen was shrunk.");
			redisplayAllGifs('small');
		}
		else if (!screen.isSmall && screen.wasSmall) {
			// console.log("Screen has grown.");
			redisplayAllGifs('large');
		}
	}
}

function animateAllGIFs() {
	jQuery.each($('.animated-gif'), function() { 
		enableAnimation($(this));
	});
}

function stopAllAnimations() {
	jQuery.each($('.animated-gif'), function() { 
		disableAnimation($(this));
	});
}

function redisplayAllGifs(displaySize) {
	let gifDivArray = [];
	for (let i = 0; i < giffyAllReponses.length; i++) {
		gifDivArray.push(makeImageDiv(giffyAllReponses[i]));
	}
	$('#gif-display-area').empty();
	gifDisplayArea.append(gifDivArray);
}

function toggleGifAnimation() {
	console.log(this);
	let theImage = jQuery(this).find("img");
	if (theImage.attr('data-animated') === 'false') {
		enableAnimation(theImage);
	}
	else {
		disableAnimation(theImage);
	}
}

function disableAnimation(image) {
	image.attr('src', image.attr('data-url-still'));
	image.attr('data-animated', 'false');
}

function enableAnimation(image) {
	image.attr('src', image.attr('data-url-animated'));
	image.attr('data-animated', 'true');
}

// Initialize display and add event listeners:
screen.checkSize();
displaySearchButtons();
$('#add-new-search-term').on('click', addNewSearchButton);
$('#animate-all').on('click', animateAllGIFs);
$('#animate-none').on('click', stopAllAnimations);
$(document.documentElement).on('click', '.giffy-search-button', searchGiffy);
$(document.documentElement).on('click', '.toggleable-animation-div', toggleGifAnimation);
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