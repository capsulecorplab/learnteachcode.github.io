(function(){
	const ltc = {};
		ltc.map;
		ltc.meetups = [];
		ltc.markers = {};

	const api = {};
		api.group = 'LearnTeachCode';
		api.perPage = 15;
		api.offset = 0;
		api.path = 'https://api.meetup.com/2/events?&sign=true&photo-host=public';
		api.url = api.path + '&group_urlname=' + api.group + '&page=' + api.perPage;
		api.err = "Error occurred processing Meetup API URL";

	// Get Meetup Data
	function getData(url, successFunc, errMsg) {
		$.ajax({
			type: "GET",
			url: url,
			success: successFunc,
			error: function(){ console.log( errMsg ); },
			dataType: 'jsonp'
		});
	}

	function processData(data) {
		data.results.forEach( function( meetup, index ) {
			// Get event formatted dates and time
			data.results[index].d = getDateFormats( meetup );
		});
		// Append new meetups
		ltc.meetups.push(...data.results);
		// List new meetups
		listMeetups(data);
		mapMeetups(data);
		listMeetupsinWeekView(data);
	}

	function mapMeetups(data){
		let currentMarkers = [];
		if(data.meta.count){
			drawMap();
			data.results.forEach( meetup => {
				// console.log('venue',meetup.venue.name,meetup.venue.id);
				if( Math.abs(meetup.venue.lat) && Math.abs(meetup.venue.lon) ) {
					let meeting = '<li>'+meetup.d.month+' '+meetup.d.d+': <a href="#meetup-'+meetup.id+'" title="'+meetup.name+'">'+meetup.name+'</a></li>';
					meetup.popup = { meetings: [] };
					if( ltc.markers[meetup.venue.id] ) {
						meetup.marker = ltc.markers[meetup.venue.id];
						// console.log('venue exists!', meetup.venue.name, meetup, meetup.popup);
						
						meetup.popup.meetings.push( meeting );
						//let content = meetup.popup.getContent();
						let newContent = meetup.marker.getPopup().getContent().split("</ul>")[0] + meeting + "</ul>";
						meetup.marker.setPopupContent( newContent );
						//console.log( meetup.marker.getPopup().getContent().split("</ul>")[0] + meeting + "</ul>" );
					} else {
						meetup.popup.title = '<strong>' + meetup.venue.name + '</strong>';
						meetup.popup.location = '<br><small>' + meetup.venue.address_1 +', ';
						meetup.popup.location += meetup.venue.city +', '+ meetup.venue.state.toUpperCase();
						meetup.popup.location += ( (meetup.venue.zip)? ', '+meetup.venue.zip : '' )+'</small>';
						meetup.popup.meetings.push( meeting );
						meetup.popup.content = meetup.popup.title + meetup.popup.location;
						meetup.popup.content += "<ul>";
						meetup.popup.meetings.forEach( meeting => {
							meetup.popup.content += meeting;
						});
						meetup.popup.content += "</ul>";
						// console.log(meetup.popup.meetings);

						// let popup = '<a href="'+meetup.event_url+'" title="'+meetup.name+'">'+meetup.name+'</a>';
						meetup.marker = L.marker([meetup.venue.lat, meetup.venue.lon]).bindPopup( meetup.popup.content ).addTo(ltc.map);
						ltc.markers[meetup.venue.id] = meetup.marker;
						currentMarkers.push( meetup.marker );
					}

				}
			});

			if( currentMarkers.length > 0 ) {
				let group = new L.featureGroup( currentMarkers );
				ltc.map.fitBounds( group.getBounds() );
			}
		}
	}

	function drawMap() {
		// If a map has not been created
		if( !ltc.map ) {
			// Add height to map div via active class
			document.getElementById('mapid').classList.add('active');

			// Map Center Coordinates
			let latlng = [ 34.0522, -118.2437 ];  // Los Angeles
			let zoomlevel = 13;                   // Greater LA Metro Zoom view

			// Initialize Map and assign to ltc.map
			ltc.map = L.map('mapid').setView( latlng, zoomlevel );
		
			// Use Open Street Map default (Mapnik)
			// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			// 	maxZoom: 20,
			//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			// }).addTo(ltc.map);
			
			//// CARTO BASE MAPS - FREE TO USE ////
			//// Max use 75,000 map impressions a Month per CartoDB, Inc.
			//// MAP STYLE: Voyager
			// L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
			//// MAP STYLE: Voyager Labels Under
			L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				subdomains: 'abcd',
				maxZoom: 20
			}).addTo(ltc.map);
		}
	}

	// Display Meetup Data
	function listMeetups(data){
		// List Items
		let list = '';

		// Check count of upcoming events
		if(data.meta.count){
			// Get formatted meetups list items
			list = getFormattedMeetups(data.results).join('');
			// If more items are available add a note
			if(data.meta.total_count > data.meta.count && data.meta.count >= api.perPage){
				list += '<li class="load-more"><a href="https://www.meetup.com/LearnTeachCode/events/">Load More</a></li>';
			}
		}else{
			// No upcoming events note
			list += '<li>No Meetups Currently Scheduled. Stay tuned.</li>';
		}

		// Remove load-more button just before adding new elements, which may include new load-more button
		$('.load-more').remove();

		// Add the list to the element
		$(".meetups").append(list);
	}

	// Display Meetup Data in Week View
	function listMeetupsinWeekView(data) {
		let list = [];
		list = getWeekFormattedMeetups(data.results);
		console.log(list);

		let week = getWeekRange();
		console.log(week);
		let thisWeek = [];
		for(let i=1; i < week.length; i++) {
			thisWeek.push('<div>'
				+ week[i].dow.substring(0,3) + ' ' 
				+ week[i].month.substring(0,3) + ' ' 
				+ week[i].date		
				+ '</div>');
		}
		
		//if list[0][i] === date, push to id div

		$('#sunday').append(thisWeek[0] + list[0]);
		$('#monday').append(thisWeek[1] + list[1]);
		$('#tuesday').append(thisWeek[2] + list[2]);
		$('#wednesday').append(thisWeek[3] + list[3]);
		$('#thursday').append(thisWeek[4] + list[4]);
		$('#friday').append(thisWeek[5] + list[5]);
		$('#saturday').append(thisWeek[6] + list[6]);
	}
	// Get Week Range
	function getWeekRange() {
		let d = new Date; //get current date
		let first = d.getDate() - d.getDay(); //result?
		let firstday = (new Date(d.setDate(first - 1))).toUTCString();
		let week = [firstday];
		const weekdays = ['Sunday','Monday','Tueday','Wednesday','Thursday','Friday','Saturday'];
		const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

		for(let i=0; i<7; i++) {
			let next = new Date(d.getTime());
			next.setDate(first+i);
			week.push({
				dow: weekdays[next.getDay()],
				date: next.getDate(),
				month: months[next.getMonth()]
			});
		}
		return week;
	}

	// Format Meetup Data for Week View
	function getWeekFormattedMeetups( meetups ) {
		let sunday = [];
		let monday = [];
		let tuesday = [];
		let wednesday = [];
		let thursday = [];
		let friday = [];
		let saturday = [];
		let formattedMeetupsByWeek = [sunday, monday, tuesday, wednesday, thursday, friday, saturday];

		// For each event create a list item
		meetups.filter( function( meetup ) {
			let d = getDateFormats( meetup );

			let formattedMeetup = '<li id="meetup-' + meetup.id + '" class="week-meetup">'
			+ '<div class="infobox">' 
			+ ' <div class="date">' + d.dowFull + ' ' + d.day + '</div>'
			+ ' <div class="title"><a href="' + meetup.event_url + '">' + meetup.name + '</a></div>'
			+ ' <div>' + meetup.venue.city + ' - ' + meetup.venue.name + '</div>'
			+ '</div>'
			+ '<div>'
			+ ' <div>' + d.time + '</div>'
			+ '</div>'
			+'</li>';

			switch( d.dow ) {
				case "Sun":
					sunday.push(formattedMeetup.toString());
					break;
				case "Mon":
					monday.push(formattedMeetup);
					break;
				case "Tue":
					tuesday.push(formattedMeetup);
					break;
				case "Wed":
					wednesday.push(formattedMeetup);
					break;
				case "Thu":
					thursday.push(formattedMeetup);
					break;
				case "Fri":
					friday.push(formattedMeetup);
					break;
				case "Sat":
					saturday.push(formattedMeetup);
					break;
			}
		});
		console.log(formattedMeetupsByWeek);
		return formattedMeetupsByWeek;
	}
	/**
	 * formatEvents() will get a set of meetups and format accordingly
	 * @param {meetups}
	 * @returns {(object|Array)}
	 */
	function getFormattedMeetups( meetups ) {
		let formattedMeetups = [];

		// For each event create a list item
		meetups.filter( function( meetup ) {
			// Get event formatted dates and time
			let d = getDateFormats( meetup );

			// Formant and add current event to list
			formattedMeetups.push(
				'<li id="meetup-' + meetup.id + '" class="meetup">'
				+ '<div class="datebox">'
				+ ' <div class="dow">' + d.dow + '</div>'
				+ ' <div class="date">' + d.month + ' ' + d.day + '</div>'
				+ ' <div class="time">' + d.time	+ '</div>'
				+ '</div>'
				+ '<div class="infobox">'
				+ ' <div class="title"><a href="' + meetup.event_url + '">' + meetup.name + '</a></div>'
				+ ' <div class="city">' + meetup.venue.city + ' - ' + meetup.venue.name + '</div>'
				+ '</div>'
				+'</li>'
			);
		});
		return formattedMeetups;
	}

	function getDateFormats(meetup) {
		const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		const weekdays = ['Sunday','Monday','Tueday','Wednesday','Thursday','Friday','Saturday'];
		const dt = new Date(meetup.time);

		// Setup event date info
		let d = {};
		d.year = dt.getFullYear();
		d.yyyy = d.year;
		d.monthFull = months[dt.getMonth()];
		d.month = d.monthFull.substring(0, 3);
		d.m = dt.getMonth()+1;
		d.mm = (d.m > 9)? d.m : "0"+d.m;
		d.d = dt.getDate();
		d.dowFull = weekdays[dt.getDay()];
		d.dow = d.dowFull.substring(0, 3);
		d.day = (d.d > 9)? d.d : "0"+d.d;
		d.dd = d.day;
		d.time = formatAMPM( dt );
		return d;
	}

	function formatAMPM(date) {
		let hours = date.getHours();
		let minutes = date.getMinutes();
		let ampm = hours >= 12 ? 'pm' : 'am';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		minutes = minutes < 10 ? '0'+minutes : minutes;
		let strTime = hours + ':' + minutes + ' ' + ampm;
		return strTime;
	}

	/**
	 * Get initial set of group meetups
	 */
	$(document).ready(function() {
		// Get intial set of meetups
		getData( api.url, processData, api.err);

		// Toggle between calendar and list views
		$( "#weekbutton" ).on('click', function() {     
			$('.meetups').hide();
			$('.weekview').show();
		});

		$( "#listbutton" ).on('click', function() {     
			$('.weekview').hide();
			$('.meetups').show();
		});

		// Click Event for Load More
		$('.meetups').on('click','.load-more a',function(e) {
			e.preventDefault();
			api.offset++;
			getData( api.url + '&offset=' + api.offset, processData, api.err);
		});

		// Click Popup Event (when it exists) link to go to info
		$('#mapid').on('click', '.leaflet-popup-content a', function(evt) {
			evt.preventDefault();
			let id = evt.target.hash.replace("#", "");
			let meetupListItem = document.getElementById( id );
			meetupListItem.scrollIntoView();
			meetupListItem.classList.add('active');
			setTimeout( () => { meetupListItem.classList.remove('active'); }, 3000);
		});

	});

})();
