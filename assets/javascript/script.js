'use strict';

// Configuration options:
const giffyAPIkey = 'LifqQYtiTIo3bDomGTB3jcQOa8jS5LQQ';
const gifsDisplayedPerRequest = 10;
const largeScreenSize = 968;
let topics = ['thumbsup', 'highfive', 'cheers', 'slow clap', 'good job', 'applause', 'grin'];
let captionOffset;

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
		// set top margin so that gifs don't appear below fixed-position header
		let headerHeight = $('header').outerHeight();
		$('main').css('margin-top', headerHeight);
		if ($(document).width() < largeScreenSize) {
			screen.isSmall = true;
			captionOffset = '-100px';
		}
		else {
			screen.isSmall = false;
			captionOffset = '-200px';
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
	//searchButtons = searchButtons.reverse();
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
	let titleElement = $('<p>').attr('class', 'gif-caption');
	let title = giffyJSON.title.toLowerCase();
	title = title.replace(/gif/, ""); // remove gif from filename/title (redundant)
	title = title.replace(/\s{2,}/, " "); // strip out any extra whitespace in name
	title = title.trim(); // strip out extra whitespace at ends of string
	titleElement.text(title);
	setTimeout(function() { // resizing the div via timeout in case caption/title is wider than pic
		// Can't resize until we have the width of the element after downloading it.

		let width = image.width() + 'px'
		titleElement.attr('style', `width: ${width}; top: ${captionOffset}`);
	}, 333);
	let rating = $('<p>').attr('class', 'gif-rating');
	rating.text('Rating: ' + giffyJSON.rating);
	let downloadFileName = title + '.gif'
	let downloadButton = $('<button>');
	downloadButton.text('download');
	downloadButton.attr('data-filename', downloadFileName);
	downloadButton.attr('data-href', giffyJSON.images.original.url)
	downloadButton.attr('class', 'download-button');
	rating.attr('style', `top: ${captionOffset}`);
	div.append(downloadButton);
	div.append(titleElement);
	div.append(rating);
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
	gifDivArray = gifDivArray.reverse();
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
				// Add responses to lastQuery and allQueries arrays
				giffyLastQueryResponses.push(response.data[i]);
				giffyAllResponses.push(response.data[i]);
			}
			let gifDivArray = [];
			for(let i = 0; i < giffyLastQueryResponses.length; i++) {
				// create a new array of divs to add to the page.
				gifDivArray.push(makeImageDiv(giffyLastQueryResponses[i]));
			} // For performance, append all elements at once to avoid excessive reflow:
			gifDivArray.reverse(gifDivArray);
			gifDisplayArea.prepend(gifDivArray);
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
displaySearchButtons();
screen.checkSize();

// Events:
$('#add-new-search-term').on('click', addNewSearchButton);

$('#animate-all').on('click', animateAllGIFs);

$('#animate-none').on('click', stopAllAnimations);

$(document.documentElement).on('click', '.giffy-search-button', searchGiffy);

$(document.documentElement).on('click', '.toggleable-animation-div', function() {
	// Can't target the image directly because the caption overlay interferes with the click event.
	let image = $(this).find('img'); // Find the image within the div.
	toggleGifAnimation.call(image);  // Manually set $(this) with a .call to re-use the toggleGifAnimation function
});

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
        	// I would like to convert this to jQuery syntax, but I don't really know how.
        	// let a2 = $('<a>');
        	// a2.attr('href', link);
        	// a2.attr('download', fileName);
        	// console.log(a2);
        	// a2.trigger('click'); // this does nothing...
            let a = document.createElement('a');
            let url = window.URL.createObjectURL(data);
            console.log('url is', url);
            a.href = url;
            a.download = fileName;
            // console.log(a);
            a.click();
            window.URL.revokeObjectURL(url);
        }
    });
});

$(document.documentElement).on('mouseenter', '.animated-gif', function() {
	let captions = $(this).parent().find('p');
	captions.css('visibility', 'visible');
	
});

$(document.documentElement).on('mouseleave', '.toggleable-animation-div', function() {
	let captions = $(this).find('p');
	captions.css('visibility', 'hidden');
});