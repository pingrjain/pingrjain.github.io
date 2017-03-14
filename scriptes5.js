'use strict';
var pageSize = 10;
var prevUrl = null;
var nextUrl = null;
var currentPage = 0;
var totalPageCount = 0;
var totalResults = 0;
var callbackScript = null;

var txtSearch;
var busy;
var errorDiv;
var errorMessage;
var navNext;
var navPrev;
var spanCurrentPage;
var results;
var spanTotalResults;
var streamContainer;
var navIcons;
var formSearch;


window.onload = function () {
    //init dom elements

    txtSearch = document.querySelector("#txtSearch");
    busy = document.querySelector("#busy");
    errorDiv = document.querySelector(".error");
    errorMessage = document.querySelector("#errorMessage");
    navNext = document.querySelector("#navNext");
    navPrev = document.querySelector("#navPrev");
    spanCurrentPage = document.querySelector("#spanCurrentPage");
    results = document.querySelector(".results");
    spanTotalResults = document.querySelector("#spanTotalResults");
    streamContainer = document.querySelector("#streamContainer");
    navIcons = document.querySelectorAll(".navigation");
    formSearch = document.querySelector("#formSearch");

    init();
}

function init() {

    //bind events
    [].forEach.call(navIcons, function (nav) {
        nav.addEventListener("click", navigate)
    });
    formSearch.addEventListener("submit", handleSearch);
}

function navigate(e) {
    if (e.target.classList.contains("disabled")) return;

    if (e.target === navNext) {
        var performed = performSearch(appendStaticParams(nextUrl));
        if (performed) currentPage++;
    }
    if (e.target === navPrev) {
        var performed = performSearch(appendStaticParams(prevUrl));
        if (performed) currentPage--;
    }
}

//search button click handler
function handleSearch(e) {
    e.preventDefault();
    let query = txtSearch.value;
    let performed = performSearch(getTwitchSearchUrl(query));
    if (performed) currentPage = 1;
}

//call url using JSONP
function performSearch(url) {
    if (callbackScript) {
        alert("Please wait, a search is already in progress");
        return false;
    }
    busy.classList.remove("hidden");
    console.log(url)
    callbackScript = document.createElement("script");
    callbackScript.type = "text/javascript";
    callbackScript.id = "tempscript";
    callbackScript.src = url;
    document.body.appendChild(callbackScript);
    return true;
}

//get url for fresh search
function getTwitchSearchUrl(searchQuery) {
    return appendStaticParams("https://api.twitch.tv/kraken/search/streams?q=" + encodeURI(searchQuery) + "&limit=" + pageSize);
}

//append client_id and callback params
function appendStaticParams(url) {
    let client_id = "i3zdtin9640kyqj0bybbv5zn25lh5b";
    return url + "&client_id=" + client_id + "&callback=onSearchComplete";
}

//JSONP callback method
function onSearchComplete(data) {
    busy.classList.add("hidden");
    console.log(data);
    document.body.removeChild(callbackScript);
    callbackScript = null;
    if (data.error) {
        showError("some error occurred " + data.error);
        return;
    }

    renderResult(data);
}

//render list of Streams
function renderResult(data) {
    if (!data.streams || data.streams.length === 0) {
        showError("No results found!");
        results.classList.add("hidden");
        return;
    }

    hideError();

    totalResults = data._total;
    spanTotalResults.textContent = totalResults;
    totalPageCount = Math.ceil(data._total / pageSize);
    spanCurrentPage.textContent = currentPage + "/" + totalPageCount;

    if (data._links.next && currentPage != totalPageCount) {
        navNext.classList.remove("disabled");
        nextUrl = data._links.next;
    } else { //no more next
        navNext.classList.add("disabled");
        nextUrl = null;
    }

    if (data._links.prev && currentPage != 1) {
        navPrev.classList.remove("disabled");
        prevUrl = data._links.prev;
    } else { //no more prev
        navPrev.classList.add("disabled");
        prevUrl = null;
    }

    renderStreams(data.streams);
    results.classList.remove("hidden");
}

//generate stream display html and set into container
function renderStreams(streams) {
    streamContainer.innerHTML = streams.map(function (s) {
        return '<div><div class="streamResult"><div style="float:left"><img src="' + s.preview.medium + '" class="streamImage"/></div><div style="float:right; text-align:top"><span class="gameTitle">' + s.game + '</span><span>' + s.game + ' - ' + s.viewers + ' viewers</span><br/><span>' + s.channel.status + '</span><br/></div> </div>'
    }).join('');
}

function hideError() {
    errorDiv.classList.add("hidden");
}

function showError(msg) {
    errorDiv.classList.remove("hidden");
    errorMessage.innerHTML = msg;
}
