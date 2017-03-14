'use strict';
class SearchController {

    constructor() {
        //init variables
        this.pageSize = 10;
        this.prevUrl = null;
        this.nextUrl = null;
        this.currentPage = 0;
        this.totalPageCount = 0;
        this.totalResults = 0;

        //init dom elements
        this.txtSearch = document.querySelector("#txtSearch");
        this.busy = document.querySelector("#busy");
        this.errorDiv = document.querySelector(".error");
        this.errorMessage = document.querySelector("#errorMessage");
        this.navNext = document.querySelector("#navNext");
        this.navPrev = document.querySelector("#navPrev");
        this.spanCurrentPage = document.querySelector("#spanCurrentPage");
        this.results = document.querySelector(".results");
        this.spanTotalResults = document.querySelector("#spanTotalResults");
        this.streamContainer = document.querySelector("#streamContainer");
    }

    init() {
        let navIcons = document.querySelectorAll(".navigation");
        let formSearch = document.querySelector("#formSearch");

        //bind events
        navIcons.forEach(nav => nav.addEventListener("click", e => this.navigate(e)));
        formSearch.addEventListener("submit", e => this.handleSearch(e));
    }

    //handle next/prev buttons
    navigate(e) {
        if (e.target.classList.contains("disabled")) return;

        if (e.target === this.navNext) {
            var performed = this.performSearch(this.appendStaticParams(this.nextUrl));
            if (performed) this.currentPage++;
        }
        if (e.target === this.navPrev) {
            var performed = this.performSearch(this.appendStaticParams(this.prevUrl));
            if (performed) this.currentPage--;
        }
    }

    //search button click handler
    handleSearch(e) {
        e.preventDefault();
        let query = this.txtSearch.value;
        let performed = this.performSearch(this.getTwitchSearchUrl(query));
        if (performed) this.currentPage = 1;
    }

    //call url using JSONP
    performSearch(url) {
        if (this.callbackScript) {
            alert("Please wait, a search is already in progress");
            return false;
        }
        this.busy.classList.remove("hidden");
        console.log(url)
        this.callbackScript = document.createElement("script");
        this.callbackScript.type = "text/javascript";
        this.callbackScript.id = "tempscript";
        this.callbackScript.src = url;
        document.body.appendChild(this.callbackScript);
        return true;
    }

    //get url for fresh search
    getTwitchSearchUrl(searchQuery) {
        return this.appendStaticParams(`https://api.twitch.tv/kraken/search/streams?q=${searchQuery}&limit=${this.pageSize}`);
    }

    //append client_id and callback params
    appendStaticParams(url) {
        let client_id = "i3zdtin9640kyqj0bybbv5zn25lh5b";
        return `${url}&client_id=${client_id}&callback=sc.onSearchComplete`;
    }

    //JSONP callback method
    onSearchComplete(data) {
        this.busy.classList.add("hidden");
        console.log(data);
        document.body.removeChild(this.callbackScript);
        this.callbackScript = null;
        if (data.error) {
            this.showError(`some error occurred ${data.error}`);
            return;
        }

        this.renderResult(data);
    }

    //render list of Streams
    renderResult(data) {
        if (!data.streams || data.streams.length === 0) {
            this.showError("No results found!");
            this.results.classList.add("hidden");
            return;
        }

        this.hideError();

        this.totalResults = data._total;
        this.spanTotalResults.textContent = this.totalResults;
        this.totalPageCount = Math.ceil(data._total / this.pageSize);
        this.spanCurrentPage.textContent = `${this.currentPage}/${this.totalPageCount}`;

        if (data._links.next && this.currentPage != this.totalPageCount) {
            this.navNext.classList.remove("disabled");
            this.nextUrl = data._links.next;
        } else { //no more next
            this.navNext.classList.add("disabled");
            this.nextUrl = null;
        }

        if (data._links.prev && this.currentPage != 1) {
            this.navPrev.classList.remove("disabled");
            this.prevUrl = data._links.prev;
        } else { //no more prev
            this.navPrev.classList.add("disabled");
            this.prevUrl = null;
        }

        this.renderStreams(data.streams);
        this.results.classList.remove("hidden");
    }

    //generate stream display html and set into container
    renderStreams(streams) {
        this.streamContainer.innerHTML = streams.map(s => `
    		               <div>
                                <div class="streamResult">
                                    <div style="float:left">
          	                        <img src="${s.preview.medium}" class="streamImage"/>
                                </div>
                                <div style="float:right; text-align:top">
          	                        <span class="gameTitle">${s.game}</span>
                                    <span>${s.game} -  ${s.viewers} viewers</span><br/>
                                    <span>${s.channel.status}</span><br/>
                                </div>
                            </div>
                            `).join('');
    }

    hideError() {
        this.errorDiv.classList.add("hidden");
    }

    showError(msg) {
        this.errorDiv.classList.remove("hidden");
        this.errorMessage.innerHTML = msg;
    }

} //end of class

window.onload = function () {
    //intialize controller
    this.sc = new SearchController();
    sc.init();
}
